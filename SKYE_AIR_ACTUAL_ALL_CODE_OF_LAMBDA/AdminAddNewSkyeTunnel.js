var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});

const TableName = process.env.TableName;
const MasterTableName = process.env.MasterTableName

exports.handler = (event, context, callback) => {
    console.log(event.body, "Body");
    var Created_Timestamp = new Date().toISOString();

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();
    wf.once('check_request_body', function () {
        var parameters = '/';
        // var skyeTunnel = event.body;

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
            console.log("sucess1")
            wf.emit('get_counter_from_db');
            wf.skyeTunnelDetails = event.body
            console.log(wf.skyeTunnelDetails)
        }
    })

    wf.once('get_counter_from_db', function () {
        docClient.update({
            "TableName": MasterTableName,
            "Key": {
                "Module": "SkyeTunnelCounter"
            },
            "ExpressionAttributeValues": {
                ":a": 1
            },
            "ExpressionAttributeNames": {
                "#v": "CounterId"
            },
            "UpdateExpression": "SET #v = #v + :a",
            "ReturnValues": "UPDATED_NEW"

        },function (err, data) {
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
                console.log(data.Attributes.CounterId);
                var strOrganization = "" + data.Attributes.CounterId;
                var padOrganization = "00000";
                var ans = padOrganization.substring(0, padOrganization.length - strOrganization.length) + strOrganization;
                wf.skyeTunnelDetails.SkyeTunnelId = "SkyeTunnel" + ans;
                console.log("OrganisationNmae", wf.skyeTunnelDetails.SkyeTunnelId)
                wf.emit('store_to_skyetunnel_table');
            }
        });
    })

    wf.once("store_to_skyetunnel_table", function () {
        var param = {
            TableName: TableName,
            Item: wf.skyeTunnelDetails
        }
        docClient.put(param, function (err, data) {
            if (err) {
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
                console.log("sucess3")
                context.done(null, {
                    "data": {
                        "MainData": "Details Inserted successfully"
                    },
                    "error": null,
                    "statusCode": 200
                });
                return;
            }
        })
    })

    wf.emit('check_request_body')
};
