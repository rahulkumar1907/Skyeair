const aws = require('aws-sdk')
const ddb = new aws.DynamoDB.DocumentClient({region :'us-west-1'});
exports.handler = async (event) => {
   try{
    var params = {
    TableName: 'samplerOrder',
    IndexName : 'key1-index',
    KeyConditionExpression : 'EmailId = :EmailId', 
    ExpressionAttributeValues : {
        ':EmailId' : event.body.EmailId
    }
  };
    const data = await ddb.query(params).promise()
    //console.log(data)
    const response = {
        statusCode : 200,
        body : JSON.stringify(data)
    }
    return response
}catch(err){
    return err
}
};