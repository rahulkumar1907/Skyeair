// environmental variable present in configuration in lambda function as environmental variable
const aws = require('aws-sdk')
const ddb = new aws.DynamoDB.DocumentClient({ "region": process.env.AWS_Region });
exports.handler = async (event, context, callback) => {
    try {
        //  defining error for bad request body
        let reqBody = {
            "statusCode": 400,
            "errorType": "Missing/Invalid parameters ",
            "message": "Missing/Invalid parameters",
            "should_display_error": "false"
        }
        // sending error for bad request body
        let arrayRequest = Object.keys(event)

        if (arrayRequest.length == 0) {

            context.fail(JSON.stringify(reqBody))

        }
        // assiging empty string to key which is not provided by client for filtration
        if (event.order || event.location || event.packageNo || event.status || event.date || event.startTime || event.endTime) {
            if (!event.order) {
                event.order = ""
            }
            if (!event.location) {
                event.location = ""
            }
            if (!event.packageNo) {
                event.packageNo = ""
            } if (!event.status) {
                event.status = ""
            } if (!event.date) {
                event.date = ""
            }
            if (!event.startTime) {
                event.startTime = ""
            }
            if (!event.endTime) {
                event.endTime = ""
            }
            const table = process.env.TableName
            // console.log("eventdate", event.date)
            // making parameters for fitration 
            let params = {
                TableName: table,
                FilterExpression: "#order = :order OR #location=:location OR #packageNo=:packageNo OR #date=:date OR #status =:status OR #startTime=:startTime OR #endTime=:endTime",

                ExpressionAttributeNames: { "#order": "order", "#location": "location", "#packageNo": "packageNo", "#date": "date", "#status": "status", "#startTime": "startTime", "#endTime": "endTime" },
                ExpressionAttributeValues: {
                    ":order": event.order,
                    ":location": event.location,
                    ":packageNo": event.packageNo,
                    ":date": event.date,
                    ":status": event.status,
                    ":startTime": event.startTime,
                    ":endTime": event.endTime
                }

            };
        //  scan the data and return Items which is present in data
            const data = await ddb.scan(params).promise()
            return data.Items

            //     context.done(null, {
            //         "data": {
            //             "message": "Required Flight Details",
            //             "Data": data,

            //         },
            //         "error": null,
            //         "statusCode": 200
            //     })

            //     return
        }
    }
//   server error handling using catch 
    catch (err) {
        console.log(err);
         let  error={ 
              "statusCode":500,
              "error":err.message,
              "type":"internal server error",
              "should_display_error":"false"
          }
           context.fail(JSON.stringify(error))
           return
    }
};