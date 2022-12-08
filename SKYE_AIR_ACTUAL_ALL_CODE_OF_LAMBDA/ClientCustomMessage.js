
exports.handler = (event, context, callback) => {
	console.log(event.triggerSource);
	if(event.triggerSource == 'CustomMessage_ForgotPassword'){
		console.log('Agent forgot password flow triggerd');
		console.log(event.request.userAttributes.email);

	    event.response.emailSubject = 'Reset your password';
	    //event.response.emailMessage = 'Your agent code is =>'+event.request.codeParameter;
	    event.response.emailMessage = `<html><body> <td align="center" valign="top" id="m_-5269160379379659625bodyCell" style="height:100%;margin:0;padding:10px;width:100%;border-top:0"> <table border="0" cellpadding="0" cellspacing="0" width="100%" class="m_-5269160379379659625templateContainer" style="border-collapse:collapse;border:0;max-width:600px!important"> <tbody> <tr> <td valign="top" id="m_-5269160379379659625templatePreheader" style="background:#fafafa none no-repeat center/cover;background-color:#fafafa;background-image:none;background-repeat:no-repeat;background-position:center;background-size:cover;border-top:0;border-bottom:0;padding-top:9px;padding-bottom:9px"></td> </tr> <tr> <td valign="top" id="m_-5269160379379659625templateUpperBody" style="background:#ffffff none no-repeat center/cover;background-color:#ffffff;background-image:none;background-repeat:no-repeat;background-position:center;background-size:cover;border-top:0;border-bottom:0;padding-top:0;padding-bottom:0"> <table border="0" cellpadding="0" cellspacing="0" width="100%" class="m_-5269160379379659625mcnTextBlock" style="min-width:100%;border-collapse:collapse"> <tbody class="m_-5269160379379659625mcnTextBlockOuter"> <tr> <td valign="top" class="m_-5269160379379659625mcnTextBlockInner" style="padding-top:9px"> <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width:100%;min-width:100%;border-collapse:collapse" width="100%" class="m_-5269160379379659625mcnTextContentContainer"> <tbody> <tr> <td valign="top" class="m_-5269160379379659625mcnTextContent" style="padding-top:0;padding-right:18px;padding-bottom:9px;padding-left:18px;word-break:break-word;color:#202020;font-family:Helvetica;font-size:16px;line-height:150%;text-align:left"> <h1 style="display:block;margin:0;padding:0;color:#202020;font-family:Helvetica;font-size:26px;font-style:normal;font-weight:bold;line-height:125%;letter-spacing:normal;text-align:left"><span style="font-size:18px">Hello `+event.request.userAttributes["name"]+`,</span>&nbsp;</h1>&nbsp;<p style="margin:10px 0;padding:0;color:#202020;font-family:Helvetica;font-size:16px;line-height:150%;text-align:left">You verification code is `+ event.request.codeParameter +`</em><br><br>Thanks,<br>Skyeair Support&nbsp;<br><strong><span style="color:#3366cc"><a href="http://www.skyeair.tech/" target="_blank" data-saferedirecturl="https://www.google.com/url?q=http://maflife.com&amp;source=gmail&amp;ust=1551946092272000&amp;usg=AFQjCNGBO5idm4HRff8Sw650D6Ev0Ywk4w">skyeair.tech</a></span></strong> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td></body></html>`
	    callback(null, event);
	} else {
		console.log('Custom flow');
		callback(null, event);
	}
}
