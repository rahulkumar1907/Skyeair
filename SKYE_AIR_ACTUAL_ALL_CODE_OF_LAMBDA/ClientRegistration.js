var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});
var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({
    "region": process.env.AwsRegionForPool
});

const TableName = process.env.TableName;
const MasterTableName = process.env.MasterTableName;
var UserPoolId = process.env.UserPoolId;
var MigrationClientId = process.env.MigrationClientId;
//const S3BucketName = process.env.S3BucketName;
var s3 = new AWS.S3();
var count = 1

exports.handler = (event, context, callback) => {
    console.log(event.body, "Body");
    var Created_Timestamp = new Date().toISOString();

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    function Trim(string) {
        string = string.replace(/ {1,}/g, " ");
        return string.trim();
    }

    wf.once('check_request_body', function () {
        var parameters = '/';
        var Client = new Object();
        Client.FirstName = event.body.hasOwnProperty('FirstName') == true ? event.body.FirstName.length == 0 ? event.body.FirstName = '' : event.body.FirstName : '';
        Client.LastName = event.body.hasOwnProperty('LastName') == true ? event.body.LastName.length == 0 ? event.body.LastName = '' : event.body.LastName : '';
        Client.EmailId = event.body.hasOwnProperty('EmailId') == true ? event.body.EmailId.length == 0 ? event.body.EmailId = '' : event.body.EmailId : '';
        Client.PhoneNumber = event.body.hasOwnProperty('PhoneNumber') == true ? event.body.PhoneNumber.length == 0 ? event.body.PhoneNumber = '' : event.body.PhoneNumber : '';
        Client.Organization = event.body.hasOwnProperty('Organization') == true ? event.body.Organization.length == 0 ? event.body.Organization = '' : event.body.Organization : '';
        Client.Country = event.body.hasOwnProperty('Country') == true ? event.body.Country.length == 0 ? event.body.Country = '' : event.body.Country : '';



        if (Client.FirstName.length == 0) { parameters = parameters + 'FirstName/' }
        if (Client.LastName.length == 0) { parameters = parameters + 'LastName/' }
        if (Client.EmailId.length == 0) { parameters = parameters + 'EmailId/' }
        if (Client.PhoneNumber.length == 0) { parameters = parameters + 'PhoneNumber/' }
        if (Client.Organization.length == 0) { parameters = parameters + 'Organization/' }
        if (Client.Country.length == 0) { parameters = parameters + 'Country/' }

        if (parameters.length > 1) {
            console.log("error1")
            context.fail(JSON.stringify({
                "data": null,
                "error": {
                    "code": 400,
                    "message": "Missing/Invalid parameters " + parameters,
                    "type": "Missing/Invalid parameters",
                    "should_display_error": "false"
                },
                "statusCode": 400
            }));
            return;
        } else {
            wf.clientDetails = {
                FirstName: Trim(event.body.FirstName),
                LastName: Trim(event.body.LastName),
                EmailId: event.body.EmailId,
                PhoneNumber: event.body.PhoneNumber,
                Organization: event.body.Organization,
                Country: event.body.Country,
                UserActive: false,
                UserStatus: false,
                LastLogin: Created_Timestamp,
                TS_Created: Created_Timestamp,
                TS_Updated: Created_Timestamp,
                Search_First_Name: Trim(event.body.FirstName).toLowerCase(),
                Search_Last_Name: Trim(event.body.LastName).toLowerCase(),
            }
           

            wf.emit('check_request_body_field_level');
        }
    })
    wf.once('check_request_body_field_level', function () {
        var params = {
            TableName: TableName,
            FilterExpression: '#EmailId = :EmailId OR #PhoneNumber = :PhoneNumber',
            ExpressionAttributeNames: {
                "#EmailId": "EmailId",
                "#PhoneNumber": "PhoneNumber"

            },
            ExpressionAttributeValues: {
                ":EmailId": wf.clientDetails.EmailId,
                ":PhoneNumber": wf.clientDetails.PhoneNumber
            }
        };
        docClient.scan(params, function (err, data) {
            if (err) {
                console.log("error2")
                console.log("Error", err);
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
                if (data.Items.length > 0) {

                    wf.dup = data.Items[0].EmailId == wf.clientDetails.EmailId ? 'Email Id' : 'Phone Number';
                    console.log("error3")
                    context.fail(JSON.stringify({
                        "data": null,
                        "error": {
                            "code": 400,
                            "message": wf.dup + " already exists",
                            "type": "Duplicate Operator",
                            "should_display_error": "true"
                        },
                        "statusCode": 400
                    }));

                    return;
                } else {
                    wf.emit('get_counter_from_db')
                }
            }
        })
    });

    wf.once('get_counter_from_db', function () {
        docClient.update({
            "TableName": MasterTableName,
            "Key": {
                "Module": "RegistrationCounter"
            },
            "ExpressionAttributeValues": {
                ":a": 1
            },
            "ExpressionAttributeNames": {
                "#v": "CounterId"
            },
            "UpdateExpression": "SET #v = #v + :a",
            "ReturnValues": "UPDATED_NEW"

        }, function (err, data) {
            if (err) {
                console.log(err);
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
                console.log(data.Attributes.CounterId);
                var str = "" + data.Attributes.CounterId;
                var pad = "00000";
                var ans = pad.substring(0, pad.length - str.length) + str;
                wf.clientDetails.ClientId = "CLIENT" + ans;
                // console.log("OrganisationNmae", wf.clientDetails.Organization)
                wf.emit('get_details_from_db_for_organization');
            }
        });
    });
    wf.once('get_details_from_db_for_organization', function () {
        var params = {
            TableName: "Organization"
        }
        docClient.scan(params, function (err, data) {
            if (err) {
                console.log("error2")
                console.log("Error", err);
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
            else  {
                if (data.Items.length > 0) {
                    //   console.log(data.Items)
                    let boolean = true
                    for (let i = 0; i < data.Items.length; i++) {
                        if (data.Items[i].Organization == wf.clientDetails.Organization) {
                            wf.clientDetails.OrganizationId = data.Items[i].OrganizationId
                            // data.Items[i].OrganizationId=
                            // console.log("id---",data.Items[i].OrganizationId)
                          
                          wf.emit('register_client_to_cognito')
                          boolean = false
                          break;
                        }
                    }
                    if(boolean) wf.emit('get_counter_from_db_for_organization_id')
                      
                }
            }
             
        })
        //   wf.emit('get_counter_from_db_for_organization_id')
      
    });

    wf.once('get_counter_from_db_for_organization_id', function () {
        docClient.update({
            "TableName": MasterTableName,
            "Key": {
                "Module": "OrganizationCounter"
            },
            "ExpressionAttributeValues": {
                ":a": 1
            },
            "ExpressionAttributeNames": {
                "#v": "CounterId"
            },
            "UpdateExpression": "SET #v = #v + :a",
            "ReturnValues": "UPDATED_NEW"

        }, function (err, data) {
            if (err) {
                console.log(err);
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
                // console.log(data.Attributes.CounterId);
                var strOrganization = "" + data.Attributes.CounterId;
                var padOrganization = "00000";
                var ans = padOrganization.substring(0, padOrganization.length - strOrganization.length) + strOrganization;
                wf.clientDetails.OrganizationId = wf.clientDetails.Organization +"-"+ ans;
                // console.log("OrganisationNmae", wf.clientDetails.Organization)
                wf.emit('store_to_organization_db');
            }
        });
    });
    
wf.once("store_to_organization_db",function(){
    var Item={
        OrganizationId:wf.clientDetails.OrganizationId,
        Organization:wf.clientDetails.Organization,
        ContractStatus: "800/month",
        Mode: "/Month",
        NumOfFlightsAvailable:800
    }
    var param={
        TableName:"Organization",
        Item:Item
    }
    docClient.put(param,function(err,data){
        if(err){
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
             wf.emit('register_client_to_cognito');
        }
    })
})
    wf.once('register_client_to_cognito', function () {
        var password = Math.random().toString(36).slice(-8);
        var params = {
            ClientId: MigrationClientId, /* required */
            Password: password, /* required */
            Username: wf.clientDetails.ClientId,
            UserAttributes: [{
                Name: 'name',
                Value: wf.clientDetails.FirstName
            },
            {
                Name: 'email',
                Value: wf.clientDetails.EmailId
            }
            ]
        }
        cognitoidentityserviceprovider.signUp(params, function (err, data) {
            if (err) {
                console.log("error5")
                console.log(err);
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
                cognitoidentityserviceprovider.adminUpdateUserAttributes({
                    UserAttributes: [{
                        Name: 'email_verified',
                        Value: 'true'
                    }
                    ],
                    UserPoolId: UserPoolId,
                    Username: wf.clientDetails.ClientId
                }, function (err) {
                    if (err) {
                        console.log("error6")
                        console.log(err, err.stack)
                    } else {

                        // cognitoidentityserviceprovider.adminDisableUser({
                        //     UserPoolId: UserPoolId, /* required */
                        //     Username: wf.clientDetails.ClientId /* required */
                        // }, function(err, data) {
                        //     if (err) {
                        //         console.log(err, err.stack); // an error occurred
                        //     }
                        //     else  {
                        //         console.log(data);           // successful response
                        //         wf.emit('store_client_to_db');
                        //     }
                        // });
                        wf.emit('store_client_to_db');

                    }
                })
            }
        });
    })
    
    wf.once('store_client_to_db', function () {
        var params = {
            TableName: TableName,
            Item: wf.clientDetails
        };
        console.log("Client", wf.clientDetails)
        docClient.put(params, function (err, data) {
            if (err) {
                console.log("error7")
                console.log(err);
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
                var params = {
                    ClientId: MigrationClientId, /* required */
                    Username: event.body.EmailId
                };
                cognitoidentityserviceprovider.forgotPassword(params, function (err, data) {
                    if (err) {
                        console.log("error8")
                        console.log(err);
                        context.fail(JSON.stringify({
                            "error": {
                                "code": 500,
                                "message": "Internal server!!!!!!!!" + err,
                                "type": "Server Error",
                                "should_display_error": "false"
                            },
                            "statusCode": 500
                        }));
                        return;
                    } else {
                        context.done(null, {
                            "data": {
                                "MainData": "User registered successfully"
                            },
                            "error": null,
                            "statusCode": 200
                        });
                        return;
                    }
                });
            }
        })
    });

    wf.emit('check_request_body');
};