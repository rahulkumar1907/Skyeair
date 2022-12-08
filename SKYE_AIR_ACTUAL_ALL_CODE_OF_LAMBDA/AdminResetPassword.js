var AWS = require("aws-sdk");
var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({
  "region":process.env.AwsRegionForPool
});

const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});
var MigrationAdminId   = process.env.MigrationAdminId;

exports.handler = (event, context, callback) => {

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();
    
    wf.once('check_request_body', function() {
        var parameters = '/';
        var adminProfile = new Object();
        adminProfile.UserName = event.body.hasOwnProperty('UserName')==true ? event.body.UserName.length == 0 ? event.body.UserName = '' :event.body.UserName : '';
        adminProfile.VerificationCode = event.body.hasOwnProperty('VerificationCode')==true ? event.body.VerificationCode.length == 0 ? event.body.VerificationCode = '' :event.body.VerificationCode : '';
        adminProfile.Password = event.body.hasOwnProperty('Password')==true ? event.body.Password.length == 0 ? event.body.Password = '' :event.body.Password : '';

        if(adminProfile.UserName.length == 0) { parameters = parameters+'UserName/' }
        if(adminProfile.VerificationCode.length == 0) { parameters = parameters+'VerificationCode/' }
        if(adminProfile.Password.length == 0) { parameters = parameters+'Password/' }

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
          wf.profileObject = adminProfile;
          wf.emit('reset_password_in_cognito');        }
    });

    wf.once('reset_password_in_cognito', function(){
      var params = {
        ClientId: MigrationAdminId, /* required */
        ConfirmationCode: wf.profileObject.VerificationCode, /* required */
        Password: wf.profileObject.Password, /* required */
        Username: wf.profileObject.UserName
      };
      cognitoidentityserviceprovider.confirmForgotPassword(params, function(err, data) {
        if (err) {
          console.log(err.code); // an error occurred
          if(err.code == 'CodeMismatchException'){
            context.fail(JSON.stringify({
                "data":null,
                "error": {
                  "code": 400,
                  "message": "Invalid Verification Code",
                  "type": "Authentication failure",
                  "should_display_error": "true"
                },
                "statusCode": 400
            }));
            return;
          } 

          if(err.code == 'ExpiredCodeException'){
            context.fail(JSON.stringify({
                "data":null,
                "error": {
                  "code": 400,
                  "message": "Verification code expired",
                  "type": "Authentication failure",
                  "should_display_error": "true"
                },
                "statusCode": 400
            }));
            return;
          } 

          else {
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
        }
        else {
          // wf.emit('send_encrypted_response');
          context.done(null,{
              "data":{
                "MainData": "Password reset success"
              },
              "error": null,
              "statusCode": 200
          });
        }
      });
    });

    wf.emit('check_request_body');
};
