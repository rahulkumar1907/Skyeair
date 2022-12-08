var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});

var ses = new AWS.SES({ apiVersion: '2010-12-01', region: process.env.AwsRegionForEmail });

const MasterTableName = process.env.MasterTableName
const FlightTable = process.env.FlightTable
var EmailTemplateName = process.env.EmailTemplateName;
var FromAddress = process.env.FromAddress;
var ToAddresss1 = process.env.ToAddresss1;
var ToAddresss2 = process.env.ToAddresss2;
var BCCAddress1 = process.env.BCCAddress1;

exports.handler = (event, context, callback) => {
    console.log(event.body, "Body");
    var Created_Timestamp = new Date().toISOString();

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    wf.once('check_request_body', function () {
        var parameters = '/';
        var Flight = new Object();
        Flight.FlightId = event.body.hasOwnProperty('FlightId') == true ? event.body.FlightId.length == 0 ? event.body.FlightId = '' : event.body.FlightId : '';
        Flight.StartTime = event.body.hasOwnProperty('StartTime') == true ? event.body.StartTime.length == 0 ? event.body.StartTime = '' : event.body.StartTime : '';
        Flight.EndTime = event.body.hasOwnProperty('EndTime') == true ? event.body.EndTime.length == 0 ? event.body.EndTime = '' : event.body.EndTime : '';
        Flight.PackageType = event.body.hasOwnProperty('PackageType') == true ? event.body.PackageType.length == 0 ? event.body.PackageType = '' : event.body.PackageType : '';
        
        console.log("err1")

        if (Flight.FlightId.length == 0) { parameters = parameters + 'FlightIdId/' }

        if (parameters.length > 1) {
            console.log("error1")
            context.fail(JSON.stringify({
                "data": null,
                "error": {
                    "code": 400,
                    "message": "Missing/Invalid parameters " + parameters,
                    "type": "Missing/Invalid parameters",
                    "should_display_error": "false"
                },
                "statusCode": 400
            }));
            return;
        } 
        if (Flight.StartTime.length==0 && Flight.EndTime.length==0 && Flight.PackageType.length==0) {
            context.fail(JSON.stringify({
                "data": null,
                "error": {
                    "code": 400,
                    "message": "Need atleast one field to update",
                    "type": "Missing/Invalid parameters",
                    "should_display_error": "false"
                },
                "statusCode": 400
            }))
            return
        }
        else {
            wf.StartTime = Flight.StartTime
            wf.EndTime = Flight.EndTime
            wf.PackageType = Flight.PackageType
            wf.emit('get_oldFlightDetails')
        }
    })

    wf.once('get_oldFlightDetails', function () {
        const params = {
            TableName: FlightTable,
            Key: {
                "FlightId": event.body.FlightId
            }
        }

        docClient.get(params, function (err, data) {
            if (err) {
                context.fail(JSON.stringify({
                    "data": null,
                    "error": {
                        "code": 404,
                        "message": "Internal Server Error", err,
                        "type": "Server Error",
                        "should_display_error": "false"
                    },
                    "statusCode": 404
                }));
                return
            }
            else {
                wf.updatedFlightDetails = data.Item
                wf.updatedFlightDetails.TS_Created = Created_Timestamp
                wf.updatedFlightDetails.TS_Updated = Created_Timestamp 
                wf.emit("change_Flightstatus_in_DB")
            }
        })
    })
    
    wf.once('change_Flightstatus_in_DB', function () {
        
        const params = {
            "TableName": FlightTable,
            Key: {
                "FlightId": wf.updatedFlightDetails.FlightId,
            },
            ReturnValues: 'ALL_NEW',
            UpdateExpression: 'set #Status = :Status',
            ExpressionAttributeNames: {
                '#Status': 'Status',
            },
            ExpressionAttributeValues: {
                ':Status': 'Cancelled'
            },
        };
        
        docClient.update(params,function(err,data){
            if(err){
                console.log("Error",err);
                context.fail(JSON.stringify({
                    "data": null,
                    "error": {
                        "code": 500,
                        "message": "Internal server error",
                        "type": "Server Error",
                        "should_display_error": "false"
                    },
                    "statusCode": 500
                }));
                return;
            }
            else{
                wf.emit('get_counter_from_db')
            }
        });        
    })
    
    wf.once('get_counter_from_db', function () {
        docClient.update({
            "TableName": MasterTableName,
            "Key": {
                "Module": "FlightCounter"
            },
            "ExpressionAttributeValues": {
                ":a": 1
            },
            "ExpressionAttributeNames": {
                "#v": "CounterId"
            },
            "UpdateExpression": "SET #v = #v + :a",
            "ReturnValues": "UPDATED_NEW"

        }, function (err, data) {
            if (err) {
                console.log(err);
                context.fail(JSON.stringify({
                    "data": null,
                    "error": {
                        "code": 500,
                        "message": "Internal server error",
                        "type": "Server Error",
                        "should_display_error": "false"
                    },
                    "statusCode": 500
                }));
                return;
            } else {
                console.log("Data", data);
                console.log(data.Attributes.CounterId);
                var str = "" + data.Attributes.CounterId;
                var pad = "00000";
                var ans = pad.substring(0, pad.length - str.length) + str;
                wf.updatedFlightDetails.FlightId = "Flight" + ans;
                wf.updatedFlightDetails.OrderId = wf.updatedFlightDetails.FlightId
                wf.updatedFlightDetails.Status = "Processing"
                if(wf.StartTime.length > 0) wf.updatedFlightDetails.StartTime = wf.StartTime
                if(wf.EndTime.length > 0) wf.updatedFlightDetails.EndTime = wf.EndTime
                if(wf.PackageType.length > 0) wf.updatedFlightDetails.PackageType = wf.updatedFlightDetail.PackageType
                wf.emit('register_flightDetails_to_table');
            }
        });
    })
    
     wf.once('register_flightDetails_to_table', function () {
        var params = {
            "TableName": FlightTable,
            Item: wf.updatedFlightDetails
        };
        console.log("Flight", wf.updatedFlightDetails)
        docClient.put(params, function (err, data) {
            if (err) {
                console.log("error7")
                console.log(err);
                context.fail(JSON.stringify({
                    "data": null,
                    "error": {
                        "code": 500,
                        "message": "Internal server error",
                        "should_display_error": "false"
                    },
                    "type": "Server Error",
                    "statusCode": 500
                }));
                return;
            } else {
                wf.emit('send_email_to_admin')
            }
        })
    })
    
    wf.once("send_email_to_admin", function () {

        wf.loginURL = `https://admin-approve-client-test.s3.ap-south-1.amazonaws.com/AdminApproveFlight.html?flightid=${wf.updatedFlightDetails.FlightId}`

        wf.TemplateData = "{ \"FlightId\":\""+wf.updatedFlightDetails.FlightId+"\", \"OrderId\":\""+wf.updatedFlightDetails.OrderId+"\",\"SkyTunnelId\":\""+wf.updatedFlightDetails.SkyTunnelId+"\", \"StartTime\":\""+wf.updatedFlightDetails.StartTime+"\", \"EndTime\":\""+wf.updatedFlightDetails.EndTime+"\",\"NumOfPackages\":\""+wf.updatedFlightDetails.NoOfPackages+"\",\"PackageType\":\""+wf.updatedFlightDetails.PackageType+"\",\"PackageWeight\":\""+wf.updatedFlightDetails.PackageWeight+"\",\"PackageCategory\":\""+wf.updatedFlightDetails.PackageCategory+"\", \"PackageCondition\":\""+wf.updatedFlightDetails.PackageCondition+"\",\"VolumetricWeight\":\""+wf.updatedFlightDetails.VolumetricWeight+"\",\"PickupTime\":\""+wf.updatedFlightDetails.PickupTime+"\",\"ColdChain\":\""+wf.updatedFlightDetails.ColdChain+"\",\"DroneId\":\""+wf.updatedFlightDetails.DroneId+"\",\"DroneName\":\""+wf.updatedFlightDetails.DroneName+"\",\"ClientId\":\""+wf.updatedFlightDetails.ClientId+"\",\"OrganizationId\":\""+wf.updatedFlightDetails.OrganizationId+"\",\"ApproveLink\":\""+wf.loginURL+"\"}";
        var params = {
            "Source": FromAddress,
            "Template": EmailTemplateName,
            "Destination": {
                "ToAddresses": [ToAddresss1,ToAddresss2],
                "CcAddresses": [],
                "BccAddresses": [BCCAddress1]
            },            
            "TemplateData": wf.TemplateData
        };

        //console.log(params);
        ses.sendTemplatedEmail(params, function (err, data) {
            if (err) {
                console.log(err);
            }
            else {
                context.done(null, {
                    "data": {
                        "MainData": "Flight Details Updated successfully"
                    },
                    "error": null,
                    "statusCode": 200
                });
                return;
            }  
        });     
    });

    wf.emit('check_request_body')
};
