var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region":"ap-south-1"
});
// const DiffSeconds = "24";

exports.handler = (event, context, callback) => {

    var Created_Timestamp = new Date().toISOString();

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    function Trim(string) {
        string = string.replace(/ {1,}/g, " ");
        return string.trim();
    }

    wf.once('check_Flight_stream_table', function () {

        var params = {
            TableName:"FlightStream",
            Key: {
                "TableName":"Flight"
            }
        };
        docClient.get(params, function (err, data) {
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
                console.log(data.Item);
                console.log("Current Timestamp", Created_Timestamp);
                
                wf.TS_Updated = event.body.TS_Updated || "";
                console.log('User Timestamp', wf.TS_Updated)
                if(event.body.TS_Updated != data.Item.TS_Updated) {
                    console.log('Call API');
                    context.done(null, {
                        "data": {
                            "MainData":{
                                "Data_Change":true,
                                "TS_Updated": data.Item.TS_Updated          
                            }
                        },
                        "error": null,
                        "statusCode": 200
                    });
                } else {
                    console.log('Dont call API');
                    context.done(null, {
                        "data": {
                            "MainData":{
                                "Data_Change":false,
                                "TS_Updated": data.Item.TS_Updated        
                            }
                        },
                        "error": null,
                        "statusCode": 200
                    });
                }
                
            }
        })

    });

    wf.emit('check_Flight_stream_table');
};