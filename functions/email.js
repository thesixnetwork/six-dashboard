'use strict'

const functions = require('firebase-functions')
const nodemailer = require('nodemailer')

const mailTransport = nodemailer.createTransport({
  host: functions.config().email.host,
  port: functions.config().email.port,
  secure: true, // true for 465, false for other ports
  auth: {
    user: functions.config().email.user, // generated ethereal user
    pass: functions.config().email.password // generated ethereal password
  }
})

exports.sendEmailApproved = functions.https.onCall((data, context) => {
  const email = context.auth.token.email || null
  const mailOptions = {
    from: '"Six network ICO." <noreply@firebase.com>',
    to: email
  }
  mailOptions.subject = 'KYC approve already'
  mailOptions.html = `
      <div class="m_266130162599889299content" style="box-sizing:border-box;display:block;max-width:600px;margin:0 auto;padding:10px">
      <span class="m_266130162599889299preheader" style="color:transparent;display:none;height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;width:0">Let's confirm your email address.</span>
      <div class="m_266130162599889299header" style="box-sizing:border-box;width:100%;margin-bottom:30px;margin-top:15px">
        <table style="box-sizing:border-box;width:100%;border-spacing:0;border-collapse:separate!important" width="100%">
          <tbody>
            <tr>
              <td align="left" class="m_266130162599889299align-left" style="box-sizing:border-box;padding:0;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;vertical-align:top;text-align:left"
                valign="top">
                <span class="m_266130162599889299sg-image">
                  <a href="https://sendgrid.com?utm_campaign=website&amp;utm_source=sendgrid.com&amp;utm_medium=email" style="box-sizing:border-box;color:#348eda;font-weight:400;text-decoration:none"
                    target="_blank" data-saferedirecturl="https://www.google.com/url?hl=th&amp;q=https://sendgrid.com?utm_campaign%3Dwebsite%26utm_source%3Dsendgrid.com%26utm_medium%3Demail&amp;source=gmail&amp;ust=1521566053847000&amp;usg=AFQjCNGNNr5H1-nTXr1Jof7zMWaeru32Vg">
                    <img alt="SendGrid" height="22" src="https://ci4.googleusercontent.com/proxy/ohw6ImtT4dL1giZ-HLqqQzqeqi42q9eo5pvU0vcq-XZQnfOltGuhW0ryqt0VF3pGFdyP7-FZBdn0zMVf2tsZXii24RNau7fHxoL1RimSpzyUjg=s0-d-e1-ft#https://uiux.s3.amazonaws.com/2016-logos/email-logo%402x.png"
                      style="max-width:100%;border-style:none;width:123px;height:22px" width="123" class="CToWUd">
                  </a>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="m_266130162599889299block" style="box-sizing:border-box;width:100%;margin-bottom:30px;background:#ffffff;border:1px solid #f0f0f0">
        <table style="box-sizing:border-box;width:100%;border-spacing:0;border-collapse:separate!important" width="100%">
          <tbody>
            <tr>
              <td class="m_266130162599889299wrapper" style="box-sizing:border-box;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;vertical-align:top;padding:30px"
                valign="top">
                <table style="box-sizing:border-box;width:100%;border-spacing:0;border-collapse:separate!important" width="100%">
                  <tbody>
                    <tr>
                      <td style="box-sizing:border-box;padding:0;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;vertical-align:top"
                        valign="top">
                        <h2 style="margin:0;margin-bottom:30px;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-weight:300;line-height:1.5;font-size:24px;color:#294661!important">You're on your way!
                          <br> Let's confirm your email address.</h2>
                        <p style="margin:0;margin-bottom:30px;color:#294661;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;font-weight:300">By clicking on the following link, you are confirming your email address.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="box-sizing:border-box;padding:0;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;vertical-align:top"
                        valign="top">
                        <table cellpadding="0" cellspacing="0" class="m_266130162599889299btn m_266130162599889299btn-primary" style="box-sizing:border-box;border-spacing:0;width:100%;border-collapse:separate!important"
                          width="100%">
                          <tbody>
                            <tr>
                              <td align="center" style="box-sizing:border-box;padding:0;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;vertical-align:top;padding-bottom:15px"
                                valign="top">
                                <table cellpadding="0" cellspacing="0" style="box-sizing:border-box;border-spacing:0;width:auto;border-collapse:separate!important">
                                  <tbody>
                                    <tr>
                                      <td align="center" bgcolor="#FFF" style="box-sizing:border-box;padding:10px;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;vertical-align:top;background-color:#FFF;border-radius:2px;text-align:center"
                                        valign="top">
                                      </td>
                                    </tr>

                                  </tbody>

                                </table>

                              </td>

                            </tr>

                          </tbody>

                        </table>

                      </td>

                    </tr>

                  </tbody>

                </table>

              </td>

            </tr>

          </tbody>

        </table>

      </div>
      <div class="m_266130162599889299footer" style="box-sizing:border-box;clear:both;width:100%">

        <table style="box-sizing:border-box;width:100%;border-spacing:0;font-size:12px;border-collapse:separate!important" width="100%">

          <tbody>

            <tr style="font-size:12px">

              <td align="center" class="m_266130162599889299align-center" style="box-sizing:border-box;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;vertical-align:top;font-size:12px;text-align:center;padding:20px 0"
                valign="top">
                <span class="m_266130162599889299sg-image" style="float:none;display:block;text-align:center">
                  <a href="https://sendgrid.com?utm_campaign=website&amp;utm_source=sendgrid.com&amp;utm_medium=email" style="box-sizing:border-box;color:#348eda;font-weight:400;text-decoration:none;font-size:12px"
                    target="_blank" data-saferedirecturl="https://www.google.com/url?hl=th&amp;q=https://sendgrid.com?utm_campaign%3Dwebsite%26utm_source%3Dsendgrid.com%26utm_medium%3Demail&amp;source=gmail&amp;ust=1521566053847000&amp;usg=AFQjCNGNNr5H1-nTXr1Jof7zMWaeru32Vg">
                    <img alt="SendGrid" height="16" src="https://ci4.googleusercontent.com/proxy/ohw6ImtT4dL1giZ-HLqqQzqeqi42q9eo5pvU0vcq-XZQnfOltGuhW0ryqt0VF3pGFdyP7-FZBdn0zMVf2tsZXii24RNau7fHxoL1RimSpzyUjg=s0-d-e1-ft#https://uiux.s3.amazonaws.com/2016-logos/email-logo%402x.png"
                      style="max-width:100%;border-style:none;font-size:12px;width:89px;height:16px" width="89" class="CToWUd">
                  </a>
                </span>
                <p class="m_266130162599889299tagline" style="color:#294661;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;margin-bottom:5px;margin:10px 0 20px">Send with Confidence</p>
                <p style="margin:0;color:#294661;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-weight:300;font-size:12px;margin-bottom:5px">© SendGrid Inc.
                  <a href="https://maps.google.com/?q=1801+California+Street,+Suite+500,+Denver,+CO+80202+USA&amp;entry=gmail&amp;source=g">1801 California Street, Suite 500, Denver, CO 80202 USA</a>
                </p>
                <p style="margin:0;color:#294661;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-weight:300;font-size:12px;margin-bottom:5px">
                  <a href="https://sendgrid.com/blog?utm_campaign=website&amp;utm_source=sendgrid.com&amp;utm_medium=email" style="box-sizing:border-box;color:#348eda;font-weight:400;text-decoration:none;font-size:12px;padding:0 5px"
                    target="_blank" data-saferedirecturl="https://www.google.com/url?hl=th&amp;q=https://sendgrid.com/blog?utm_campaign%3Dwebsite%26utm_source%3Dsendgrid.com%26utm_medium%3Demail&amp;source=gmail&amp;ust=1521566053848000&amp;usg=AFQjCNGndecuj5EZq4FVSMYyTWRKMurFFw">Blog</a>
                  <a href="https://github.com/sendgrid?utm_campaign=website&amp;utm_source=sendgrid.com&amp;utm_medium=email"
                    style="box-sizing:border-box;color:#348eda;font-weight:400;text-decoration:none;font-size:12px;padding:0 5px"
                    target="_blank" data-saferedirecturl="https://www.google.com/url?hl=th&amp;q=https://github.com/sendgrid?utm_campaign%3Dwebsite%26utm_source%3Dsendgrid.com%26utm_medium%3Demail&amp;source=gmail&amp;ust=1521566053848000&amp;usg=AFQjCNHaQvKPhQEh5LIznRSSCEFwGiSFbA">GitHub</a>
                  <a href="https://twitter.com/sendgrid?utm_campaign=website&amp;utm_source=sendgrid.com&amp;utm_medium=email"
                    style="box-sizing:border-box;color:#348eda;font-weight:400;text-decoration:none;font-size:12px;padding:0 5px"
                    target="_blank" data-saferedirecturl="https://www.google.com/url?hl=th&amp;q=https://twitter.com/sendgrid?utm_campaign%3Dwebsite%26utm_source%3Dsendgrid.com%26utm_medium%3Demail&amp;source=gmail&amp;ust=1521566053848000&amp;usg=AFQjCNGAq13_8gYXV28V0AINdAdpicx9VQ">Twitter</a>
                  <a href="https://www.facebook.com/SendGrid?utm_campaign=website&amp;utm_source=sendgrid.com&amp;utm_medium=email"
                    style="box-sizing:border-box;color:#348eda;font-weight:400;text-decoration:none;font-size:12px;padding:0 5px"
                    target="_blank" data-saferedirecturl="https://www.google.com/url?hl=th&amp;q=https://www.facebook.com/SendGrid?utm_campaign%3Dwebsite%26utm_source%3Dsendgrid.com%26utm_medium%3Demail&amp;source=gmail&amp;ust=1521566053848000&amp;usg=AFQjCNEpYYZccY6gGQ_0OWcZS8l-MxGbcg">Facebook</a>
                  <a href="https://www.linkedin.com/company/sendgrid?utm_campaign=website&amp;utm_source=sendgrid.com&amp;utm_medium=email"
                    style="box-sizing:border-box;color:#348eda;font-weight:400;text-decoration:none;font-size:12px;padding:0 5px"
                    target="_blank" data-saferedirecturl="https://www.google.com/url?hl=th&amp;q=https://www.linkedin.com/company/sendgrid?utm_campaign%3Dwebsite%26utm_source%3Dsendgrid.com%26utm_medium%3Demail&amp;source=gmail&amp;ust=1521566053848000&amp;usg=AFQjCNEigiVVjfYYSWt-4A0hdLl9I0HVeQ">LinkedIn</a>
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`
  return mailTransport.sendMail(mailOptions)
})

exports.sendEmailReject = functions.https.onCall((data, context) => {
  const email = context.auth.token.email || null
  const mailOptions = {
    from: '"Six network ICO." <noreply@firebase.com>',
    to: email
  }
  mailOptions.subject = 'KYC reject account'
  mailOptions.html = `
      <div class="m_266130162599889299content" style="box-sizing:border-box;display:block;max-width:600px;margin:0 auto;padding:10px">
      <span class="m_266130162599889299preheader" style="color:transparent;display:none;height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;width:0">Let's confirm your email address.</span>
      <div class="m_266130162599889299header" style="box-sizing:border-box;width:100%;margin-bottom:30px;margin-top:15px">
        <table style="box-sizing:border-box;width:100%;border-spacing:0;border-collapse:separate!important" width="100%">
          <tbody>
            <tr>
              <td align="left" class="m_266130162599889299align-left" style="box-sizing:border-box;padding:0;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;vertical-align:top;text-align:left"
                valign="top">
                <span class="m_266130162599889299sg-image">
                  <a href="https://sendgrid.com?utm_campaign=website&amp;utm_source=sendgrid.com&amp;utm_medium=email" style="box-sizing:border-box;color:#348eda;font-weight:400;text-decoration:none"
                    target="_blank" data-saferedirecturl="https://www.google.com/url?hl=th&amp;q=https://sendgrid.com?utm_campaign%3Dwebsite%26utm_source%3Dsendgrid.com%26utm_medium%3Demail&amp;source=gmail&amp;ust=1521566053847000&amp;usg=AFQjCNGNNr5H1-nTXr1Jof7zMWaeru32Vg">
                    <img alt="SendGrid" height="22" src="https://ci4.googleusercontent.com/proxy/ohw6ImtT4dL1giZ-HLqqQzqeqi42q9eo5pvU0vcq-XZQnfOltGuhW0ryqt0VF3pGFdyP7-FZBdn0zMVf2tsZXii24RNau7fHxoL1RimSpzyUjg=s0-d-e1-ft#https://uiux.s3.amazonaws.com/2016-logos/email-logo%402x.png"
                      style="max-width:100%;border-style:none;width:123px;height:22px" width="123" class="CToWUd">
                  </a>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="m_266130162599889299block" style="box-sizing:border-box;width:100%;margin-bottom:30px;background:#ffffff;border:1px solid #f0f0f0">
        <table style="box-sizing:border-box;width:100%;border-spacing:0;border-collapse:separate!important" width="100%">
          <tbody>
            <tr>
              <td class="m_266130162599889299wrapper" style="box-sizing:border-box;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;vertical-align:top;padding:30px"
                valign="top">
                <table style="box-sizing:border-box;width:100%;border-spacing:0;border-collapse:separate!important" width="100%">
                  <tbody>
                    <tr>
                      <td style="box-sizing:border-box;padding:0;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;vertical-align:top"
                        valign="top">
                        <h2 style="margin:0;margin-bottom:30px;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-weight:300;line-height:1.5;font-size:24px;color:#294661!important">You're on your way!
                          <br> Let's confirm your email address.</h2>
                        <p style="margin:0;margin-bottom:30px;color:#294661;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;font-weight:300">By clicking on the following link, you are confirming your email address.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="box-sizing:border-box;padding:0;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;vertical-align:top"
                        valign="top">
                        <table cellpadding="0" cellspacing="0" class="m_266130162599889299btn m_266130162599889299btn-primary" style="box-sizing:border-box;border-spacing:0;width:100%;border-collapse:separate!important"
                          width="100%">
                          <tbody>
                            <tr>
                              <td align="center" style="box-sizing:border-box;padding:0;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;vertical-align:top;padding-bottom:15px"
                                valign="top">
                                <table cellpadding="0" cellspacing="0" style="box-sizing:border-box;border-spacing:0;width:auto;border-collapse:separate!important">
                                  <tbody>
                                    <tr>
                                      <td align="center" bgcolor="#FFF" style="box-sizing:border-box;padding:10px;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:16px;vertical-align:top;background-color:#FFF;border-radius:2px;text-align:center"
                                        valign="top">
                                      </td>
                                    </tr>

                                  </tbody>

                                </table>

                              </td>

                            </tr>

                          </tbody>

                        </table>

                      </td>

                    </tr>

                  </tbody>

                </table>

              </td>

            </tr>

          </tbody>

        </table>

      </div>
      <div class="m_266130162599889299footer" style="box-sizing:border-box;clear:both;width:100%">

        <table style="box-sizing:border-box;width:100%;border-spacing:0;font-size:12px;border-collapse:separate!important" width="100%">

          <tbody>

            <tr style="font-size:12px">

              <td align="center" class="m_266130162599889299align-center" style="box-sizing:border-box;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;vertical-align:top;font-size:12px;text-align:center;padding:20px 0"
                valign="top">
                <span class="m_266130162599889299sg-image" style="float:none;display:block;text-align:center">
                  <a href="https://sendgrid.com?utm_campaign=website&amp;utm_source=sendgrid.com&amp;utm_medium=email" style="box-sizing:border-box;color:#348eda;font-weight:400;text-decoration:none;font-size:12px"
                    target="_blank" data-saferedirecturl="https://www.google.com/url?hl=th&amp;q=https://sendgrid.com?utm_campaign%3Dwebsite%26utm_source%3Dsendgrid.com%26utm_medium%3Demail&amp;source=gmail&amp;ust=1521566053847000&amp;usg=AFQjCNGNNr5H1-nTXr1Jof7zMWaeru32Vg">
                    <img alt="SendGrid" height="16" src="https://ci4.googleusercontent.com/proxy/ohw6ImtT4dL1giZ-HLqqQzqeqi42q9eo5pvU0vcq-XZQnfOltGuhW0ryqt0VF3pGFdyP7-FZBdn0zMVf2tsZXii24RNau7fHxoL1RimSpzyUjg=s0-d-e1-ft#https://uiux.s3.amazonaws.com/2016-logos/email-logo%402x.png"
                      style="max-width:100%;border-style:none;font-size:12px;width:89px;height:16px" width="89" class="CToWUd">
                  </a>
                </span>
                <p class="m_266130162599889299tagline" style="color:#294661;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;margin-bottom:5px;margin:10px 0 20px">Send with Confidence</p>
                <p style="margin:0;color:#294661;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-weight:300;font-size:12px;margin-bottom:5px">© SendGrid Inc.
                  <a href="https://maps.google.com/?q=1801+California+Street,+Suite+500,+Denver,+CO+80202+USA&amp;entry=gmail&amp;source=g">1801 California Street, Suite 500, Denver, CO 80202 USA</a>
                </p>
                <p style="margin:0;color:#294661;font-family:'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif;font-weight:300;font-size:12px;margin-bottom:5px">
                  <a href="https://sendgrid.com/blog?utm_campaign=website&amp;utm_source=sendgrid.com&amp;utm_medium=email" style="box-sizing:border-box;color:#348eda;font-weight:400;text-decoration:none;font-size:12px;padding:0 5px"
                    target="_blank" data-saferedirecturl="https://www.google.com/url?hl=th&amp;q=https://sendgrid.com/blog?utm_campaign%3Dwebsite%26utm_source%3Dsendgrid.com%26utm_medium%3Demail&amp;source=gmail&amp;ust=1521566053848000&amp;usg=AFQjCNGndecuj5EZq4FVSMYyTWRKMurFFw">Blog</a>
                  <a href="https://github.com/sendgrid?utm_campaign=website&amp;utm_source=sendgrid.com&amp;utm_medium=email"
                    style="box-sizing:border-box;color:#348eda;font-weight:400;text-decoration:none;font-size:12px;padding:0 5px"
                    target="_blank" data-saferedirecturl="https://www.google.com/url?hl=th&amp;q=https://github.com/sendgrid?utm_campaign%3Dwebsite%26utm_source%3Dsendgrid.com%26utm_medium%3Demail&amp;source=gmail&amp;ust=1521566053848000&amp;usg=AFQjCNHaQvKPhQEh5LIznRSSCEFwGiSFbA">GitHub</a>
                  <a href="https://twitter.com/sendgrid?utm_campaign=website&amp;utm_source=sendgrid.com&amp;utm_medium=email"
                    style="box-sizing:border-box;color:#348eda;font-weight:400;text-decoration:none;font-size:12px;padding:0 5px"
                    target="_blank" data-saferedirecturl="https://www.google.com/url?hl=th&amp;q=https://twitter.com/sendgrid?utm_campaign%3Dwebsite%26utm_source%3Dsendgrid.com%26utm_medium%3Demail&amp;source=gmail&amp;ust=1521566053848000&amp;usg=AFQjCNGAq13_8gYXV28V0AINdAdpicx9VQ">Twitter</a>
                  <a href="https://www.facebook.com/SendGrid?utm_campaign=website&amp;utm_source=sendgrid.com&amp;utm_medium=email"
                    style="box-sizing:border-box;color:#348eda;font-weight:400;text-decoration:none;font-size:12px;padding:0 5px"
                    target="_blank" data-saferedirecturl="https://www.google.com/url?hl=th&amp;q=https://www.facebook.com/SendGrid?utm_campaign%3Dwebsite%26utm_source%3Dsendgrid.com%26utm_medium%3Demail&amp;source=gmail&amp;ust=1521566053848000&amp;usg=AFQjCNEpYYZccY6gGQ_0OWcZS8l-MxGbcg">Facebook</a>
                  <a href="https://www.linkedin.com/company/sendgrid?utm_campaign=website&amp;utm_source=sendgrid.com&amp;utm_medium=email"
                    style="box-sizing:border-box;color:#348eda;font-weight:400;text-decoration:none;font-size:12px;padding:0 5px"
                    target="_blank" data-saferedirecturl="https://www.google.com/url?hl=th&amp;q=https://www.linkedin.com/company/sendgrid?utm_campaign%3Dwebsite%26utm_source%3Dsendgrid.com%26utm_medium%3Demail&amp;source=gmail&amp;ust=1521566053848000&amp;usg=AFQjCNEigiVVjfYYSWt-4A0hdLl9I0HVeQ">LinkedIn</a>
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`
  return mailTransport.sendMail(mailOptions)
})
