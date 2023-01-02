var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});


const TableName = process.env.TableName;

exports.handler = (event, context, callback) => {

    var Created_Timestamp = new Date().toISOString();

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    wf.once('get_all_operator_list', function () {
        const params = {
            TableName: TableName
        };
        docClient.scan(params, function (err, data) {
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
                // console.log(data.Items);
                wf.OperatorList = data.Items;
                wf.emit("update_operator_subscription_plan");
            }
        })
    })
    wf.once('update_operator_subscription_plan', function () {
        console.log("update_operator_subscription_plan")
        var i = 0;
        function updateSubscriptionplan(i) {
            if(i == wf.OperatorList.length) {
                console.log("end");
            } else {
                console.log(wf.OperatorList[i]);
                var params = {
                    TableName:TableName, 
                    Key: {
                        "UserId": wf.OperatorList[i]["UserId"]
                    },
                    ReturnValues: 'ALL_NEW',
                    UpdateExpression: 'set #SubscriptionPlan = :SubscriptionPlan',
                    ExpressionAttributeNames: {
                        '#SubscriptionPlan': 'SubscriptionPlan'
                    },
                    ExpressionAttributeValues: {
                        ':SubscriptionPlan': "Free"
                    }
                };
                // console.log(params);
                docClient.update(params, function (err, data) {
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
                        i++;
                        updateSubscriptionplan(i);
                    }
                })
                
            }
        }

        updateSubscriptionplan(i);
    });

    wf.emit('get_all_operator_list');
};