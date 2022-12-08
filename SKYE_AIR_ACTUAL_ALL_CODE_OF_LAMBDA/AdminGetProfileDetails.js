var AWS = require("aws-sdk");
 
const ddb = new AWS.DynamoDB.DocumentClient({region :process.env.AWS_Region});


exports.handler = (event, context, callback) => {

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();
    
    wf.once('check_request_body', function() {
        var parameters = '/';
        var AdminProfile = new Object();
        AdminProfile.EmailId = event.body.hasOwnProperty('EmailId')==true ? event.body.EmailId.length == 0 ? event.body.EmailId = '' :event.body.EmailId : '';
        
   

        if(AdminProfile.EmailId.length == 0) { parameters = parameters+'EmailId/' }
       

        if(parameters.length > 1){
          context.fail(JSON.stringify({
              "data":null,
              "error": {
                "code": 400,
                "message": "Missing/Invalid parameters "+parameters,
                "type": "Missing/Invalid parameters",
                "should_display_error": "false"
              },
              "statusCode": 400
          }));
          return;
        } else {
          wf.AdminProfile = AdminProfile;
          wf.emit('client_get_detail');        }
    });

    wf.once('client_get_detail', function(){
      const params = {
        TableName :process.env.TableName,
      Key:{EmailId:wf.AdminProfile.EmailId}
    }
      ddb.get(params, function(err, data) {
        if (err) {
          // if(!data.Item){
          //   context.fail(JSON.stringify({
          //       "data":null,
          //       "error": {
          //         "code": 400,
          //         "message": "No Record Found ",
          //         "type": "Client Not Register",
          //         "should_display_error": "true"
          //       },
          //       "statusCode": 400
          //   }));
          //   return;
          // } 
          // else {
            console.log(err);
            context.fail(JSON.stringify({
                "data":null,
                "error": {
                  "code": 500,
                  "message": "Internal server error",
                  "type": "Server Error",
                  "should_display_error": "false"
                },
                "statusCode": 500
            }));
            return;
          }
          if(!data.Item){
             context.fail(JSON.stringify({
                "data":null,
                "error": {
                  "code": 400,
                  "message": "No Record Found",
                  "type": "Client Not Register",
                  "should_display_error": "false"
                },
                "statusCode": 400
            }));
            return;
          }
        // }
        else {
           context.done(null,{
               "data":{
                 "MainData": data.Item
               },
               "error": null,
               "statusCode": 200
           });
          return;
        }
      });
    });


    wf.emit('check_request_body');
};