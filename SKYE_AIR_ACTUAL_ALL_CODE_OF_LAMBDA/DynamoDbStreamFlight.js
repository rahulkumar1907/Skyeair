var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": "ap-south-1"
});

exports.handler = (event, context, callback) => {

    var Created_Timestamp = new Date().toISOString();

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    function Trim(string) {
        string = string.replace(/ {1,}/g, " ");
        return string.trim();
    }

    wf.once('update_Flight_stream_table', function () {
        console.log(event);
        console.log(event.Records);
        console.log(event.Records[0]["dynamodb"]);
        console.log(Created_Timestamp);

        var params = {
            TableName:"FlightStream",
            Item: {
                "TableName":"Flight",
                "TS_Updated":Created_Timestamp
            }
        };
        docClient.put(params, function (err, data) {
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
                console.log('Stream logged success');
            }
        })

    });

    wf.emit('update_Flight_stream_table');
};