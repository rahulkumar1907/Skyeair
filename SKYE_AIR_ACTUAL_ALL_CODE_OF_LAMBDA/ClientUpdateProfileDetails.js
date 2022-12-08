var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});

const TableName = process.env.Table;

exports.handler = (event, context, callback) => {
    var Created_Timestamp = new Date().toISOString();

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    function Trim(string) {
        string = string.replace(/ {1,}/g, " ");
        return string.trim();
    }

    wf.once('check_request_body', function () {
        var parameters = '/';
        var Client = new Object();
        Client.EmailId = event.body.hasOwnProperty('EmailId') == true ? event.body.EmailId.length == 0 ? event.body.EmailId = '' : event.body.EmailId : '';
        if (Client.EmailId.length == 0) {
            parameters = parameters + 'EmailId/'
            { context.fail(JSON.stringify({ "data": null, "error": { "code": 400, "message": "Missing/Invalid parameters " + parameters, "type": "Missing/Invalid parameters", "should_display_error": "false" }, "statusCode": 400 })); return; }
        }
        Client.FirstName = event.body.hasOwnProperty('FirstName') == true ? event.body.FirstName.length == 0 ? event.body.FirstName = '' : event.body.FirstName : '';
        Client.LastName = event.body.hasOwnProperty('LastName') == true ? event.body.LastName.length == 0 ? event.body.LastName = '' : event.body.LastName : '';
        Client.Country = event.body.hasOwnProperty('Country') == true ? event.body.Country.length == 0 ? event.body.Country = '' : event.body.Country : '';
        Client.Organization = event.body.hasOwnProperty('Organization') == true ? event.body.Organization.length == 0 ? event.body.Organization = '' : event.body.Organization : '';

        if (!Client.FirstName && !Client.LastName && !Client.Organization && !Client.Country) {
            { context.fail(JSON.stringify({ "data": null, "error": { "code": 400, "message": "Nothing to update", "type": "Missing/Invalid parameters", "should_display_error": "false" }, "statusCode": 400 })); return; }
        }
        wf.Client = Client


        wf.emit('get_client_details')
    });


    wf.once('get_client_details', function () {
        var params = {
            TableName: TableName,
            Key: {
                "EmailId": event.body.EmailId
            }
        };
        docClient.get(params, function (err, data) {
            if (err) {
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
                if (!data.Item) {
                    context.fail(JSON.stringify({
                        "data": null,
                        "error": {
                            "code": 404,
                            "message": "Data don't Exist",
                            "type": "Server Error",
                            "should_display_error": "false"
                        },
                        "statusCode": 404
                    }));
                    return
                }
                else {
                    //console.log(data.Item)
                    if(wf.Client.FirstName.length == 0) wf.Client.FirstName = data.Item.FirstName
                    if(wf.Client.LastName.length == 0) wf.Client.LastName = data.Item.LastName
                    if(wf.Client.Organization.length == 0) wf.Client.Organization = data.Item.Organization
                    if(wf.Client.Country.length == 0) wf.Client.Country = data.Item.Country
                    wf.emit("update_client_details")
                }
            }
        })
    });

    wf.once("update_client_details", function () {
        const params = {
            TableName: TableName,
            Key: {
                "EmailId": event.body.EmailId,
            },
            UpdateExpression: 'set FirstName = :y,LastName = :r,Organization = :x,Country = :z',
            ExpressionAttributeValues: {
                ':y': wf.Client.FirstName,
                ':r': wf.Client.LastName,
                ':x':wf.Client.Organization,
                ':z':wf.Client.Country
            },
            ReturnValues: 'ALL_NEW',
        };
        
        docClient.update(params,function(err,data){
            if(err){
                context.fail(JSON.stringify({
                        "data": null,
                        "error": {
                            "code": 404,
                            "message": "Internal Server Error",err,
                            "type": "Server Error",
                            "should_display_error": "false"
                        },
                        "statusCode": 404
                    }));
                    return
            }
            else{
                context.done(null, {
                            "data": {
                                "MainData": "Details Updated Successfully"
                            },
                            "error": null,
                            "statusCode": 200
                        });
                        return;
            }
        })
        
    })
    wf.emit('check_request_body');

};