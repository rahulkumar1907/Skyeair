var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});
const FlightTable = process.env.FlightTable

exports.handler = (event, context, callback) => {

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    wf.once('check_request_body', function () {
        var parameters = '/';
        var FlightDetails = new Object();
        FlightDetails.ClientId = event.body.hasOwnProperty('ClientId') == true ? event.body.ClientId.length == 0 ? event.body.ClientId = '' : event.body.ClientId : '';
        FlightDetails.Location = event.body.hasOwnProperty('Location') == true ? event.body.Location.length == 0 ? event.body.Location = '' : event.body.Location : '';
        FlightDetails.StartTime = event.body.hasOwnProperty('StartTime') == true ? event.body.StartTime.length == 0 ? event.body.StartTime = '' : event.body.StartTime : '';
        FlightDetails.EndTime = event.body.hasOwnProperty('EndTime') == true ? event.body.EndTime.length == 0 ? event.body.EndTime = '' : event.body.EndTime : '';



        if (event.body.Status) {
            FlightDetails.Status = event.body.Status
            if (FlightDetails.Status.includes("Processing")) {
                console.log(FlightDetails.Status.includes("Processing"))
                wf.Processing = "Processing"
            }else wf.Processing = ""
            if (FlightDetails.Status.includes("Scheduled")) {
                console.log(FlightDetails.Status.includes("Scheduled"))
                wf.Scheduled = "Scheduled"
            }else wf.Scheduled = ""

            if (FlightDetails.Status.includes("In Transit")) {
                wf.InTransit = "In Transit"
            }else wf.InTransit = ""

            if (FlightDetails.Status.includes("Delivered")) {
                wf.Delivered = "Delivered"
            }else wf.Delivered = ""

            if (FlightDetails.Status.includes("Delivered")) {
                wf.Cancelled = "Cancelled"
            }else wf.Cancelled = ""

        }
        else {
            wf.Processing = ""
            wf.Scheduled = ""
            wf.InTransit = ""
            wf.Delivered = ""
            wf.Cancelled = ""
        }
        if (FlightDetails.ClientId.length == 0) { parameters = parameters + 'ClientId/' }


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
            wf.ClientId = FlightDetails.ClientId
            wf.Location = FlightDetails.Location
            wf.StartTime = FlightDetails.StartTime
            wf.EndTime = FlightDetails.EndTime
            wf.emit('get_FlightDetails_from_Flight');
        }
    })

    wf.once('get_FlightDetails_from_Flight', function () {

        let params = {
            TableName: FlightTable,
            FilterExpression: "#ClientId =:ClientId AND ( #location = :location OR #StartTime=:StartTime OR #EndTime=:EndTime OR #PStatus =:Processing OR #SStatus =:Scheduled OR #IStatus =:intarnsit OR #DStatus =:Delivered OR #CStatus =:Cancelled)",

            ExpressionAttributeNames: { "#ClientId": "ClientId", "#location": "PickUpLocation", "#StartTime": "StartTime", "#EndTime": "EndTime", "#PStatus": "Status", "#SStatus": "Status", "#IStatus": "Status", "#DStatus": "Status", "#CStatus": "Status" },
            ExpressionAttributeValues: {
                ":ClientId": wf.ClientId,
                ":location": wf.Location,
                ":StartTime": wf.StartTime,
                ":EndTime": wf.EndTime,
                ":Processing": wf.Processing,
                ":Scheduled": wf.Scheduled,
                ":intarnsit": wf.InTransit,
                ":Delivered": wf.Delivered,
                ":Cancelled": wf.Cancelled,
            }
        };

        docClient.scan(params, function (err, data) {
            if (err) {
                console.log("Err",err)
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
                        "MainData": data
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
