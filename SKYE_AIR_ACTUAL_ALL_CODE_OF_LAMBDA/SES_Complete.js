const AWS = require('aws-sdk');
  
var ses = new AWS.SES({ apiVersion: '2010-12-01', region: process.env.AwsRegionForEmail });

var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({
      "region": process.env.AwsRegionForEmail
  });

exports.handler = (event, context, callback) => {

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    wf.once('perform_email_template',function(){
          
          // var params = {
          //   TemplateName: 'Admin_Notify_Client_Registration_EmailTemplate_v1' /* required */
          // };
          // ses.getTemplate(params, function(err, data) {
          //   if (err) {console.log(err, err.stack); }// an error occurred
          //   else    { 
          //     console.log(data.Template);
          //     context.done(null,{
          //         "data":{
          //             "MainData": data.Template
          //           },
          //         "error": null,
          //         "statusCode": 200
          //     });
          //     return;
          //     for(var key in data.Template){
          //       console.log(key);
          //     }  
          //   }        //  successful response
          // });

    
          // var params = {
          //   "Template": {
          //     "TemplateName": "Admin_Notify_Client_Registration_EmailTemplate_v1",
          //     "SubjectPart": "New Client Registration",
          //     "HtmlPart": "<html>\r\n\r\n<body>\r\n <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" class=\"m_-5269160379379659625templateContainer\" style=\"border-collapse:collapse;border:0;max-width:600px!important\">\r\n <tbody>\r\n <tr>\r\n <td valign=\"top\" id=\"m_-5269160379379659625templatePreheader\" style=\"background:#fafafa none no-repeat center\/cover;background-color:#fafafa;background-image:none;background-repeat:no-repeat;background-position:center;background-size:cover;border-top:0;border-bottom:0;padding-top:9px;padding-bottom:9px\"><\/td>\r\n <\/tr>\r\n <tr>\r\n <td valign=\"top\" id=\"m_-5269160379379659625templateUpperBody\" style=\"background:#ffffff none no-repeat center\/cover;background-color:#ffffff;background-image:none;background-repeat:no-repeat;background-position:center;background-size:cover;border-top:0;border-bottom:0;padding-top:0;padding-bottom:0\">\r\n <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" class=\"m_-5269160379379659625mcnTextBlock\" style=\"min-width:100%;border-collapse:collapse\">\r\n <tbody class=\"m_-5269160379379659625mcnTextBlockOuter\">\r\n <tr>\r\n <td valign=\"top\" class=\"m_-5269160379379659625mcnTextBlockInner\" style=\"padding-top:9px\">\r\n <table align=\"left\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:100%;min-width:100%;border-collapse:collapse\" width=\"100%\" class=\"m_-5269160379379659625mcnTextContentContainer\">\r\n <tbody>\r\n <tr>\r\n <td valign=\"top\" class=\"m_-5269160379379659625mcnTextContent\" style=\"padding-top:0;padding-right:18px;padding-bottom:9px;padding-left:18px;word-break:break-word;color:#202020;font-family:Helvetica;font-size:16px;line-height:150%;text-align:left\">\r\n <h1 style=\"display:block;margin:0;padding:0;color:#202020;font-family:Helvetica;font-size:26px;font-style:normal;font-weight:bold;line-height:125%;letter-spacing:normal;text-align:left\"><span style=\"font-size:18px\">Hello Team,<\/span>&nbsp;<\/h1>\r\n \r\n <br>\r\n We are happy to inform that new client has been registered to our interface.<br>\r\n Check here the details of new client<br>\r\n <br>\r\n <table style=\"width:100%;border: 1px solid #ccc;border-collapse: collapse;text-align: left;\">\r\n <tbody>\r\n <tr style=\"padding: 5px;\">\r\n <th style=\"border-bottom:1px solid #ccc;padding: 5px;\">First Name<\/th>\r\n <td style=\"border-bottom:1px solid #ccc;padding: 5px;\">{{firstName}}<\/td>\r\n <\/tr>\r\n <tr style=\"padding: 5px;\">\r\n <th style=\"border-bottom:1px solid #ccc;padding: 5px;\">Last Name<\/th>\r\n <td style=\"border-bottom:1px solid #ccc;padding: 5px;\">{{lastName}}<\/td>\r\n <\/tr>\r\n <tr style=\"padding: 5px;\">\r\n <th style=\"border-bottom:1px solid #ccc;padding: 5px;\">Phone<\/th>\r\n <td style=\"border-bottom:1px solid #ccc;padding: 5px;\">{{phoneNo}}<\/td>\r\n <\/tr>\r\n <tr style=\"padding: 5px;\">\r\n <th style=\"border-bottom:1px solid #ccc;padding: 5px;\">Email<\/th>\r\n <td style=\"border-bottom:1px solid #ccc;padding: 5px;\">{{emailId}}<\/td>\r\n <\/tr>\r\n <tr style=\"padding: 5px;\">\r\n <th style=\"border-bottom:1px solid #ccc;padding: 5px;\">Country<\/th>\r\n <td style=\"border-bottom:1px solid #ccc;padding: 5px;\">{{country}}<\/td>\r\n <\/tr>\r\n <tr style=\"padding: 5px;\">\r\n <th style=\"border-bottom:1px solid #ccc;padding: 5px;\">Organization<\/th>\r\n <td style=\"border-bottom:1px solid #ccc;padding: 5px;\">{{Organization}}<\/td>\r\n <\/tr>\r\n <\/tbody>\r\n <\/table>\r\n <br>\r\n Thanks,<br>\r\n Skyeair Support&nbsp;<br>\r\n <strong><span style=\"color:#3366cc\"><a href=\"http:\/\/www.skyeair.tech\" target=\"_blank\" data-saferedirecturl=\"https:\/\/www.google.com\/url?q=http:\/\/www.skyeair.tech&amp;source=gmail&amp;ust=1551946092272000&amp;usg=AFQjCNGBO5idm4HRff8Sw650D6Ev0Ywk4w\">skyeair.tech<\/a><\/span><\/strong>\r\n <\/p>\r\n <\/td>\r\n <\/tr>\r\n <\/tbody>\r\n <\/table>\r\n <\/td>\r\n <\/tr>\r\n <\/tbody>\r\n <\/table>\r\n <\/td>\r\n <\/tr>\r\n <\/tbody>\r\n <\/table>\r\n <\/td>\r\n<\/body>\r\n\r\n<\/html>",
          //     "TextPart": "\r\nHello Team, \r\n\r\nWe are happy to inform that new client has been registered to our interface.\r\nCheck here the details of new client\r\n\r\nFirst Name\t{{firstName}}\r\nLast Name\t{{lastName}}\r\nPhone\t{{phoneNo}}\r\nEmail\t{{emailId}}\r\nCountry\t{{country}}\r\nOrganization\t{{Organization}}\r\nThanks,\r\nSkyeair Support \r\nskyeair.tech\r\n"
          //   }
          // }

          // ses.createTemplate(params, function(err, data) {
          //   if (err) console.log(err, err.stack); // an error occurred
          //   else     console.log(data);           // successful response
          // });

          // ses.updateTemplate(params, function(err, data) {
          //   if (err) console.log(err, err.stack); // an error occurred
          //   else     console.log(data);           // successful response
          // });


          // var params = {
          //   "TemplateName": "Hello3"
          // }
          // ses.deleteTemplate(params, function(err, data) {
          //   if (err) console.log(err, err.stack); // an error occurred
          //   else     console.log(data);           // successful response
          // });


        
        // var params = {
        //   MaxItems: 100
        // };
        // ses.listTemplates(params, function(err, data) {
        //   if (err) console.log(err, err.stack); // an error occurred
        //   else     console.log(data);           // successful response
        // });

        // wf.firstName = 'Naveen';
        // wf.lastName = "kumar";
        // wf.phoneNo = "918970086665";
        // wf.emailId = "naveen@skyeair.tech";
        // wf.country = 'India';
        // wf.Organization = 'Flipkart';
        

        // wf.TemplateData = "{ \"firstName\":\""+wf.firstName+"\", \"lastName\":\""+wf.lastName+"\",\"phoneNo\":\""+wf.phoneNo+"\", \"emailId\":\""+wf.emailId+"\",\"country\":\""+wf.country+"\", \"loginURL\":\""+wf.loginURL+"\", \"Organization\":\""+wf.Organization+"\" }";
        // var params = {
        //     "Source": "naveen@skyeair.tech",
        //     "Template": "Admin_Notify_Client_Registration_EmailTemplate_v1",
        //     "Destination": {
        //         "ToAddresses": ["naveen24.rymec@gmail.com"],
        //         "CcAddresses": [],
        //         "BccAddresses": []
        //     },            
        //     "TemplateData": wf.TemplateData
        // };

        // console.log(params);
        // ses.sendTemplatedEmail(params, function (err, data) {
        //     if (err) {
        //         console.log(err);
        //     }
        //     else {
        //         console.log(data);
        //     }  
        // });
// ***************************
        var params = {
        UserPoolId: 'ap-south-1_9tlQwkSND', /* required */
        Username: 'CLIENT00001' /* required */
      };
      cognitoidentityserviceprovider.adminGetUser(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
      });
// ****************************
      // cognitoidentityserviceprovider.adminDisableUser(params, function(err, data) {
      //   if (err) console.log(err, err.stack); // an error occurred
      //   else     console.log(data);           // successful response
      // });
    
    })

    //wf.emit('send_email_to_registered_user');
    wf.emit('perform_email_template');
};