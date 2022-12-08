// environmental variable present in configuration in lambda function as environmental variable
const aws = require('aws-sdk')
const ddb = new aws.DynamoDB.DocumentClient({ "region": process.env.AWS_Region });
const { v4: uuid4 } = require("uuid")

exports.handler = async (event, context, callback) => {
   
    try {
        // defining the error for bad request body
        let reqBody = {
            "statusCode": 400,
            "errorType": "Missing/Invalid parameters ",
            "message": "Missing/Invalid parameters_Provide details",
            "should_display_error": "false"
        }
        // sending the error for bad request body
        let arrayRequest = Object.keys(event.body)

        if (arrayRequest.length == 0) {

            context.fail(JSON.stringify(reqBody))

        }
        const table = process.env.TableName
        // creating unique id by using npm package uuid
        const uuid = uuid4()
        event.body._id = "SykeAir" + uuid
        const time_Stamp = new Date().toISOString()
        event.body.timeStamps = time_Stamp
        
        const params = {
            TableName: table,
            Item: event.body,
        }
    //   putting parameters in dynamoDb table using promise
        const data = await ddb.put(params).promise()
    // successfull response return in context.done
        context.done(null, {
            "data": {

                "Message": "** Delivery Information Inserted Successfully **",
                "data": event.body

            },
            "error": null,
            "statusCode": 200
        })

        return
    }
    // return unhandled server by using catch 
    catch (err) {
        // console.log(err);
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