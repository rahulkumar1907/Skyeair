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
var MigrationAdminId = process.env.MigrationAdminId;

exports.handler = (event, context, callback) => {
    console.log(event.body , "Body");
    var Created_Timestamp = new Date().toISOString();

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    function Trim(string) {
        string = string.replace(/ {1,}/g, " ");
        return string.trim();
    }

    wf.once('check_request_body', function () {
        var parameters = '/';
        var Admin = new Object();
        Admin.FirstName = event.body.hasOwnProperty('FirstName') == true ? event.body.FirstName.length == 0 ? event.body.FirstName = '' : event.body.FirstName : '';
        Admin.LastName = event.body.hasOwnProperty('LastName') == true ? event.body.LastName.length == 0 ? event.body.LastName = '' : event.body.LastName : '';
        Admin.EmailId = event.body.hasOwnProperty('EmailId') == true ? event.body.EmailId.length == 0 ? event.body.EmailId = '' : event.body.EmailId : '';
        Admin.PhoneNumber = event.body.hasOwnProperty('PhoneNumber') == true ? event.body.PhoneNumber.length == 0 ? event.body.PhoneNumber = '' : event.body.PhoneNumber : '';
        Admin.Role = event.body.hasOwnProperty('Role') == true ? event.body.Role.length == 0 ? event.body.Role = '' : event.body.Role : '';
        Admin.Country = event.body.hasOwnProperty('Country') == true ? event.body.Country.length == 0 ? event.body.Country = '' : event.body.Country : '';
       


        if (Admin.FirstName.length == 0) { parameters = parameters + 'FirstName/' }
        if (Admin.LastName.length == 0) { parameters = parameters + 'LastName/' }
        if (Admin.EmailId.length == 0) { parameters = parameters + 'EmailId/' }
        if (Admin.PhoneNumber.length == 0) { parameters = parameters + 'PhoneNumber/' }
        if (Admin.Role.length == 0) { parameters = parameters + 'Role/' }
        if (Admin.Country.length == 0) { parameters = parameters + 'Country/' }

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
                FirstName : Trim(event.body.FirstName),
                LastName : Trim(event.body.LastName),
                EmailId : event.body.EmailId,
                PhoneNumber : event.body.PhoneNumber,
                Country: event.body.Country,
                Role:event.body.Role,
                UserActive: false,
                LastLogin:Created_Timestamp,
                TS_Created:Created_Timestamp,
                TS_Updated:Created_Timestamp,
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
            console.log("error2")
            if (err) {
                console.log("error2")
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
                if (data.Items.length > 0) {
                    console.log("error3")
                    wf.dup = data.Items[0].EmailId == wf.clientDetails.EmailId ? 'Email Id' : 'Phone Number';
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
                "Module": "AdminRegistrationCounter"
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
                console.log("Data",data);
                console.log(data.Attributes.CounterId);
                var str = "" + data.Attributes.CounterId;
                var pad = "00000";
                var ans = pad.substring(0, pad.length - str.length) + str;
                wf.clientDetails.AdminId = "Admin" + ans;
                wf.emit('register_Admin_to_cognito');
            }
        });
    });


    wf.once('register_Admin_to_cognito', function () {
        var password = Math.random().toString(36).slice(-8);
        var params = {
            ClientId: MigrationAdminId, /* required */
            Password: password, /* required */
            Username: wf.clientDetails.AdminId,
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
                        "message": "Internal server error1",
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
                    Username: wf.clientDetails.AdminId
                }, function (err) {
                    if (err) {
                        console.log("error6")
                        console.log(err, err.stack)
                    } else {
                        // wf.clientDetails.ActiveStatus = true;
                        wf.emit('store_Admin_to_db')
                    }
                })
            }
        });

    })
    wf.once('store_Admin_to_db', function () {        
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
                        "should_display_error": "false"
                    },
                        "type": "Server Error",
                    "statusCode": 500
                }));
                return;
            } else {
                var params = {
                    ClientId: MigrationAdminId, /* required */
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