var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});


const TableName = process.env.TableName;

exports.handler = (event, context, callback) => {

    var Created_Timestamp = new Date().toISOString();

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    function Trim(string) {
        string = string.replace(/ {1,}/g, " ");
        return string.trim();
    }

    wf.once('check_request_body', function () {
        console.log(event.body)
        var parameters = '/';
        var Mission = new Object();
        Mission.Time = event.body.hasOwnProperty('Time') == true ? event.body.Time.length == 0 ? event.body.Time = '' : event.body.Time : '';

        if (Mission.Time.length == 0) { parameters = parameters + 'Time/' }

        if (parameters.length > 1) {
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
            wf.emit('get_missions_from_db')
           

        }
    })

    wf.once('get_missions_from_db', function () {
        var params = {
            // TableName: TableName,

            TableName: TableName,
            IndexName: "LiveStatus-index",
            KeyConditionExpression: "LiveStatus = :LiveStatus",
            ExpressionAttributeValues: {
                ":LiveStatus": 'Completed'
            },
            // ScanIndexForward: false,
            ProjectionExpression:['MissionId','OperatorId','StartTime','EndTime','CreatedByName','ActivityType','ApprovalMode','OperationName','LiveStatus','MissionStatus']
        }

        docClient.query(params, onScan);

        let MissionList = [];

        function onScan(err, data) {
            if (err) {
                console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
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
                // console.log("Scan succeeded.");
                // console.log(data.LastEvaluatedKey);

                // continue scanning if we have more items
                if (typeof data.LastEvaluatedKey != "undefined") {
                    // wf.TempMissionLogs = wf.TempMissionLogs.concat(data.Items);                    
                    console.log("Scanning for more...");
                    
                    MissionList = MissionList.concat(data.Items);
                    console.log(MissionList.length);

                    params.ExclusiveStartKey = data.LastEvaluatedKey;
                    docClient.query(params, onScan);
                } else {
                    console.log('end');
                    MissionList = MissionList.concat(data.Items);
                    console.log(MissionList.length);
                    var params1 = {
                        TableName: TableName,
                        IndexName: "MissionStatus-index",
                        KeyConditionExpression: "MissionStatus = :MissionStatus",
                        FilterExpression: 'EndTime  < :EndTime AND LiveStatus = :LiveStatus',
                        ExpressionAttributeValues: {
                            ":MissionStatus": 'Approved',
                            ":EndTime": event.body.Time,
                            ":LiveStatus": 'InActive',
                        },
                        // ScanIndexForward: false,
                        ProjectionExpression:['MissionId','OperatorId','StartTime','EndTime','CreatedByName','ActivityType','ApprovalMode','OperationName','LiveStatus','MissionStatus']
                    }

                    var mergedArray = [];

                    docClient.query(params1, function (err, data) {
                        if (err) {
                            console.log(err)
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
                            console.log(data.Items.length);                                
                            var mergedArray = MissionList.concat(data.Items);
                            console.log(mergedArray.length);

                            mergedArray.forEach(element => {
                                if (element.LiveStatus == 'Completed') {
                                    element.Status = "Success"
                                } else {
                                    element.Status = 'UnSuccess'
                                } 
                                
                            });

                            let sortedList1 = mergedArray.sort((d1, d2) => new Date(d2.StartTime).getTime() - new Date(d1.StartTime).getTime());
                            if(sortedList1.length > 100) {
                               sortedList1 =  sortedList1.slice(0,100)
                            }
                            console.log(sortedList1.length);
                            context.done(null, {
                                "data": {
                                    "MainData": sortedList1,
                                },
                                "error": null,
                                "statusCode": 200
                            });
                            return;

                        }
                    });                    
                }
            }
        }



    })
    
    wf.emit('check_request_body');
};