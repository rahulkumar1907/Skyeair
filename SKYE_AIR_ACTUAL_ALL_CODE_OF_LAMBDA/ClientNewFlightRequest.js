var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});

var ses = new AWS.SES({ apiVersion: '2010-12-01', region: process.env.AwsRegionForEmail });

const ClientTable = process.env.ClientTable
const MasterTableName = process.env.MasterTableName
const FlightTable = process.env.FlightTable
const SkyeTunnelTable = process.env.SkyeTunnelTable
var EmailTemplateName   = process.env.EmailTemplateName;
var FromAddress   = process.env.FromAddress;
var ToAddresss1   = process.env.ToAddresss1;
var ToAddresss2   = process.env.ToAddresss2;
var BCCAddress1   = process.env.BCCAddress1;

exports.handler = (event, context, callback) => {
    console.log(event.body, "Body");
    var Created_Timestamp = new Date().toISOString();

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    function Trim(string) {
        string = string.replace(/ {1,}/g, " ");
        return string.trim();
    }

    wf.once('check_request_body', function () {
        var parameters = '/';
        var Flight = new Object();
        Flight.SkyTunnelId = event.body.hasOwnProperty('SkyTunnelId') == true ? event.body.SkyTunnelId.length == 0 ? event.body.SkyTunnelId = '' : event.body.SkyTunnelId : '';
        Flight.PickUpLocation = event.body.hasOwnProperty('PickUpLocation') == true ? event.body.PickUpLocation.length == 0 ? event.body.PickUpLocation = '' : event.body.PickUpLocation : '';
        Flight.DeliveryLocation = event.body.hasOwnProperty('DeliveryLocation') == true ? event.body.DeliveryLocation.length == 0 ? event.body.DeliveryLocation = '' : event.body.DeliveryLocation : '';
        Flight.FlightDuration = event.body.hasOwnProperty('FlightDuration') == true ? event.body.FlightDuration.length == 0 ? event.body.FlightDuration = '' : event.body.FlightDuration : '';
        Flight.FlightDistance = event.body.hasOwnProperty('FlightDistance') == true ? event.body.FlightDistance.length == 0 ? event.body.FlightDistance = '' : event.body.FlightDistance : '';
        Flight.StartTime = event.body.hasOwnProperty('StartTime') == true ? event.body.StartTime.length == 0 ? event.body.StartTime = '' : event.body.StartTime : '';
        Flight.PackageType = event.body.hasOwnProperty('PackageType') == true ? event.body.PackageType.length == 0 ? event.body.PackageType = '' : event.body.PackageType : '';
        Flight.PackageWeight = event.body.hasOwnProperty('PackageWeight') == true ? event.body.PackageWeight.length == 0 ? event.body.PackageWeight = '' : event.body.PackageWeight : '';
        Flight.PickupTime = event.body.hasOwnProperty('PickupTime') == true ? event.body.PickupTime.length == 0 ? event.body.PickupTime = '' : event.body.PickupTime : '';
        Flight.VolumetricWeight = event.body.hasOwnProperty('VolumetricWeight') == true ? event.body.VolumetricWeight.length == 0 ? event.body.VolumetricWeight = '' : event.body.VolumetricWeight : '';
        Flight.ColdChain = event.body.hasOwnProperty('ColdChain') == true ? event.body.ColdChain.length == 0 ? event.body.ColdChain = '' : event.body.ColdChain : '';
        Flight.ClientId = event.body.hasOwnProperty('ClientId') == true ? event.body.ClientId.length == 0 ? event.body.ClientId = '' : event.body.ClientId : '';



        if (Flight.SkyTunnelId.length == 0) { parameters = parameters + 'SkyTunnelId/' }
        if (Flight.PickUpLocation.length == 0) { parameters = parameters + 'PickUpLocation/' }
        if (Flight.DeliveryLocation.length == 0) { parameters = parameters + 'DeliveryLocation/' }
        if (Flight.FlightDuration.length == 0) { parameters = parameters + 'FlightDuration/' }
        if (Flight.FlightDistance.length == 0) { parameters = parameters + 'FlightDistance/' }
        if (Flight.StartTime.length == 0) { parameters = parameters + 'StartTime/' }
        if (Flight.PackageType.length == 0) { parameters = parameters + 'PackageType/' }
        if (Flight.PackageWeight.length == 0) { parameters = parameters + 'PackageWeight/' }
        if (Flight.PickupTime.length == 0) { parameters = parameters + 'PickupTime/' }
        if (Flight.VolumetricWeight.length == 0) { parameters = parameters + 'VolumetricWeight/' }
        if (Flight.ColdChain.length == 0) { parameters = parameters + 'ColdChain/' }
        if (Flight.ClientId.length == 0) { parameters = parameters + 'ClientId/' }

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
        } else {
            wf.flightDetails = {
                SkyTunnelId: event.body.SkyTunnelId,
                PickUpLocation: event.body.PickUpLocation,
                DeliveryLocation: event.body.DeliveryLocation,
                FlightDuration: event.body.FlightDuration,
                FlightDistance: event.body.FlightDistance,
                StartTime: event.body.StartTime,
                PackageType: event.body.PackageType,
                PackageWeight: event.body.PackageWeight,
                PickupTime: event.body.PickupTime,
                VolumetricWeight: event.body.VolumetricWeight,
                ColdChain: event.body.ColdChain,
                ClientId: event.body.ClientId,
                TS_Created: Created_Timestamp,
                TS_Updated: Created_Timestamp,
                EndTime: event.body.EndTime
            }

            wf.emit('get_waypoint_details_from_skyetunnel');
        }
    })
    
    wf.once('get_waypoint_details_from_skyetunnel', function () {
        console.log(wf.flightDetails.SkyTunnelId)
        var params = {
            "TableName": SkyeTunnelTable,
            Key : {
                "SkyeTunnelId" : wf.flightDetails.SkyTunnelId
            }
        };

        docClient.get(params, function (err, data) {
            if (err) {
                console.log("error2")
                console.log("Error", err);
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
            else {
                wf.flightDetails.Altitude = data.Item.Altitude;
                wf.flightDetails.BufferRegion = data.Item.BufferRegion;
                wf.flightDetails.Latitude = data.Item.Latitude;
                wf.flightDetails.Longitude = data.Item.Longitude;
                wf.flightDetails.MaximumAltitude = data.Item.MaximumAltitude;
                wf.flightDetails.wayPointFileDetails = data.Item.wayPointFileDetails;
                wf.flightDetails.WayPointNum = data.Item.WayPointNum;
                wf.flightDetails.Waypoints = data.Item.Waypoints;
                wf.flightDetails.DroneId = data.Item.DroneId;
                wf.flightDetails.DroneName = data.Item.DroneName;
                wf.flightDetails.ActivityType = data.Item.ActivityType;
                wf.flightDetails.Pilotdetails = data.Item.Pilotdetails;
                console.log(wf.flightDetails)
                wf.emit('get_organizationID_from_ClientProfile')
            }
        })
    })

    wf.once('get_organizationID_from_ClientProfile', function () {
        console.log(wf.ClientId)
        var params = {
            "TableName": ClientTable,
            IndexName: 'ClientId',
            KeyConditionExpression: 'ClientId = :clientVal',
            ExpressionAttributeValues: {
                ':clientVal': wf.flightDetails.ClientId
            }
        };

        docClient.query(params, function (err, data) {
            if (err) {
                console.log("error2")
                console.log("Error", err);
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
            else {
                wf.flightDetails.OrganizationId = data.Items[0].OrganizationId
                wf.flightDetails.CreatedByName = data.Items[0].FirstName
                console.log(wf.flightDetails)
                wf.emit('get_counter_from_db')
            }
        })
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
                wf.flightDetails.FlightId = "Flight" + ans;
                wf.flightDetails.OrderId = wf.flightDetails.FlightId
                wf.flightDetails.Status = "Processing"
                wf.emit('register_flightDetails_to_table');
            }
        });
    });

    wf.once('register_flightDetails_to_table', function () {
        var params = {
            "TableName": FlightTable,
            Item: wf.flightDetails
        };
        console.log("Client", wf.clientDetails)
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

        wf.loginURL = `https://admin-approve-client-test.s3.ap-south-1.amazonaws.com/AdminApproveFlight.html?flightid=${wf.flightDetails.FlightId}`

        wf.TemplateData = "{ \"FlightId\":\""+wf.flightDetails.FlightId+"\", \"OrderId\":\""+wf.flightDetails.OrderId+"\",\"SkyTunnelId\":\""+wf.flightDetails.SkyTunnelId+"\", \"StartTime\":\""+wf.flightDetails.StartTime+"\", \"EndTime\":\""+wf.flightDetails.EndTime+"\",\"PackageType\":\""+wf.flightDetails.PackageType+"\",\"PackageWeight\":\""+wf.flightDetails.PackageWeight+"\",\"VolumetricWeight\":\""+wf.flightDetails.VolumetricWeight+"\",\"PickupTime\":\""+wf.flightDetails.PickupTime+"\",\"ColdChain\":\""+wf.flightDetails.ColdChain+"\",\"DroneId\":\""+wf.flightDetails.DroneId+"\",\"DroneName\":\""+wf.flightDetails.DroneName+"\",\"ClientId\":\""+wf.flightDetails.ClientId+"\",\"OrganizationId\":\""+wf.flightDetails.OrganizationId+"\",\"ApproveLink\":\""+wf.loginURL+"\"}";
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
                        "MainData": "Flight Details Inserted successfully"
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
