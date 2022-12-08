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

        if(Operator.OperatorId.length == 0) { parameters = parameters+'OperatorId/' }

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
          wf.WhatsappOTP = Math.floor(100000 + Math.random() * 900000);
          wf.emit('get_operator_number');
        }
    });

    wf.once('get_operator_number', function () {      
      var params = {
            TableName:OperatorTableName, 
            Key: {
                "UserId": event.body.OperatorId
            }
        };
        docClient.get(params, function (err, data) {
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
                wf.PhoneNumber = data.Item.PhoneNumber;
                wf.emit('send_verification_code');
            }
        })
    });

    wf.once('send_verification_code', function() {
      console.log(wf.WhatsappOTP);
      console.log(wf.PhoneNumber);
      wf.PhoneNumber = parseInt(wf.PhoneNumber);
      var req = {
        "message": {
          "channel": "WABA",
          "content": {
            "preview_url": false,
            "type": "TEMPLATE",
            "template": {
              "templateId": WhatsappTemplateName,
              "parameterValues": {
                "0": wf.WhatsappOTP
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
        .then(result => wf.emit('store_verification_code'))
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

    wf.once('store_verification_code', function () {       
        
        var params = {
            TableName:OperatorTableName, 
            Key: {
                "UserId": event.body.OperatorId
            },
            ReturnValues: 'ALL_NEW',
            UpdateExpression: 'set #WhatsappOTP = :WhatsappOTP, #TS_Updated = :TS_Updated',
            ExpressionAttributeNames: {
                '#WhatsappOTP': 'WhatsappOTP',
                '#TS_Updated':'TS_Updated'
            },
            ExpressionAttributeValues: {
                ':WhatsappOTP': wf.WhatsappOTP,
                ':TS_Updated':Created_Timestamp
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
                context.done(null, {
                    "data": {
                        "MainData": 'OTP sent successfully'
                    },
                    "error": null,
                    "statusCode": 200
                });
                return;
            }
        })
    });

    wf.emit('check_encrypted_request');
};
