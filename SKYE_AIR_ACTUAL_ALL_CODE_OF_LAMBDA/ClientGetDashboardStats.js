var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});
const ClientTable = process.env.ClientTable
const OrganizationTable = process.env.OrganizationTable
const FlightTable = process.env.FlightTable

exports.handler = (event, context, callback) => {
    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter()

    wf.once('check_request_body', function () {
        var parameters = '/';
        var Client = new Object();
        Client.ClientId = event.body.hasOwnProperty('ClientId') == true ? event.body.ClientId.length == 0 ? event.body.ClientId = '' : event.body.ClientId : '';

        if (Client.ClientId.length == 0) { parameters = parameters + 'ClientId/' }


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
            wf.ClientId = Client.ClientId
            wf.emit('get_organizationID_from_CliengtProfile');
        }
    })

    wf.once('get_organizationID_from_CliengtProfile', function () {
        console.log(wf.ClientId)
        const params = {
            TableName: ClientTable,
            IndexName: 'ClientId',
            KeyConditionExpression: 'ClientId = :cityVal',
            ExpressionAttributeValues: {
                ':cityVal': wf.ClientId
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
                wf.OrganizationId = data.Items[0].OrganizationId
                console.log(wf.OrganizationId)
                wf.emit('get_remainingFlight_list_From_Organization')
            }
        })
    })

    wf.once('get_remainingFlight_list_From_Organization', function () {
        const params = {
            TableName: OrganizationTable,
            Key: {
                "OrganizationId": wf.OrganizationId
            }
        }
        console.log(params)
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
                wf.remainingFlights = data.Item.NumOfFlightsAvailable
                console.log(wf.remainingFlights)
                wf.emit('get_ScheduledFlight')
            }
        })
    })

    wf.once('get_ScheduledFlight', function () {
        const params = {
            TableName: FlightTable,
            FilterExpression: "#OrganizationId =:OrganizationId AND #Status = :Status",
            ExpressionAttributeNames: {
                "#OrganizationId": "OrganizationId",
                "#Status": "Status",
            },
            ExpressionAttributeValues: {
                ':OrganizationId': wf.OrganizationId,
                ":Status": "Scheduled"
            }
        };

        docClient.scan(params, function (err, data) {
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
                console.log("Count", data.Count);
                wf.ScheduledFlight = data.Count
                wf.emit('get_CompletedFlight')
            }
        })
    })

    wf.once('get_CompletedFlight', function () {
        const params = {
            TableName: FlightTable,
            FilterExpression: "#OrganizationId = :OrganizationId AND #Status = :Status",
            ExpressionAttributeNames: {
                "#OrganizationId": "OrganizationId",
                "#Status": "Status",
            },
            ExpressionAttributeValues: {
                ':OrganizationId': wf.OrganizationId,
                ":Status": "Delivered"
            }
        };

        docClient.scan(params, function (err, data) {
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
                console.log("Count", data.Count);
                wf.CompletedFlight = data.Count
                context.done(null, {
                    "data": {
                        "MainData": {
                            "Completed Flight": wf.CompletedFlight,
                            "Scheduled Flight": wf.ScheduledFlight,
                            "Remaining Flight": wf.remainingFlights
                        }
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
