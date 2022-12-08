const aws = require('aws-sdk')
const ddb = new aws.DynamoDB.DocumentClient({ region: process.env.AWSRegion });
exports.handler = async (event, context, callback) => {
    try {

        if (!(event.body.ClientId) || event.body.ClientId == "undefined") { return ({ "statusCode": 400, "error": "Missing/Invalid ClientId" }) }
        if (!(event.body.FlightId) && (!event.body.PickupLocation) && (!event.body.PackageType)) { return ({ "statusCode": 400, "error": "Missing/Invalid FlightId Or PickupLocation Or PackageType", "Message": "FlightId or PickupLocation or PackageType is Required" }) }
        //   *************************************get organisationId for filtration in Flight table***********************************
        var params = {
            TableName: 'ClientProfile',
            IndexName: 'ClientId',
            KeyConditionExpression: 'ClientId = :ClientId',
            ExpressionAttributeValues: {
                ':ClientId': event.body.ClientId
            }
        };

        const clientDetail = await ddb.query(params).promise()

        var OrganizationId = clientDetail.Items[0].OrganizationId

        //  ***************************************Get Flight List by FlightId Parameter ********************************************************************
        if (event.body.FlightId && OrganizationId) {

            const filterParam = {
                TableName: "Flight",
                FilterExpression: '#OrganizationId = :OrganizationId AND contains(#FlightId, :FlightId) ',
                ExpressionAttributeValues: {
                    ':OrganizationId': OrganizationId,
                    ':FlightId': event.body.FlightId,
                    
                },
                ExpressionAttributeNames: {
                    '#OrganizationId': 'OrganizationId',
                    '#FlightId': 'FlightId',
                }
            }

            const FlightDetail = await ddb.scan(filterParam).promise()

            return ({ "statusCode": 200, "data": FlightDetail.Items })
        }
// ******************************************Get Flight List By PickupLocation Parameter *******************************************
        if (event.body.PickupLocation && OrganizationId) {

            const filterParam = {
                TableName: "Flight",
                FilterExpression: '#OrganizationId = :OrganizationId AND contains(#PickupLocation, :PickupLocation) ',
                ExpressionAttributeValues: {
                    ':OrganizationId': OrganizationId,
                    ':PickupLocation': event.body.PickupLocation
                },
                ExpressionAttributeNames: {
                    '#OrganizationId': 'OrganizationId',
                    '#PickupLocation': 'PickupLocation'
                }
            }

            const FlightDetail = await ddb.scan(filterParam).promise()

            return ({ "statusCode": 200, "data": FlightDetail.Items })
        }
        // **********************************Get Flight List By PackageType Parameter*******************************************************
        if (event.body.PackageType && OrganizationId) {

            const filterParam = {
                TableName: "Flight",
                FilterExpression: '#OrganizationId = :OrganizationId AND contains(#PackageType, :PackageType) ',
                ExpressionAttributeValues: {
                    ':OrganizationId': OrganizationId,
                    ':PackageType': event.body.PackageType
                },
                ExpressionAttributeNames: {
                    '#OrganizationId': 'OrganizationId',
                    '#PackageType': 'PackageType'
                }
            }

            const FlightDetail = await ddb.scan(filterParam).promise()

            return ({ "statusCode": 200, "data": FlightDetail.Items })
        }


    }
    catch (err) {
        return ({ "statusCode": 500, "error": err.message, "error_type": "Internal Server Error" })
    }
};