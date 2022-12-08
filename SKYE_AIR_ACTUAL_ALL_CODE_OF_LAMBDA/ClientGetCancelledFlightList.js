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
    //  ***************************************get Processing flight List ********************************************************************
        // const filterParam = {
        //     TableName: "Flight",
        //     FilterExpression: '#OrganizationId = :OrganizationId AND #Status =:Status ',
        //     ExpressionAttributeValues: {
        //         ':OrganizationId': OrganizationId,
        //         ':Status': "Processing"
        //     },
        //     ExpressionAttributeNames: {
        //         '#OrganizationId': 'OrganizationId',
        //         '#Status': 'Status'
        //     }
        // }
        // ************************************************get Delivered Flight list**********************************************
        // const filterParam = {
        //     TableName: "Flight",
        //     FilterExpression: '#OrganizationId = :OrganizationId AND #Status =:Status ',
        //     ExpressionAttributeValues: {
        //         ':OrganizationId': OrganizationId,
        //         ':Status': "Delivered"
        //     },
        //     ExpressionAttributeNames: {
        //         '#OrganizationId': 'OrganizationId',
        //         '#Status': 'Status'
        //     }
        // }
        // ***********************************************get Cancelled Flight List***************************************
        //  const filterParam = {
        //     TableName: "Flight",
        //     FilterExpression: '#OrganizationId = :OrganizationId AND #Status =:Status ',
        //     ExpressionAttributeValues: {
        //         ':OrganizationId': OrganizationId,
        //         ':Status': "Cancelled"
        //     },
        //     ExpressionAttributeNames: {
        //         '#OrganizationId': 'OrganizationId',
        //         '#Status': 'Status'
        //     }
        // }
        // ******************************************get Scheduled Flight List******************************************
        //  const filterParam = {
        //     TableName: "Flight",
        //     FilterExpression: '#OrganizationId = :OrganizationId AND #Status =:Status ',
        //     ExpressionAttributeValues: {
        //         ':OrganizationId': OrganizationId,
        //         ':Status': "Scheduled"
        //     },
        //     ExpressionAttributeNames: {
        //         '#OrganizationId': 'OrganizationId',
        //         '#Status': 'Status'
        //     }
        // }
        // ************************************get In Transit Flight List*************************************************
         const filterParam = {
            TableName: "Flight",
            FilterExpression: '#OrganizationId = :OrganizationId AND #Status =:Status ',
            ExpressionAttributeValues: {
                ':OrganizationId': OrganizationId,
                ':Status': "In Transit"
            },
            ExpressionAttributeNames: {
                '#OrganizationId': 'OrganizationId',
                '#Status': 'Status'
            }
        }
        
        
        const FlightDetail = await ddb.scan(filterParam).promise()

        return ({"statusCode":200,"data":FlightDetail.Items})

    }
    catch (err) {
        return ({ "statusCode": 500, "error": err.message, "error_type": "Server Error" })
    }
};