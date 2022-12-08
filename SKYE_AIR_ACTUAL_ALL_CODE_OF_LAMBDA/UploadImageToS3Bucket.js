// const multer=require("multer")
// const multipart=require("aws-lambda-multipart-parser")

const AWS = require("aws-sdk")
// const { v4: uuid4 } = require("uuid")
const ddb = new AWS.DynamoDB.DocumentClient({ "region": process.env.AWS_Region });
   //****************************************************************************//
      
const s3=new AWS.S3({
    // accessKeyId:process.env.ACCESS_KEY_ID,
    // secretAccessKey:process.env.SECRET_ACCESS_KEY,
    region:process.env.AWS_Region
})
     
exports.handler = async (event, context, callback) => {
   try{
         // defining the error for bad request body
        let reqBody = {
            "statusCode": 400,
            "errorType": "Missing/Invalid parameters ",
            "message": "Missing/Invalid parameters_Provide details",
            "should_display_error": "false"
        }
        // sending the error for bad request body
        let arrayRequest = Object.keys(event.body)
        
// return JSON.stringify(arrayRequest)
        if (arrayRequest.length == 0||event.body.base64String==""||(!event.body)) {

            context.fail(JSON.stringify({"statusCode":400,"errorType": "Missing/Invalid parameters ","message":"Invalid Image Url"}))
            return

        }
        let buffer =  Buffer.from(event.body.base64String, 'base64');
      
        let  Timestamp = new Date().toISOString();

        
  
        var params = {
            'Bucket': process.env.BUCKETNAME,
            'Key': Timestamp.slice(0,10)+"/SkyeAir"+"."+"png",
            'Body': buffer,
            'ACL': "public-read",
            };
  
    let data=await   s3.upload(params).promise()
    // let clientParam={
    //     TableName:"ClientProfile",
    //     Item:data.Location
    // }
    // let clientImageUrl=await ddb.put(clientParam).promise()
     context.done(null, {
            "data": {

                "Message": "**Image  Inserted Successfully **",
                "URL":JSON.stringify(data.Location) 

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
    
}