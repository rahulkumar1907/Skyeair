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
    
       var  OrganizationId = clientDetail.Items[0].OrganizationId
    //   console.log("organisationId",OrganizationId)
    
     
        
    //  ***************************************get flight  of Client Organization  ********************************************************************
         const demoParam = {
            TableName: "Flight",
            FilterExpression: '#Demo = :Demo' ,
            ExpressionAttributeValues: {
                ':Demo': true,
             },
            ExpressionAttributeNames: {
                '#Demo': "Demo",
               
            }
        }
        const demoList = await ddb.scan(demoParam).promise()
        
        const filterParam = {
            TableName: "Flight",
            FilterExpression: '#OrganizationId = :OrganizationId' ,
            ExpressionAttributeValues: {
                ':OrganizationId': OrganizationId,
             },
            ExpressionAttributeNames: {
                '#OrganizationId': "OrganizationId",
               
            }
        }
       
        const FlightList = await ddb.scan(filterParam).promise()
        console.log("flight",FlightList)
        console.log("demo",demoList)
        const output = [...demoList.Items,...FlightList.Items]

        return ({"statusCode":200,"data":output})
    
    }
    catch(err){
        return ({"statusCode":500,"error_type":"Internal Server Error","error":err.message})
    }
    }