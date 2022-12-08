var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": "ap-south-1"
});
// const DiffSeconds = "24";

exports.handler = async (event, context, callback) => {
    try {
        var Created_Timestamp = new Date().toISOString();
        var TS_Updated = event.body.TS_Updated || "";
        function Trim(string) {
            string = string.replace(/ {1,}/g, " ");
            return string.trim();
        }

        var params = {
            TableName: "FlightStream",
            Key: {
                "TableName": "Flight"
            }
        };

        let data = await docClient.get(params).promise()

        console.log('User Timestamp', TS_Updated)
        if (event.body.TS_Updated != data.Item.TS_Updated) {
            console.log("You Can Call Api")
            return ({ "statusCode": 200, "Data_Change": true, "TS_Updated": data.Item.TS_Updated })
        }
        else {
            console.log("You Cannot Call Api")
            return ({ "statusCode": 200, "Data_Change": false, "TS_Updated": data.Item.TS_Updated })
        }
    }
    catch (err) {
        return ({"statusCode":500,"Error_Type":"Internal Server Error","Should_Display_Error":"False","Message":err.message})
    }


};