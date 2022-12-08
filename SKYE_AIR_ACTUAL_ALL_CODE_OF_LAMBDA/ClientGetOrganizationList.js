
const aws = require('aws-sdk')
const ddb = new aws.DynamoDB.DocumentClient({ "region": process.env.AWS_Region });

exports.handler = async (event, context, callbacK) => {
    try {
        const params = { TableName: process.env.TableName }
        //************************* scanning the all data of  table ( return all table data )*****************************//
        const data = await ddb.scan(params).promise()
        // ******************************* sending all the existing organisation list**************************************//
        var organizationList = []
        for (let i = 0; i < data.Items.length; i++) {
            if (data.Items[i].Organization) { organizationList.push(data.Items[i].Organization) }
        }
        // ************************************for making Other organisation field*****************************************//
        organizationList.push("Other")
        let organizationSet = new Set(organizationList)
        let arrayOfOrganisedList = Array.from(organizationSet)
        return ({ "statusCode": 200, "error": "null", "data": arrayOfOrganisedList })
        // ********************************************************************************************************************//
    }
    catch (err) {
        // console.log(err);
        let error = { "statusCode": 500, "error": err.message, "type": "internal server error", "should_display_error": "false" }
        context.fail(JSON.stringify(error))
        return
    }

};