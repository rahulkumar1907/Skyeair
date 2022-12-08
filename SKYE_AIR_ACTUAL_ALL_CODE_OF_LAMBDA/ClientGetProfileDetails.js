var AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({ region: process.env.AWS_Region });


exports.handler = async (event, context, callback) => {
    try {
        if (!event.body.EmailId) { return ({ "statusCode": 400, "error": "Missing/Invalid EmailId", "type": "internal server error" }) }
      // ********************************************client get details from db***********************************************************
        const params = {
            TableName: process.env.TableName,
            Key: { EmailId: event.body.EmailId }
        }
        let ClientDetail = await ddb.get(params).promise()
        if (!ClientDetail.Item) { return ({ "statusCode": 400, "message": "Client Not Found" }) }
    //  ****************************storing  required organization details to client details*************************************
        const Organizationparams = {
            TableName: "Organization",
            Key: { OrganizationId: ClientDetail.Item.OrganizationId }
        }
        let OrganizationData = await ddb.get(Organizationparams).promise()
        ClientDetail.Item.OrganisationDetails = {
            "ContractStatus": OrganizationData.Item.ContractStatus,
            "Mode": OrganizationData.Item.Mode,
            "NumOfFlightsAvailable": OrganizationData.Item.NumOfFlightsAvailable
        }

        if (ClientDetail) { return [ClientDetail.Item] }
    }
    catch (err) {
        return ({ "statusCode": 500, "error": err.message, "type": "internal server error" })
    }
};