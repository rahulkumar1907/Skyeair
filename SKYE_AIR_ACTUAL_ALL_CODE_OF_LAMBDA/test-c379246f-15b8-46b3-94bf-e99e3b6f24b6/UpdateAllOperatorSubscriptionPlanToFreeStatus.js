var AWS = require('aws-sdk');

AWS.config.region = 'ap-south-1';

var sts = new AWS.STS();

exports.handler = (event, context, callback) => {
    console.log(event);
    console.log(event.body);
    sts.assumeRole({

      RoleArn: 'arn:aws:iam::330317575177:role/dynamodb-full-acccess-role-navifly-test-env',

      RoleSessionName: 'test-session'

    }, function(err, data) {

      if (err) { // an error occurred

        console.log('Cannot assume role');

        console.log(err, err.stack);

      } else { // successful response

        console.log(data);
        console.log(event.body);

        AWS.config.update({

          accessKeyId: data.Credentials.AccessKeyId,

          secretAccessKey: data.Credentials.SecretAccessKey,

          sessionToken: data.Credentials.SessionToken

        });

        const docClient = new AWS.DynamoDB.DocumentClient({
            "region": "ap-south-1"
        });

        var params = {
            TableName: "test",
            Key:{
                "Email-Id": "xy@gmail.com"
            }
        }
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
                console.log(data.Item);
                
            }
        });

      }

    });
};

