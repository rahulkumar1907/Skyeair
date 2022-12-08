var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});
const ClientTable = process.env.ClientTable
const SkyeTunnelTable = process.env.SkyeTunnelTable

exports.handler = (event, context, callback) => {
    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();
    
    wf.once('check_request_body', function () {
        var parameters = '/';
        var SkyeTunnelDetails = new Object();
        SkyeTunnelDetails.ClientId = event.body.hasOwnProperty('ClientId') == true ? event.body.ClientId.length == 0 ? event.body.ClientId = '' : event.body.ClientId : '';

        if (SkyeTunnelDetails.ClientId.length == 0) { parameters = parameters + 'ClientId/' }
        

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
            wf.ClientId = SkyeTunnelDetails.ClientId
            wf.emit('get_organizationID_from_CliengtProfile');
        }
    })
    
    wf.once('get_organizationID_from_CliengtProfile', function (){
        console.log(wf.ClientId)
        var params = {
            TableName: ClientTable,
            IndexName: 'ClientId',
            KeyConditionExpression: 'ClientId = :cityVal',
            ExpressionAttributeValues: {
            ':cityVal': wf.ClientId
           }
        };
        
        docClient.query(params, function(err,data){
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
                 wf.OrganizationId = data.Items[0].OrganizationId
                 wf.emit('get_skytunnels_list')
            }            
        })
    })
    
    wf.once('get_skytunnels_list',function (){
        var params = {
            TableName : SkyeTunnelTable,
            FilterExpression: "contains (#OrganizationId, :OrganizationId) AND #Status = :Status",
            ExpressionAttributeNames: {
                "#OrganizationId": "OrganizationId",
                "#Status": "Status",
            },
            ExpressionAttributeValues : {   
                ':OrganizationId' : wf.OrganizationId,
                ":Status": "Active"
            }            
        };
        
        docClient.scan(params, function (err, data) {
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
                console.log(data);
                context.done(null, {
                    "data": {
                        "MainData": data
                    },
                    "error": null,
                    "statusCode": 200
                });
                return;
            }
        })        
    })
    
    wf.emit('check_request_body')
};
