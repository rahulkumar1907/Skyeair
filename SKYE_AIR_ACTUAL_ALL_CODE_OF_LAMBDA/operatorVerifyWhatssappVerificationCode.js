var AWS = require("aws-sdk");

const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});

const https = require('https');
const crypto = require('crypto');
const MasterTableName = process.env.MasterTableName;
const OperatorTableName = process.env.OperatorTableName;
const WhatsappTemplateName = process.env.WhatsappTemplateName;
const WhatsappSenderPhoneNumber = process.env.WhatsappSenderPhoneNumber;
const WhatsappMssionSubmissionTemplateName = process.env.WhatsappMssionSubmissionTemplateName;
const WhatsappMssionSubmissionParams1 = process.env.WhatsappMssionSubmissionParams1;

const doPostRequest = (data) => {

   return new Promise((resolve, reject) => {
      const options = {
         host: 'rcmapi.instaalerts.zone',
         path: '/services/rcm/sendMessage',
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            "Authentication":"Bearer SUj65SGir5xBFxYjOhPEOg=="
         }
      };

      //create the request object with the callback with the result
      const req = https.request(options, (res) => {
         resolve(JSON.stringify(res.statusCode));
      });

      // handle the possible errors
      req.on('error', (e) => {
         reject(e.message);
      });

      //do the request
      req.write(JSON.stringify(data));

      //finish the request
      req.end();
   });
};

exports.handler = (event, context, callback) => {

    var Created_Timestamp = new Date().toISOString();

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    wf.once('check_encrypted_request', function () {
        var parameters = '/';
        var Operator = new Object();
        Operator.data = event.body.hasOwnProperty('data') == true ? event.body.data.length == 0 ? event.body.data = '' : event.body.data : '';
        if (Operator.data.length == 0) { parameters = parameters + 'data/' }

        if (parameters.length > 1) { context.fail(JSON.stringify({ "data": null,"error": {"code": 400,"message": "Missing/Invalid parameters " + parameters,"type": "Missing/Invalid parameters","should_display_error": "false" },"statusCode": 400 })); return; }
        else { 
          var params = { TableName: MasterTableName, Key: { "Module":"Encryption" } };
          docClient.get(params, function (err, dataDb) {
              if (err) {
                  console.log(err);
                  context.fail(JSON.stringify({ "data": null, "error": { "code": 500, "message": "Internal server error", "type": "Server Error", "should_display_error": "false" }, "statusCode": 500 }));
                  return;
              } else {
                  // console.log(dataDb.Item);
                  wf.publicKey = dataDb.Item.client_publicKey;
                  wf.privateKey = dataDb.Item.privateKey;

                  // decryption code
                  wf.requestbodystring ='';                

                  for(let i=0;i<event.body.data.length;i++) {
                      let encyptedString = event.body.data[i];
                      const encryptedData = Buffer.from(encyptedString, 'base64');
                      try {
                        const decryptedData = crypto.privateDecrypt(
                          {
                            key: wf.privateKey.toString("base64"),
                            padding: crypto.constants.RSA_PKCS1_PADDING
                          },
                          encryptedData
                        );
                        console.log('decryptedData',decryptedData.toString());
                        wf.requestbodystring += decryptedData.toString();
                      } catch (err) {
                        console.log(err);
                        context.fail(JSON.stringify({ "data": null, "error": { "code": 500, "message": "Decryption error", "type": "Server Error", "should_display_error": "false" }, "statusCode": 500 }));
                      }                     
                  }

                  event.body = JSON.parse(wf.requestbodystring.toString()); 
                  // console.log(event.body);
                  wf.emit('check_request_body');
              }
          });
        }
    });
    
    wf.once('check_request_body', function() {
        var parameters = '/';
        var Operator = new Object();
        Operator.OperatorId = event.body.hasOwnProperty('OperatorId')==true ? event.body.OperatorId.length == 0 ? event.body.OperatorId = '' :event.body.OperatorId : '';
        Operator.WhatsappOTP = event.body.hasOwnProperty('WhatsappOTP')==true ? event.body.WhatsappOTP.length == 0 ? event.body.WhatsappOTP = '' :event.body.WhatsappOTP : '';

        if(Operator.OperatorId.length == 0) { parameters = parameters+'OperatorId/' }
        if(Operator.WhatsappOTP.length == 0) { parameters = parameters+'WhatsappOTP/' }

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
          wf.emit('check_verification_code');        }
    });

    wf.once('check_verification_code', function () {
        var params = {
            TableName: OperatorTableName,
            KeyConditionExpression: "UserId = :UserId",
            FilterExpression: 'WhatsappOTP = :WhatsappOTP',
            ExpressionAttributeValues: {
                ":UserId": event.body.OperatorId,
                ":WhatsappOTP": event.body.WhatsappOTP
            },

        }
        docClient.query(params, function (err, data) {
            if (err) {
                console.log(err)
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
            } else {
              // console.log(data);
              if(data.Items.length > 0) {
                wf.PhoneNumber = data.Items[0]["PhoneNumber"];
                wf.emit('update_whatsapp_status');
              } else {
                context.fail(JSON.stringify({
                    "data":null,
                    "error": {
                      "code": 400,
                      "message": "Invalid OTP",
                      "type": "Invalid OTP",
                      "should_display_error": "false"
                    },
                    "statusCode": 400
                }));
                return;
              }
            }
        })
    });

    wf.once('update_whatsapp_status', function () {
        var params = {
            TableName:OperatorTableName, 
            Key: {
                "UserId": event.body.OperatorId
            },
            ReturnValues: 'ALL_NEW',
            UpdateExpression: 'set #WhatsappVerification = :WhatsappVerification',
            ExpressionAttributeNames: {
                '#WhatsappVerification': 'WhatsappVerification'
            },
            ExpressionAttributeValues: {
                ':WhatsappVerification': true
            }
        };
        docClient.update(params, function (err, data) {
            if (err) {
                console.log(err)
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
            } else {
                
                wf.emit('send_welcome_template');
            }
        })
    });

    wf.once('send_welcome_template', function() {
      wf.PhoneNumber = parseInt(wf.PhoneNumber);
      console.log(wf.PhoneNumber);
      var req = {
        "message": {
          "channel": "WABA",
          "content": {
            "preview_url": false,
            "type": "TEMPLATE",
            "template": {
              "templateId": WhatsappTemplateName,
              "parameterValues": {
                "0": wf.PhoneNumber
              }
            }
          },
          "recipient": {
            "to": wf.PhoneNumber,
            "recipient_type": "individual",
            "reference": {
              "cust_ref": "Some Customer Ref",
              "messageTag1": "Message Tag Val1",
              "conversationId": "Some Optional Conversation ID"
            }
          },
          "sender": {
            "from": WhatsappSenderPhoneNumber
          },
          "preferences": {
            "webHookDNId": "1001"
          }
        },
        "metaData": {
          "version": "v1.0.9"
        }
      }
      // console.log(req);
      doPostRequest(req)
        // .then(result => context.done(null, {
        //     "data": {
        //         "MainData":'OTP verified successfully'
        //     },
        //     "error": null,
        //     "statusCode": 200
        // }))
        .then(result => wf.emit('send_mission_submission_template'))
        .catch(err => context.fail(JSON.stringify({
              "data": null,
              "error": {
                  "code": 500,
                  "message": err,
                  "type": "Server Error",
                  "should_display_error": "false"
              },
              "statusCode": 500
      })));
    });

    wf.once('send_mission_submission_template', function() {
      console.log('send_mission_submission_template');
      var req = {
        "message": {
          "channel": "WABA",
          "content": {
            "preview_url": false,
            "type": "TEMPLATE",
            "template": {
              "templateId": WhatsappMssionSubmissionTemplateName              
            }
          },
          "recipient": {
            "to": wf.PhoneNumber,
            "recipient_type": "individual",
            "reference": {
              "cust_ref": "Some Customer Ref",
              "messageTag1": "Message Tag Val1",
              "conversationId": "Some Optional Conversation ID"
            }
          },
          "sender": {
            "from": WhatsappSenderPhoneNumber
          },
          "preferences": {
            "webHookDNId": "1001"
          }
        },
        "metaData": {
          "version": "v1.0.9"
        }
      }
      // console.log(req);
      doPostRequest(req)
        .then(result => context.done(null, {
            "data": {
                "MainData":'OTP verified successfully'
            },
            "error": null,
            "statusCode": 200
        }))
        .catch(err => context.fail(JSON.stringify({
              "data": null,
              "error": {
                  "code": 500,
                  "message": err,
                  "type": "Server Error",
                  "should_display_error": "false"
              },
              "statusCode": 500
      })));
    })

    wf.emit('check_encrypted_request');
};
