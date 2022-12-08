const aws = require('aws-sdk')
const ddb = new aws.DynamoDB.DocumentClient({ region: process.env.AWSRegion });
exports.handler = async (event, context, callback) => {
    try {
        if(!(event.body.SkyeTunnelId)||event.body.SkyeTunnelId=="undefined"){return ({ "statusCode": 400, "error": "Missing/Invalid Skyetunnel Id", "status": "false" })}
        const params = {
            TableName: process.env.TableName,
            Key: {
                SkyeTunnelId: event.body.SkyeTunnelId,
            }
        }
        const data = await ddb.get(params).promise()
        // console.log(data)
        if (!data.Item) { return ({ "statusCode": 400, "error": "Not Found" }) }
        if (data) { return ({ "statusCode": 200, "message": "successful", "data": data.Item }) }
    }
    catch (err) {
        return ({ "statusCode": 500, "error": err.message, "error_type": "Internal Server Error" })
    }
};