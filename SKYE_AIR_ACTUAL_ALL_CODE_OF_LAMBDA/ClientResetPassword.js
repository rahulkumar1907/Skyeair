var AWS = require("aws-sdk");
var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({
  "region":process.env.AwsRegionForPool
});

const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});

var ses = new AWS.SES({ apiVersion: '2010-12-01', region: process.env.AwsRegionForEmail });


var MigrationClientId   = process.env.MigrationClientId;
var UserPoolId   = process.env.UserPoolId;
var TableName   = process.env.TableName;
var EmailTemplateName   = process.env.EmailTemplateName;
var FromAddress   = process.env.FromAddress;
var ToAddresss1   = process.env.ToAddresss1;
var ToAddresss2   = process.env.ToAddresss2;
var BCCAddress1   = process.env.BCCAddress1;



exports.handler = (event, context, callback) => {

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();
    
    wf.once('check_request_body', function() {
        var parameters = '/';
        var profile = new Object();
        profile.UserName = event.body.hasOwnProperty('UserName')==true ? event.body.UserName.length == 0 ? event.body.UserName = '' :event.body.UserName : '';
        profile.VerificationCode = event.body.hasOwnProperty('VerificationCode')==true ? event.body.VerificationCode.length == 0 ? event.body.VerificationCode = '' :event.body.VerificationCode : '';
        profile.Password = event.body.hasOwnProperty('Password')==true ? event.body.Password.length == 0 ? event.body.Password = '' :event.body.Password : '';

        if(profile.UserName.length == 0) { parameters = parameters+'UserName/' }
        if(profile.VerificationCode.length == 0) { parameters = parameters+'VerificationCode/' }
        if(profile.Password.length == 0) { parameters = parameters+'Password/' }

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
          wf.profileObject = profile;
          wf.emit('reset_password_in_cognito'); 
        }
    });

    wf.once('reset_password_in_cognito', function(){
      var params = {
        ClientId: MigrationClientId, /* required */
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
          wf.emit('get_user_details_from_client_profile');         
        }
      });
    });

    wf.once('get_user_details_from_client_profile', function () {
        var params = {
            TableName: TableName,
            Key:{
              "EmailId":wf.profileObject.UserName
            }
        };
        docClient.get(params, function (err, data) {
            if (err) {
                console.log("Error",err);
                context.fail(JSON.stringify({
                    "data": null,
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
            else {
                //console.log(data.Item);
                if(data.Item.UserStatus){
                  context.done(null,{
                      "data":{
                        "MainData": "Password reset success"
                      },
                      "error": null,
                      "statusCode": 200
                  });
                } else {
                 // wf.ClientId = data.Item.ClientId
                  cognitoidentityserviceprovider.adminDisableUser({
                      UserPoolId: UserPoolId, /* required */
                      Username: data.Item.ClientId /* required */
                  }, function(err, data) {
                      if (err) {
                          console.log(err, err.stack); // an error occurred
                      }
                      else  {
                          //console.log(data);           // successful response
                          wf.emit('update_user_status_in_db');
                      }
                  });
                }
            }
        })
    });

    wf.once("update_user_status_in_db", function () {
        const params = {
            TableName: TableName,
            Key: {
                "EmailId": wf.profileObject.UserName,
            },
            UpdateExpression: 'set UserStatus = :y',
            ExpressionAttributeValues: {
                ':y': true
            },
            ReturnValues: 'ALL_NEW',
        };
        //console.log(params);
        
        docClient.update(params,function(err,data){
            if(err){
                //console.log("Error",err);
                context.fail(JSON.stringify({
                    "data": null,
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
            else{
                //console.log(data);
                wf.clientProfile = data.Attributes;
                console.log("success of UserStatus update")
                wf.emit('send_email_to_admin');                
            }
        });        
    });

    wf.once("send_email_to_admin", function () {
        wf.firstName = wf.clientProfile.FirstName;
        wf.lastName = wf.clientProfile.LastName;
        wf.phoneNo = wf.clientProfile.PhoneNumber;
        wf.emailId = wf.clientProfile.EmailId;
        wf.country = wf.clientProfile.Country;
        wf.Organization = wf.clientProfile.Organization;
        wf.loginURL = `https://admin-approve-client-test.s3.ap-south-1.amazonaws.com/AdminApprove.html?emailid=${wf.profileObject.UserName}`

        wf.TemplateData = "{ \"firstName\":\""+wf.firstName+"\", \"lastName\":\""+wf.lastName+"\",\"phoneNo\":\""+wf.phoneNo+"\", \"emailId\":\""+wf.emailId+"\",\"country\":\""+wf.country+"\", \"Organization\":\""+wf.Organization+"\" ,\"ApproveLink\":\""+wf.loginURL+"\"}";
        var params = {
            "Source": FromAddress,
            "Template": EmailTemplateName,
            "Destination": {
                "ToAddresses": [ToAddresss1,ToAddresss2],
                "CcAddresses": [],
                "BccAddresses": [BCCAddress1]
            },            
            "TemplateData": wf.TemplateData
        };

        //console.log(params);
        ses.sendTemplatedEmail(params, function (err, data) {
            if (err) {
                console.log(err);
            }
            else {
                //console.log(data);
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
