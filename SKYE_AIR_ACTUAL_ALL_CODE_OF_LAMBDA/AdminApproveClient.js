var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});
var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({
    "region": process.env.AwsRegionForPool
});
var MigrationClientId = process.env.MigrationClientId;

exports.handler = (event, context, callback) => {

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    wf.once('check_request_body', function () {
        console.log(cognitoidentityserviceprovider)
        console.log(MigrationClientId)
        console.log(event.body);
        wf.EmailId = event.body;
        console.log("wf.EmailId", wf.EmailId);
        wf.emit('get_user_details_from_db');
    });

    wf.once('get_user_details_from_db', function () {
        var params = {
            TableName: process.env.TableName,
            Key: {
                "EmailId": wf.EmailId,
            }
        };
        console.log(params);
        // let data = {'data' : event.pathParameters.clientId}
        // return data

        docClient.get(params, function (err, data) {
            console.log("Error", err)
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
                wf.ClientId = data.Item.ClientId
                console.log("ClientId", wf.ClientId)
                wf.emit('Enable_User')
            }
        });
    });

    wf.once('Enable_User', function () {

        cognitoidentityserviceprovider.adminEnableUser({
            UserPoolId: process.env.UserPoolId, /* required */
            Username: wf.ClientId /* required */
        }, function (err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
                console.log("cognitoidentityserviceprovider", cognitoidentityserviceprovider)
            }
            else {
                console.log("cognitoidentityserviceprovider", cognitoidentityserviceprovider)
                wf.emit("update_user_status_in_db")
            }
        });
    })

    wf.once("update_user_status_in_db", function () {
        const params = {
            TableName: process.env.TableName,
            Key: {
                "EmailId": wf.EmailId,
            },
            UpdateExpression: 'set UserActive = :y,ApproverName = :x,ContractStatus = :a',
            ExpressionAttributeValues: {
                ':y': true,
                ':x':"Swapnik",
                ':a':"800 flights/month"
            },
            ReturnValues: 'ALL_NEW',
        };
        console.log(params);

        docClient.update(params, function (err, data) {
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
                context.done(null, {
                    "data": {
                        "MainData": "Client Approved"
                    },
                    "error": null,
                    "statusCode": 200
                });
                return;
            }
        });
    });

    wf.emit('check_request_body');
};
