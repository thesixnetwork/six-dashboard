// global user data
userData = {}

countries = {"AF":"Afghanistan","AX":"Åland Islands","AL":"Albania","DZ":"Algeria","AS":"American Samoa","AD":"AndorrA","AO":"Angola","AI":"Anguilla","AQ":"Antarctica","AG":"Antigua and Barbuda","AR":"Argentina","AM":"Armenia","AW":"Aruba","AU":"Australia","AT":"Austria","AZ":"Azerbaijan","BS":"Bahamas","BH":"Bahrain","BD":"Bangladesh","BB":"Barbados","BY":"Belarus","BE":"Belgium","BZ":"Belize","BJ":"Benin","BM":"Bermuda","BT":"Bhutan","BO":"Bolivia","BA":"Bosnia and Herzegovina","BW":"Botswana","BV":"Bouvet Island","BR":"Brazil","IO":"British Indian Ocean Territory","BN":"Brunei Darussalam","BG":"Bulgaria","BF":"Burkina Faso","BI":"Burundi","KH":"Cambodia","CM":"Cameroon","CA":"Canada","CV":"Cape Verde","KY":"Cayman Islands","CF":"Central African Republic","TD":"Chad","CL":"Chile","CN":"China","CX":"Christmas Island","CC":"Cocos (Keeling) Islands","CO":"Colombia","KM":"Comoros","CG":"Congo","CD":"Congo, The Democratic Republic of the","CK":"Cook Islands","CR":"Costa Rica","CI":"Cote D'Ivoire","HR":"Croatia","CU":"Cuba","CY":"Cyprus","CZ":"Czech Republic","DK":"Denmark","DJ":"Djibouti","DM":"Dominica","DO":"Dominican Republic","EC":"Ecuador","EG":"Egypt","SV":"El Salvador","GQ":"Equatorial Guinea","ER":"Eritrea","EE":"Estonia","ET":"Ethiopia","FK":"Falkland Islands (Malvinas)","FO":"Faroe Islands","FJ":"Fiji","FI":"Finland","FR":"France","GF":"French Guiana","PF":"French Polynesia","TF":"French Southern Territories","GA":"Gabon","GM":"Gambia","GE":"Georgia","DE":"Germany","GH":"Ghana","GI":"Gibraltar","GR":"Greece","GL":"Greenland","GD":"Grenada","GP":"Guadeloupe","GU":"Guam","GT":"Guatemala","GG":"Guernsey","GN":"Guinea","GW":"Guinea-Bissau","GY":"Guyana","HT":"Haiti","HM":"Heard Island and Mcdonald Islands","VA":"Holy See (Vatican City State)","HN":"Honduras","HK":"Hong Kong","HU":"Hungary","IS":"Iceland","IN":"India","ID":"Indonesia","IR":"Iran, Islamic Republic Of","IQ":"Iraq","IE":"Ireland","IM":"Isle of Man","IL":"Israel","IT":"Italy","JM":"Jamaica","JP":"Japan","JE":"Jersey","JO":"Jordan","KZ":"Kazakhstan","KE":"Kenya","KI":"Kiribati","KP":"Korea, Democratic People'S Republic of","KR":"Korea, Republic of","KW":"Kuwait","KG":"Kyrgyzstan","LA":"Lao People'S Democratic Republic","LV":"Latvia","LB":"Lebanon","LS":"Lesotho","LR":"Liberia","LY":"Libyan Arab Jamahiriya","LI":"Liechtenstein","LT":"Lithuania","LU":"Luxembourg","MO":"Macao","MK":"Macedonia, The Former Yugoslav Republic of","MG":"Madagascar","MW":"Malawi","MY":"Malaysia","MV":"Maldives","ML":"Mali","MT":"Malta","MH":"Marshall Islands","MQ":"Martinique","MR":"Mauritania","MU":"Mauritius","YT":"Mayotte","MX":"Mexico","FM":"Micronesia, Federated States of","MD":"Moldova, Republic of","MC":"Monaco","MN":"Mongolia","MS":"Montserrat","MA":"Morocco","MZ":"Mozambique","MM":"Myanmar","NA":"Namibia","NR":"Nauru","NP":"Nepal","NL":"Netherlands","AN":"Netherlands Antilles","NC":"New Caledonia","NZ":"New Zealand","NI":"Nicaragua","NE":"Niger","NG":"Nigeria","NU":"Niue","NF":"Norfolk Island","MP":"Northern Mariana Islands","NO":"Norway","OM":"Oman","PK":"Pakistan","PW":"Palau","PS":"Palestinian Territory, Occupied","PA":"Panama","PG":"Papua New Guinea","PY":"Paraguay","PE":"Peru","PH":"Philippines","PN":"Pitcairn","PL":"Poland","PT":"Portugal","PR":"Puerto Rico","QA":"Qatar","RE":"Reunion","RO":"Romania","RU":"Russian Federation","RW":"RWANDA","SH":"Saint Helena","KN":"Saint Kitts and Nevis","LC":"Saint Lucia","PM":"Saint Pierre and Miquelon","VC":"Saint Vincent and the Grenadines","WS":"Samoa","SM":"San Marino","ST":"Sao Tome and Principe","SA":"Saudi Arabia","SN":"Senegal","CS":"Serbia and Montenegro","SC":"Seychelles","SL":"Sierra Leone","SG":"Singapore","SK":"Slovakia","SI":"Slovenia","SB":"Solomon Islands","SO":"Somalia","ZA":"South Africa","GS":"South Georgia and the South Sandwich Islands","ES":"Spain","LK":"Sri Lanka","SD":"Sudan","SR":"Suriname","SJ":"Svalbard and Jan Mayen","SZ":"Swaziland","SE":"Sweden","CH":"Switzerland","SY":"Syrian Arab Republic","TW":"Taiwan, Province of China","TJ":"Tajikistan","TZ":"Tanzania, United Republic of","TH":"Thailand","TL":"Timor-Leste","TG":"Togo","TK":"Tokelau","TO":"Tonga","TT":"Trinidad and Tobago","TN":"Tunisia","TR":"Turkey","TM":"Turkmenistan","TC":"Turks and Caicos Islands","TV":"Tuvalu","UG":"Uganda","UA":"Ukraine","AE":"United Arab Emirates","GB":"United Kingdom","US":"United States","UM":"United States Minor Outlying Islands","UY":"Uruguay","UZ":"Uzbekistan","VU":"Vanuatu","VE":"Venezuela","VN":"Viet Nam","VG":"Virgin Islands, British","VI":"Virgin Islands, U.S.","WF":"Wallis and Futuna","EH":"Western Sahara","YE":"Yemen","ZM":"Zambia","ZW":"Zimbabwe"}

estimates = {"1-2": "1K USD - 2K USD", "2-5": "2K USD - 5K USD", "5-15": "5K USD - 15K USD", "15-100": "15K USD - 100K USD", "100+": "100K USD - More" }

rejectNote = {
  "need_more": `We appreciate that you took the time for the registration. However, we received insufficient information regarding your KYC/ AML documents and/ or information. 

We would highly appreciate if you could resubmit the documents and/ or information through the link below.`,
  "restricted": `We highly appreciate that you took the time for the registration. After reviewing your submitted application materials, the KYC/AML result does not match with our requirements.

We highly appreciate that you are interested in our ICO. Please do support us in the secondary market soon.

Thank you for your interest in SIX.network and our ICO.

SIX.network`,
  "photo_corrupted": `We appreciate that you took the time for the registration. However, we received incorrect or unclear information regarding your selfie picture.

We would highly appreciate if you could resubmit your selfie through the link below.`,
  "other": `We appreciate that you took the time for the registration. However, we received insufficient information regarding your KYC/ AML documents and/ or information.

We would highly appreciate if you could resubmit the documents and/ or information through the link below.`
}

currentFocus = ""
// Logout function to sign user out
function logOut () {
  firebase.auth().signOut()
}

// Initialize admin to check if user is admin
function initializeAdmin () {
  let promise = new Promise(function (resolve, reject) {
    let db = firebase.firestore()
    db.collection('admins').get()
      .then(() => {
        resolve()
      })
      .catch(() => {
        reject()
      })
  })
  return promise
}

// Crea element
function createElementFromHTML (htmlString) {
  var div = document.createElement('div')
  div.innerHTML = htmlString.trim()
  return div
}

// Build kyc user list element
function buildListUser (doc) {
  var date = new Date((doc.data().kyc_submit_time+(3600*7))*1000);
  var hours = date.getHours();
  var minutes = "0" + date.getMinutes();
  var seconds = "0" + date.getSeconds();
  var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
  var formatted_date = date.toISOString().substr(0,10)
  var tr = document.createElement("tr")
  var td1 = document.createElement("td")
  var txt1 = document.createTextNode(doc.data().first_name+" "+doc.data().last_name)
  td1.appendChild(txt1)
  var td2 = document.createElement("td")
  var txt2 = document.createTextNode(formatted_date)
  td2.appendChild(txt2)
  var td3 = document.createElement("td")
  var txt3 = document.createTextNode(formattedTime+ " +07:00")
  td3.appendChild(txt3)
  tr.appendChild(td1)
  tr.appendChild(td2)
  tr.appendChild(td3)
  tr.onclick = function() { openUser(doc.id) }
  tr.id = doc.id
  return tr
}

// Open user detail
function openUser (uid) {
  $('#adminListMain').css('display', 'none')
  $('#detailFirstName').html(userData[uid].first_name)
  $('#detailLastName').html(userData[uid].last_name)
  $('#detailEmail').html(userData[uid].email)
  $('#detailPhoneNumber').html(userData[uid].phone_number)
  $('#detailCountry').html(countries[userData[uid].country])
  if (userData[uid].country === "TH") {
    $("#citizenIdContainer").css('display', 'block')
    $("#citizenIdPhotoContainer").css('display', 'block')
    $("#detailCitizenId").html(userData[uid].citizen_id)
  } else {
    $("#citizenIdContainer").css('display', 'none')
    $("#citizenIdPhotoContainer").css('display', 'none')
  }
  $("#detailPassportNumber").html(userData[uid].passport_number)
  $('#detailAddress').html(userData[uid].address)
  $('#detailPic1').attr("src", userData[uid].pic1)
  $('#detailPic2').attr("src", userData[uid].pic2)
  $('#detailPic3').attr("src", userData[uid].pic3)
  $('#detailPic4').attr("src", userData[uid].pic4)
  $('#detailEstimate').html(userData[uid].estimate+" ETH")
  $('#adminDetail').css('display', 'block')
  currentFocus = uid
}

// go Back from detail
function goBack () {
  $('#adminListMain').css('display', 'block')
  $('#adminDetail').css('display', 'none')
  $('#detailPic1').attr("src", '')
  $('#detailPic2').attr("src", '')
  $('#detailPic3').attr("src", '')
  currentFocus = ""
}

function lockAll() {
  let btn = document.getElementById('approveBtn')
  let btn2 = document.getElementById('rejectBtn')
  let rejecttype = document.getElementById('rejectSelect')
  let rejectnote = document.getElementById('rejectNote')
  btn.disabled = true
  btn2.disabled = true
  rejecttype.disabled = true
  rejectnote.disabled = true
}

function unlockAll() {
  let btn = document.getElementById('approveBtn')
  let btn2 = document.getElementById('rejectBtn')
  let rejecttype = document.getElementById('rejectSelect')
  let rejectnote = document.getElementById('rejectNote')
  btn.disabled = false
  btn2.disabled = false
  rejecttype.disabled = false
  rejectnote.disabled = false
}

function approve() {
  let thisFocus = currentFocus
  lockAll()
  let db = firebase.firestore()
  db.collection('users').doc(thisFocus).update({ kyc_status: 'approved' }).then(() => {
    goBack()
    $('#'+thisFocus).remove()
    unlockAll()
  }).catch(err => {
    alert(err.message)
    unlockAll()
  })
}

function reject() {
  let thisFocus = currentFocus
  lockAll()
  let db = firebase.firestore()
  let rejecttype = document.getElementById('rejectSelect').value
  let rejectnote = document.getElementById('rejectNote').value
  let updateData = {
    kyc_status: 'rejected', reject_type: rejecttype
  }
  updateData.reject_note = rejectNote[rejecttype]
  if (rejectnote !== undefined) {
    updateData.reject_note_extend = rejectnote
  }
  if (rejecttype == "restricted") {
    updateData.is_restricted = true
  }
  db.collection('users').doc(thisFocus).update(updateData).then(() => {
    goBack()
    $('#'+thisFocus).remove()
    unlockAll()
  }).catch(err => {
    alert(err.message)
    unlockAll()
  })
}

// Initialize database to query data and draw to view
function initializeDatabase () {
  let promise = new Promise(function (resolve, reject) {
    let db = firebase.firestore()
    let userRef = db.collection('users')
    let query = userRef.where('kyc_status', '==', 'pending')
    query.get()
      .then(docs => {
        docs.forEach(function (doc) {
          userData[doc.id] = doc.data()
          let elem = buildListUser(doc)
          $('#adminList')[0].appendChild(elem)
        })
        resolve()
      })
      .catch(err => {
        console.log(err)
        reject(err)
      })
  })
  return promise
}

$(document).ready(function () {
  // Search list
  $('body').on('click', '.search i.fa-search', function () {
    $(this).parents('.search').addClass('show-search')
  })

  $('body').on('click', '.search i.fa-times', function () {
    $(this).parents('.search').removeClass('show-search')
  })

  // Listening to auth state change
  firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
      console.log('Go to login')
      window.location.href = '/'
    } else {
      initializeAdmin().then(() => {
        $('#adminShortcut').css('display', 'block')
      }).catch(() => {
        window.location.href = '/wizard'
      }).finally(() => {
        initializeDatabase().finally(() => {
          $('#preLoader').fadeToggle()
        })
      })
    }
  })
})
