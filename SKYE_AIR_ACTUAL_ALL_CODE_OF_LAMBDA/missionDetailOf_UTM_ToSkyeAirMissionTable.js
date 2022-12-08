const aws = require('aws-sdk')
const ddb = new aws.DynamoDB.DocumentClient({ "region": process.env.AWS_Region });
// log in client get his/her organisation mission detail
exports.handler = async (event, context, callbacK) => {
//   queryparameter uses
    try {
    //   let reqBody={
    //       "statusCode":400,
    //           "error":"Missingh/Invalid EmailId",
    //           "type":"Invalid EmailId",
    //           "message":"Provide EmailId",
    //           "should_display_error":"false"
    //   }
    //     if(!event.body.EmailId){
    //         context.fail(JSON.stringify(reqBody))
    //         return
    //     }
         const clientParams = {
            TableName: "ClientProfile",
                Key:{EmailId:event.body.EmailId}
        }
          const clientDetail = await ddb.get(clientParams).promise()
          // return clientDetail.Item.Organization
         const params = {
            TableName: "Mission"
        }
        // scanning the all data of  table ( return all table data )
        const data = await ddb.scan(params).promise()
    
        // return data.Items
        var clientFlight=[]
        
      
        for(let i=0;i<data.Items.length;i++){
        
          if(data.Items[i].Organization==clientDetail.Item.Organization){
            console.log(1)
           clientFlight.push(data.Items[i])
          }
        }
        return clientFlight
  
     }
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