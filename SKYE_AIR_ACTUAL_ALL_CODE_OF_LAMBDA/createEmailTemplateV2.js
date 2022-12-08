const AWS = require('aws-sdk');
  
var ses = new AWS.SES({ apiVersion: '2010-12-01', region:"ap-south-1" });

var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({
      "region": process.env.AwsRegionForEmail
  });
exports.handler = async (event) => {
    try{
      //   *****************************************************************************************************************
      // "Admin_Notify_For_Flight_Plan_EmailTemplate_v3"(contain only column of flight details)
  //   var params = {
  //           "Template": {
  //             "TemplateName": "Admin_Notify_For_Flight_Plan_EmailTemplate_v4",
  //             "SubjectPart": "New Flight Plan",
  //             "HtmlPart": "<html>\r\n\r\n<body>\r\n <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" class=\"m_-5269160379379659625templateContainer\" style=\"border-collapse:collapse;border:0;max-width:600px!important\">\r\n <tbody>\r\n <tr>\r\n <td valign=\"top\" id=\"m_-5269160379379659625templatePreheader\" style=\"background:#fafafa none no-repeat center\/cover;background-color:#fafafa;background-image:none;background-repeat:no-repeat;background-position:center;background-size:cover;border-top:0;border-bottom:0;padding-top:9px;padding-bottom:9px\"><\/td>\r\n <\/tr>\r\n <tr>\r\n <td valign=\"top\" id=\"m_-5269160379379659625templateUpperBody\" style=\"background:#ffffff none no-repeat center\/cover;background-color:#ffffff;background-image:none;background-repeat:no-repeat;background-position:center;background-size:cover;border-top:0;border-bottom:0;padding-top:0;padding-bottom:0\">\r\n <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" class=\"m_-5269160379379659625mcnTextBlock\" style=\"min-width:100%;border-collapse:collapse\">\r\n <tbody class=\"m_-5269160379379659625mcnTextBlockOuter\">\r\n <tr>\r\n <td valign=\"top\" class=\"m_-5269160379379659625mcnTextBlockInner\" style=\"padding-top:9px\">\r\n <table align=\"left\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:100%;min-width:100%;border-collapse:collapse\" width=\"100%\" class=\"m_-5269160379379659625mcnTextContentContainer\">\r\n <tbody>\r\n <tr>\r\n <td valign=\"top\" class=\"m_-5269160379379659625mcnTextContent\" style=\"padding-top:0;padding-right:18px;padding-bottom:9px;padding-left:18px;word-break:break-word;color:#202020;font-family:Helvetica;font-size:16px;line-height:150%;text-align:left\">\r\n <h1 style=\"display:block;margin:0;padding:0;color:#202020;font-family:Helvetica;font-size:26px;font-style:normal;font-weight:bold;line-height:125%;letter-spacing:normal;text-align:left\"><span style=\"font-size:18px\">Hello Team,<\/span>&nbsp;<\/h1>\r\n \r\n <br>\r\n We are happy to inform that client has been registered for a new flight plan.<br>\r\n Check here the details of flight plan<br>\r\n <br>\r\n <table style=\"width:100%;border: 1px solid #ccc;border-collapse: collapse;text-align: left;\">\r\n <tbody>\r\n <tr style=\"padding: 5px;\">\r\n <th style=\"border-bottom:1px solid #ccc;padding: 5px;\">FlightId<\/th>\r\n <td style=\"border-bottom:1px solid #ccc;padding: 5px;\">{{FlightId}}<\/td>\r\n <th style=\"border-bottom:1px solid #ccc;padding: 5px;\">OrderId<\/th>\r\n <td style=\"border-bottom:1px solid #ccc;padding: 5px;\">{{OrderId}}<\/td>\r\n\r\n <tr style=\"padding: 5px;\">\r\n <th style=\"border-bottom:1px solid #ccc;padding: 5px;\">SkyTunnel Id<\/th>\r\n <td style=\"border-bottom:1px solid #ccc;padding: 5px;\">{{SkyTunnelId}}<\/td>\r\n <th style=\"border-bottom:1px solid #ccc;padding: 5px;\">Start Time<\/th>\r\n <td style=\"border-bottom:1px solid #ccc;padding: 5px;\">{{StartTime}}<\/td>\r\n\r\n <tr style=\"padding: 5px;\">\r\n <th style=\"border-bottom:1px solid #ccc;padding: 5px;\">End Time<\/th>\r\n <td style=\"border-bottom:1px solid #ccc;padding: 5px;\">{{EndTime}}<\/td>\r\n <th style=\"border-bottom:1px solid #ccc;padding: 5px;\">Number Of Packages<\/th>\r\n <td style=\"border-bottom:1px solid #ccc;padding: 5px;\">{{NumOfPackages}}<\/td>\r\n\r\n <tr style=\"padding: 5px;\">\r\n <th style=\"border-bottom:1px solid #ccc;padding: 5px;\">Package Type<\/th>\r\n <td style=\"border-bottom:1px solid #ccc;padding: 5px;\">{{PackageType}}<\/td>\r\n <th style=\"border-bottom:1px solid #ccc;padding: 5px;\">Package Condition<\/th>\r\n<td style=\"border-bottom:1px solid #ccc;padding: 5px;\">{{PackageCondition}}<\/td>\r\n<\/tr>\r\n \r\n<tr style=\"padding: 5px;\">\r\n<th style=\"border-bottom:1px solid #ccc;padding: 5px;\">Package Category<\/th>\r\n<td style=\"border-bottom:1px solid #ccc;padding: 5px;\">{{PackageCategory}}<\/td>\r\n<th style=\"border-bottom:1px solid #ccc;padding: 5px;\">Volumetric Weight<\/th>\r\n<td style=\"border-bottom:1px solid #ccc;padding: 5px;\">{{VolumetricWeight}}<\/td>\r\n<\/tr>\r\n\r\n<tr style=\"padding: 5px;\">\r\n <th style=\"border-bottom:1px solid #ccc;padding: 5px;\">Pickup Time<\/th>\r\n <td style=\"border-bottom:1px solid #ccc;padding: 5px;\">{{PickupTime}}<\/td>\r\n <th style=\"border-bottom:1px solid #ccc;padding: 5px;\">Cold Chain<\/th>\r\n<td style=\"border-bottom:1px solid #ccc;padding: 5px;\">{{ColdChain}}<\/td>\r\n<\/tr>\r\n\r\n<tr style=\"padding: 5px;\">\r\n <th style=\"border-bottom:1px solid #ccc;padding: 5px;\">DroneId<\/th>\r\n<td style=\"border-bottom:1px solid #ccc;padding: 5px;\">{{DroneId}}<\/td>\r\n<th style=\"border-bottom:1px solid #ccc;padding: 5px;\">Drone Name<\/th>\r\n<td style=\"border-bottom:1px solid #ccc;padding: 5px;\">{{DroneName}}<\/td>\r\n<\/tr>\r\n\r\n <tr style=\"padding: 5px;\">\r\n<th style=\"border-bottom:1px solid #ccc;padding: 5px;\">ClientId<\/th>\r\n<td style=\"border-bottom:1px solid #ccc;padding: 5px;\">{{ClientId}}<\/td>\r\n<th style=\"border-bottom:1px solid #ccc;padding: 5px;\">OrganizationId<\/th>\r\n<td style=\"border-bottom:1px solid #ccc;padding: 5px;\">{{OrganizationId}}<\/td>\r\n<\/tr>\r\n<\/tbody>\r\n <\/table>\r\n <br>\r\n <strong><span style=\"color:#3366cc\"><a href=\"{{ApproveLink}}\">Click Here To Approve Flight Plan<\/a><\/span><\/strong>\r\n <br>\r\n Thanks,<br>\r\n Skyeair Support&nbsp;<br>\r\n <strong><span style=\"color:#3366cc\"><a href=\"http:\/\/www.skyeair.tech\" target=\"_blank\" data-saferedirecturl=\"https:\/\/www.google.com\/url?q=http:\/\/www.skyeair.tech&amp;source=gmail&amp;ust=1551946092272000&amp;usg=AFQjCNGBO5idm4HRff8Sw650D6Ev0Ywk4w\">skyeair.tech<\/a><\/span><\/strong>\r\n <\/p>\r\n <\/td>\r\n <\/tr>\r\n <\/tbody>\r\n <\/table>\r\n <\/td>\r\n <\/tr>\r\n <\/tbody>\r\n <\/table>\r\n <\/td>\r\n <\/tr>\r\n <\/tbody>\r\n <\/table>\r\n <\/td>\r\n<\/body>\r\n\r\n<\/html>",
  //             "TextPart":"Hello Team, \r\n\r\nWe are happy to inform that client has been registered for a new flight plan.\r\nCheck here the details of flight plan\r\n\r\nFlightId\t{{FlightId}}\r\nOrderId\t{{OrderId}}\r\nSkyTunnel Id\t{{SkyTunnelId}}\r\nStart Time\t{{StartTime}}\r\nEnd Time\t{{EndTime}}\r\nNumber Of Packages\t{{NumOfPackages}}\r\nPackage Type\t{{PackageType}}\r\nPackage Weight\t{{PackageWeight}}\r\nPackage Category\t{{PackageCategory}}\r\nPackage Condition\t{{PackageCondition}}\r\nVolumetric Weight\t{{VolumetricWeight}}\r\nPickup Time\t{{PickupTime}}\r\nCold Chain\t{{ColdChain}}\r\nDroneId\t{{DroneId}}\r\nDrone Name\t{{DroneName}}\r\nClientId\t{{ClientId}}\r\nOrganizationId\t{{OrganizationId}}\r\n\r\n{{ApproveLink}}\r\n\r\nThanks,\r\nSkyeair Support \r\nskyeair.tech"
  //           }
  //         }

  //   let data= await     ses.createTemplate(params).promise()
  //   if(!data){ return ({"statusCode":400,"error":"internal server error","message":"template Not created succesfully"})}
  //   if(data){ return ({"statusCode":200,"message":"template created succesfully","data":data})}
  // **********************************************************************************************************************************
  //     var FlightId = 'AW-00001';
  //     var OrderId = "pk-12-kl";
  //     var   SkyTunnelId = "Sky-00123";
  //     var   StartTime = "4:30";
  //     var  EndTime = '5:25';
  //     var   NumOfPackages = '20';
  //     var PackageType = 'Cold';
  //     var PackageWeight = "200 kg";
  //     var   PackageCondition = "Good";
  //     var   PackageCategory = "Medicine";
  //     var   VolumetricWeight = "100 cc";
  //     var  PickupTime = '2:25';
  //     var   ColdChain = 'yes';
  //      var DroneId = 'MX-00006';
  //     var DroneName = "Stellor";
  //     var   ClientId = "Client-00015";
  //     var   OrganizationId = "Flipkart-00001";
  //     var  CreatedByName = 'Rahul';
  //     var   Status = 'proccessing';
  //     var TS_Created = '11-11-2022';
  //     var TS_Updated = "12-11-2022";
  //     var   PickupLocation = "Noida";
  //     var   DeliveryLocation = "Agra";
  //     var  PackagePicture = 'Not Uploaded';
  //     var   ReceivedBy = 'Anjali';
  //     var PackageTemperature="27 degree celcius";
  //     var DurationOfFlight="30 mins";
  //     var Remarks="Good to serve ";
  //     var ApproverName="Anil";
  //     var ApproverId="Anil-01236";
  //     var PilotId="Mohit-00012";
  //     var MissionId="AKZM-45"
      
  //   var ApproveLink="https://docs.aws.amazon.com/ses/latest/dg/send-email-formatted.html"    

  //     var   TemplateData = "{ \"FlightId\":\""+FlightId+"\", \"PackageCondition\":\""+PackageCondition+"\", \"OrderId\":\""+OrderId+"\",\"SkyTunnelId\":\""+SkyTunnelId+"\", \"StartTime\":\""+StartTime+"\",\"NumOfPackages\":\""+NumOfPackages+"\",\"PackageType\":\""+PackageType+"\",\"PackageWeight\":\""+PackageWeight+"\",\"PackageCategory\":\""+PackageCategory+"\",\"VolumetricWeight\":\""+VolumetricWeight+"\",\"PickupTime\":\""+PickupTime+"\",\"ColdChain\":\""+ColdChain+"\",\"DroneId\":\""+DroneId+"\",\"DroneName\":\""+DroneName+"\",\"ClientId\":\""+ClientId+"\",\"OrganizationId\":\""+OrganizationId+"\",\"CreatedByName\":\""+CreatedByName+"\",\"Status\":\""+Status+"\",\"TS_Created\":\""+TS_Created+"\",\"TS_Updated\":\""+TS_Updated+"\",\"PickupLocation\":\""+PickupLocation+"\",\"DeliveryLocation\":\""+DeliveryLocation+"\",\"PackagePicture\":\""+PackagePicture+"\",\"ReceivedBy\":\""+ReceivedBy+"\",\"PackageTemperature\":\""+PackageTemperature+"\",\"DurationOfFlight\":\""+DurationOfFlight+"\",\"Remarks\":\""+Remarks+"\",\"ApproverName\":\""+ApproverName+"\",\"ApproverId\":\""+ApproverId+"\",\"PilotId\":\""+PilotId+"\",\"MissionId\":\""+MissionId+"\",\"ApproveLink\":\""+ApproveLink+"\" ,\"EndTime\":\""+EndTime+"\" }";
  //       var params = {
  //           "Source": "akumar@skyeair.tech", 
  //           "Template": "Admin_Notify_For_Flight_Plan_EmailTemplate_v4",
  //           "Destination": {
  //               "ToAddresses": ["rahulkumar@skyeair.tech"],
  //               "CcAddresses": [],
  //               "BccAddresses": []
  //           },            
  //           "TemplateData": TemplateData
  //       };
  //       let data =await ses.sendTemplatedEmail(params).promise()
  //   if(!data){ return ({"statusCode":400,"error":"internal server error","message":"template email not send  succesfully"})}
  //   if(data){ return ({"statusCode":200,"message":"template email send succesfully","data":data})}
  // *************************************************************************************************************
//      var params = {
//               "TemplateName": "Admin_Notify_For_Flight_Plan_EmailTemplate_v4"
//             }
//   let data=await ses.deleteTemplate(params).promise()
//           if(!data){ return ({"statusCode":400,"error":"internal server error","message":"template email Not delete   succesfully"})}
//       if(data){ return ({"statusCode":200,"message":"template email delete succesfully","data":data})}
// ******************************************************************************************************************
    }
    catch(err){
        return ({"statusCode":500,"error":"internal server error","message":err.message})
    }
};
