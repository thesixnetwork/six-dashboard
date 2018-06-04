function submitRedeem() {
  $("#redeemContent").slideToggle()
  $("#redeemContentOTP").slideToggle()
}

function submitPhoneNumberCode() {
  $("#redeemContentSetPassword").slideToggle()
  $("#redeemContentOTP").slideToggle()
}

$(document).ready(function () {
  $('#submit').click(function(e) {
    e.preventDefault();
    submitRedeem()
  })
  $('#verifyPhoneSubmitBtn').click(function(e) {
    e.preventDefault();
    submitPhoneNumberCode()
  })
})
