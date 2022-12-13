var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});


const TableName = process.env.TableName;
// const CreatedById = process.env.CreatedById;
const CreatedById = JSON.parse(process.env.CreatedById);

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
            wf.emit('get_not_live_mission_list')
           

        }
    });

    wf.once('get_not_live_mission_list', function () {
        console.log(CreatedById);
        for(let i=0;i<CreatedById.length;i++) {
            console.log(CreatedById[i]);
        }
        wf.TempNotLiveMission = [];
        var params = {
            TableName: TableName,
            IndexName: "MissionStatus-index",
            KeyConditionExpression: "MissionStatus = :MissionStatus",
            FilterExpression: '((StartTime <= :StartTime AND EndTime >= :StartTime) OR (StartTime <= :EndTime AND EndTime >= :EndTime) OR (:StartTime <= StartTime AND :EndTime >= StartTime) OR (:StartTime <= EndTime AND :EndTime >= EndTime)) AND LiveStatus = :LiveStatus AND (',
            ExpressionAttributeValues: {
                ":StartTime": event.body.Time,
                ":EndTime": event.body.Time,
                ":LiveStatus": 'InActive',
                ":MissionStatus": 'Approved'
            },
            ProjectionExpression:["OperationName", "MissionId", "StartTime", "EndTime", "MissionStatus", "ApprovalMode", "DroneName", "MaximumAltitude", "ActivityType", "CreatedByName", "PilotContact", "Latitude", "Longitude", "Altitude","WayPointNum", "LiveStatus", "wayPointFileDetails","BufferRegion","PermissionStatus"],
            ScanIndexForward: false
        }

        for(let i=0;i<CreatedById.length;i++) {
            // console.log(CreatedById[i]);
            params.FilterExpression = params.FilterExpression + "CreatedById = :CreatedById" + i ;
            if(i < CreatedById.length-1) {
                params.FilterExpression = params.FilterExpression + " OR ";
            }
            params.ExpressionAttributeValues[":CreatedById"+i] = CreatedById[i];
        }
        params.FilterExpression = params.FilterExpression + ")";
        console.log(params);

        docClient.query(params, onScan);

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
                console.log("Scan succeeded.");
                // console.log(data);

                // continue scanning if we have more items
                if (typeof data.LastEvaluatedKey != "undefined") {
                    wf.TempNotLiveMission = wf.TempNotLiveMission.concat(data.Items);
                    console.log("Scanning for more...");
                    // console.log(wf.TempNotLiveMission);
                    params.ExclusiveStartKey = data.LastEvaluatedKey;
                    docClient.query(params, onScan);
                } else {
                    console.log('end');
                    wf.TempNotLiveMission = wf.TempNotLiveMission.concat(data.Items);
                    let sortedList = wf.TempNotLiveMission.sort((d1, d2) => new Date(d2.StartTime).getTime() - new Date(d1.StartTime).getTime());
                    wf.NotLiveMission = sortedList;
                    console.log('OnGoingCount before ',wf.NotLiveMission.length);
                    wf.emit('get_ongoing_missions_from_db');                    
                }
            }
        }
    })

    wf.once('get_ongoing_missions_from_db', function () {
        wf.LiveMission = [];
        var params = {
            TableName: TableName,
            IndexName: "LiveStatus-index",
            KeyConditionExpression: "LiveStatus = :LiveStatus",
            FilterExpression: "",
            ExpressionAttributeValues: {
                ":LiveStatus": 'Active'
            },
            ProjectionExpression:["OperationName", "MissionId", "StartTime", "EndTime", "MissionStatus", "ApprovalMode", "DroneName", "MaximumAltitude", "ActivityType", "CreatedByName", "PilotContact", "Latitude", "Longitude", "Altitude","WayPointNum", "LiveStatus", "wayPointFileDetails","BufferRegion","PermissionStatus"],
            ScanIndexForward: false
        }

        for(let i=0;i<CreatedById.length;i++) {
            // console.log(CreatedById[i]);
            params.FilterExpression = params.FilterExpression + "CreatedById = :CreatedById" + i ;
            if(i < CreatedById.length-1) {
                params.FilterExpression = params.FilterExpression + " OR ";
            }
            params.ExpressionAttributeValues[":CreatedById"+i] = CreatedById[i];
        }
        console.log(params);

        docClient.query(params, onScan);

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
                console.log("Scan succeeded.");
                console.log(data);

                // continue scanning if we have more items
                if (typeof data.LastEvaluatedKey != "undefined") {
                    wf.LiveMission = wf.LiveMission.concat(data.Items);
                    console.log("Scanning for more...");
                    // console.log(wf.LiveMission);
                    params.ExclusiveStartKey = data.LastEvaluatedKey;
                    docClient.query(params, onScan);
                } else {
                    console.log('end');
                    wf.LiveMission = wf.LiveMission.concat(data.Items);
                    let sortedList1 = wf.LiveMission.sort((d1, d2) => new Date(d2.StartTime).getTime() - new Date(d1.StartTime).getTime());
                    wf.OnGoingMissionList = sortedList1.concat(wf.NotLiveMission);
                    // console.log(wf.OnGoingMissionList);
                    context.done(null, {
                        "data": {
                            "MainData": {
                                "OnGoingMissionList":wf.OnGoingMissionList,
                                "OnGoingCount":wf.OnGoingMissionList.length
                            }
                        },
                        "error": null,
                        "statusCode": 200
                    });
                    return;                
                }
            }
        }
    })



    wf.emit('check_request_body');
};