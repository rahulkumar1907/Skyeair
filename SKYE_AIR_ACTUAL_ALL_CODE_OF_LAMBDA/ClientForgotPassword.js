var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});
var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({
  "region":process.env.AwsRegionForPool
});
var MigrationClientId   = process.env.MigrationClientId;

exports.handler = (event, context, callback) => {

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();
    
    wf.once('check_request_body', function() {
        var parameters = '/';
        var profile = new Object();
        profile.UserName = event.body.hasOwnProperty('UserName')==true ? event.body.UserName.length == 0 ? event.body.UserName = '' :event.body.UserName : '';

        if(profile.UserName.length == 0) { parameters = parameters+'UserName/' }

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
          wf.emit('Send_verification_code_to_mail');        }
    });

    wf.once('Send_verification_code_to_mail', function(){
        var params = {
          ClientId: MigrationClientId, /* required */
          Username: event.body.UserName
        };
        cognitoidentityserviceprovider.forgotPassword(params, function(err, data) {
            if (err) {
                console.log(err);
                if(err.code == 'UserNotFoundException'){
                    context.fail(JSON.stringify({
                        "data":null,
                        "error": {
                          "code": 400,
                          "message": "EmailID not registered",
                          "type": "Authorized error",
                          "should_display_error": "false"
                        },
                        "statusCode": 400
                    }));
                    return;
                } else {
                    context.fail(JSON.stringify({
                        "error": {
                            "code": 500,
                            "message": "Internal server!!!!!!!!"+err,
                            "type": "Server Error"+ wf.agent_data,
                            "should_display_error": "false"
                        },
                        "statusCode": 500
                    }));
                    return;
                }
                
            } else {
                context.done(null,{
                    "data":{
                        "MainData": "Verification code sent successfully"
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
