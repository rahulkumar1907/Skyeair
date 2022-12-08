var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({ "region": "ap-south-1" });

exports.handler = async (event, context, callback) => {
    try {
        var Created_Timestamp = new Date().toISOString();

        function Trim(string) {
            string = string.replace(/ {1,}/g, " ");
            return string.trim();
        }

        var params = {
            TableName: "FlightStream",
            Item: {
                "TableName": "Flight",
                "TS_Updated": Created_Timestamp
            }
        };
        let data = await docClient.put(params).promise()
        return ({ "statusCode": 200, "TS_Updated": Created_Timestamp, "Message": "Data Streamed Successfully" })

    }
    catch (err) {
        return ({ "statusCode": 500, "Error_Type": "Internal Server Error" })
    }

};