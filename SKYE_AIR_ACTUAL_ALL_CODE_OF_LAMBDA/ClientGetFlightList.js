const aws = require('aws-sdk')
const ddb = new aws.DynamoDB.DocumentClient({ region: process.env.AWSRegion });
exports.handler = async (event, context, callback) => {
    try { 
        if (!(event.body.ClientId) || event.body.ClientId == "undefined") { return ({ "statusCode": 400, "error": "Missing/Invalid ClientId" }) }
    //   *************************************get organisationId for filtration in Flight table***********************************
        var params = {
            TableName: 'ClientProfile',
            IndexName: 'ClientId',
            KeyConditionExpression: 'ClientId = :ClientId',
            ExpressionAttributeValues: {
                ':ClientId': event.body.ClientId
            }
        };

        const clientDetail = await ddb.query(params).promise()

        let OrganizationId = clientDetail.Items[0].OrganizationId
    //  ***************************************get flight  of Client Organization  ********************************************************************
        const filterParam = {
            TableName: "Flight",
            FilterExpression: '#OrganizationId = :OrganizationId ',
            ExpressionAttributeValues: {
                ':OrganizationId': OrganizationId,
               
            },
            ExpressionAttributeNames: {
                '#OrganizationId': 'OrganizationId',
               
            }
        }

        const FlightList = await ddb.scan(filterParam).promise()

        return ({"statusCode":200,"data":FlightList.Items})
    }
    catch(err){
        return ({"statusCode":500,"error":"Internal Server Error"})
    }
    }