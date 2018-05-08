// global user data
userData = {};

function compare(a,b) {
  if ((a.data().kyc_submit_time || 0) < (b.data().kyc_submit_time || 0))
    return -1;
  if ((a.data().kyc_submit_time || 0) > (b.data().kyc_submit_time || 0))
    return 1;
  return 0;
}

function compareReverse(a,b) {
  if ((a.data().kyc_submit_time || 0) > (b.data().kyc_submit_time || 0))
    return -1;
  if ((a.data().kyc_submit_time || 0) < (b.data().kyc_submit_time || 0))
    return 1;
  return 0;
}

function compareRegis(a,b) {
  if ((a.data().registration_time || 0) > (b.data().registration_time || 0))
    return -1;
  if ((a.data().registration_time || 0) < (b.data().registration_time || 0))
    return 1;
  return 0;
}


countries = {"AF":"Afghanistan","AX":"Åland Islands","AL":"Albania","DZ":"Algeria","AS":"American Samoa","AD":"AndorrA","AO":"Angola","AI":"Anguilla","AQ":"Antarctica","AG":"Antigua and Barbuda","AR":"Argentina","AM":"Armenia","AW":"Aruba","AU":"Australia","AT":"Austria","AZ":"Azerbaijan","BS":"Bahamas","BH":"Bahrain","BD":"Bangladesh","BB":"Barbados","BY":"Belarus","BE":"Belgium","BZ":"Belize","BJ":"Benin","BM":"Bermuda","BT":"Bhutan","BO":"Bolivia","BA":"Bosnia and Herzegovina","BW":"Botswana","BV":"Bouvet Island","BR":"Brazil","IO":"British Indian Ocean Territory","BN":"Brunei Darussalam","BG":"Bulgaria","BF":"Burkina Faso","BI":"Burundi","KH":"Cambodia","CM":"Cameroon","CA":"Canada","CV":"Cape Verde","KY":"Cayman Islands","CF":"Central African Republic","TD":"Chad","CL":"Chile","CN":"China","CX":"Christmas Island","CC":"Cocos (Keeling) Islands","CO":"Colombia","KM":"Comoros","CG":"Congo","CD":"Congo, The Democratic Republic of the","CK":"Cook Islands","CR":"Costa Rica","CI":"Cote D'Ivoire","HR":"Croatia","CU":"Cuba","CY":"Cyprus","CZ":"Czech Republic","DK":"Denmark","DJ":"Djibouti","DM":"Dominica","DO":"Dominican Republic","EC":"Ecuador","EG":"Egypt","SV":"El Salvador","GQ":"Equatorial Guinea","ER":"Eritrea","EE":"Estonia","ET":"Ethiopia","FK":"Falkland Islands (Malvinas)","FO":"Faroe Islands","FJ":"Fiji","FI":"Finland","FR":"France","GF":"French Guiana","PF":"French Polynesia","TF":"French Southern Territories","GA":"Gabon","GM":"Gambia","GE":"Georgia","DE":"Germany","GH":"Ghana","GI":"Gibraltar","GR":"Greece","GL":"Greenland","GD":"Grenada","GP":"Guadeloupe","GU":"Guam","GT":"Guatemala","GG":"Guernsey","GN":"Guinea","GW":"Guinea-Bissau","GY":"Guyana","HT":"Haiti","HM":"Heard Island and Mcdonald Islands","VA":"Holy See (Vatican City State)","HN":"Honduras","HK":"Hong Kong","HU":"Hungary","IS":"Iceland","IN":"India","ID":"Indonesia","IR":"Iran, Islamic Republic Of","IQ":"Iraq","IE":"Ireland","IM":"Isle of Man","IL":"Israel","IT":"Italy","JM":"Jamaica","JP":"Japan","JE":"Jersey","JO":"Jordan","KZ":"Kazakhstan","KE":"Kenya","KI":"Kiribati","KP":"Korea, Democratic People'S Republic of","KR":"Korea, Republic of","KW":"Kuwait","KG":"Kyrgyzstan","LA":"Lao People'S Democratic Republic","LV":"Latvia","LB":"Lebanon","LS":"Lesotho","LR":"Liberia","LY":"Libyan Arab Jamahiriya","LI":"Liechtenstein","LT":"Lithuania","LU":"Luxembourg","MO":"Macao","MK":"Macedonia, The Former Yugoslav Republic of","MG":"Madagascar","MW":"Malawi","MY":"Malaysia","MV":"Maldives","ML":"Mali","MT":"Malta","MH":"Marshall Islands","MQ":"Martinique","MR":"Mauritania","MU":"Mauritius","YT":"Mayotte","MX":"Mexico","FM":"Micronesia, Federated States of","MD":"Moldova, Republic of","MC":"Monaco","MN":"Mongolia","MS":"Montserrat","MA":"Morocco","MZ":"Mozambique","MM":"Myanmar","NA":"Namibia","NR":"Nauru","NP":"Nepal","NL":"Netherlands","AN":"Netherlands Antilles","NC":"New Caledonia","NZ":"New Zealand","NI":"Nicaragua","NE":"Niger","NG":"Nigeria","NU":"Niue","NF":"Norfolk Island","MP":"Northern Mariana Islands","NO":"Norway","OM":"Oman","PK":"Pakistan","PW":"Palau","PS":"Palestinian Territory, Occupied","PA":"Panama","PG":"Papua New Guinea","PY":"Paraguay","PE":"Peru","PH":"Philippines","PN":"Pitcairn","PL":"Poland","PT":"Portugal","PR":"Puerto Rico","QA":"Qatar","RE":"Reunion","RO":"Romania","RU":"Russian Federation","RW":"RWANDA","SH":"Saint Helena","KN":"Saint Kitts and Nevis","LC":"Saint Lucia","PM":"Saint Pierre and Miquelon","VC":"Saint Vincent and the Grenadines","WS":"Samoa","SM":"San Marino","ST":"Sao Tome and Principe","SA":"Saudi Arabia","SN":"Senegal","CS":"Serbia and Montenegro","SC":"Seychelles","SL":"Sierra Leone","SG":"Singapore","SK":"Slovakia","SI":"Slovenia","SB":"Solomon Islands","SO":"Somalia","ZA":"South Africa","GS":"South Georgia and the South Sandwich Islands","ES":"Spain","LK":"Sri Lanka","SD":"Sudan","SR":"Suriname","SJ":"Svalbard and Jan Mayen","SZ":"Swaziland","SE":"Sweden","CH":"Switzerland","SY":"Syrian Arab Republic","TW":"Taiwan, Province of China","TJ":"Tajikistan","TZ":"Tanzania, United Republic of","TH":"Thailand","TL":"Timor-Leste","TG":"Togo","TK":"Tokelau","TO":"Tonga","TT":"Trinidad and Tobago","TN":"Tunisia","TR":"Turkey","TM":"Turkmenistan","TC":"Turks and Caicos Islands","TV":"Tuvalu","UG":"Uganda","UA":"Ukraine","AE":"United Arab Emirates","GB":"United Kingdom","US":"United States","UM":"United States Minor Outlying Islands","UY":"Uruguay","UZ":"Uzbekistan","VU":"Vanuatu","VE":"Venezuela","VN":"Viet Nam","VG":"Virgin Islands, British","VI":"Virgin Islands, U.S.","WF":"Wallis and Futuna","EH":"Western Sahara","YE":"Yemen","ZM":"Zambia","ZW":"Zimbabwe"}

estimates = {
  "1-2": "1K USD - 2K USD",
  "2-5": "2K USD - 5K USD",
  "5-15": "5K USD - 15K USD",
  "15-100": "15K USD - 100K USD",
  "100+": "100K USD - More"
};

rejectNote = {
  "need_more": `We appreciate that you took the time for the registration. However, we received insufficient information regarding your KYC/ AML documents and/ or information.

We would highly appreciate if you could resubmit the documents and/ or information through the link below.

Thank you for your interest in our ICO.

SIX.network`,
  "restricted": `We highly appreciate that you took the time for the registration. After reviewing your submitted application materials, the KYC/AML result does not match with our requirements.

We highly appreciate that you are interested in our ICO. Please do support us in the secondary market soon.

Thank you for your interest in SIX.network and our ICO.

SIX.network`,
  incorrect: `We appreciate that you took the time for the registration. However, we received insufficient information regarding your KYC/ AML documents and/ or information.

We would highly appreciate if you could resubmit the documents and/ or information through the link below.

Thank you for your interest in our ICO.

SIX.network`,
  photo_corrupted: `We appreciate that you took the time for the registration. However, we received incorrect or unclear information regarding your selfie picture.

We would highly appreciate if you could resubmit your selfie through the link below.`,
  "other": `We appreciate that you took the time for the registration. However, we received insufficient information regarding your KYC/ AML documents and/ or information.

Thank you for your interest in our ICO. `
}
currentFocus = ""
var currentIp = ""
var currentStatus = 'all'
// Logout function to sign user out
function logOut() {
  firebase.auth().signOut();
}

// Initialize admin to check if user is admin
function initializeAdmin() {
  let promise = new Promise(function(resolve, reject) {
    let db = firebase.firestore();
    db
      .collection("admins")
      .get()
      .then(() => {
        resolve();
      })
      .catch(() => {
        reject();
      });
  });
  return promise;
}

// Crea element
function createElementFromHTML(htmlString) {
  var div = document.createElement("div");
  div.innerHTML = htmlString.trim();
  return div;
}

// Build kyc user list element
function buildOption(doc) {
  const option = document.createElement('OPTION')
  option.setAttribute('value', doc)
  option.setAttribute('label', doc)
  return option
}

function buildListUser(doc, status) {
  var date = ''
  if (doc.data().kyc_submit_time && doc.data().kyc_submit_time !== null) {
    date = new Date((doc.data().kyc_submit_time) * 1000);
  }
  var hours = date !== '' ? '0' + date.getHours() : '';
  var minutes =  date !== '' ? '0' + date.getMinutes() : '';
  var seconds =  date !== '' ? '0' + date.getSeconds() : '';
  var formattedTime = ''
  var formatted_date = ''
  if (date && date !== '') {
    formattedTime = hours.substr(-2) + ":" + minutes.substr(-2) + ":" + seconds.substr(-2);
    formatted_date = date.toISOString().substr(0, 10);
  }
  var tr = document.createElement("tr");
  var td1 = document.createElement("td");
  let name_text = doc.data().first_name + " " + doc.data().last_name
  if (doc.data().first_name === undefined || doc.data().last_name === undefined) {
    name_text = '-'
  }
  var txt1 = document.createTextNode(name_text)
  td1.appendChild(txt1);
  var td2 = document.createElement("td");
  var txt2 = document.createTextNode(formatted_date+' '+formattedTime);
  td2.appendChild(txt2);
  var td3 = document.createElement("td");
  let estimate = doc.data().estimate
  if (status == 'approved') {
    estimate = doc.data().total_six
  } else {
    if (doc.data().estimate_currency == "XLM") {
      estimate = estimate*2050
    }
  }
  let estimate_text = ""
  if (estimate === undefined) {
    estimate_text = "-"
  } else {
    if (status == 'approved') {
      estimate_text = estimate+" SIX"
    } else {
      estimate_text = estimate+" "+(doc.data().estimate_currency || "ETH")
    }
  }
  var txt3 = document.createTextNode(estimate_text);
  td3.appendChild(txt3);
  var td4 = document.createElement("td");
  var txt4 = document.createTextNode('-');
  td4.setAttribute("id", `remarkText_${doc.id}`)
  td4.appendChild(txt4);
  tr.appendChild(td1);
  tr.appendChild(td2);
  tr.appendChild(td3);
  if (currentStatus !== 'notComplete') {
    tr.appendChild(td4);
  }
  const { kyc_status, remind_status } = doc.data()
  if (currentStatus === 'notComplete' && kyc_status === 'not_complete' && remind_status !== undefined) {
    let td5 = document.createElement("td");
    let txt5 = document.createTextNode(remind_status);
    td5.appendChild(txt5)
    tr.appendChild(td5)
  }
  tr.onclick = function() {
    openUser(doc.id);
  };
  tr.id = doc.id;
  return tr
}

// Open user detail
function openUser(uid) {
  $("#adminListMain").css("display", "none");
  $("#detailFirstName").html(userData[uid].first_name || '-');
  $("#detailLastName").html(userData[uid].last_name || '-');
  $("#detailEmail").html(userData[uid].email || '-');
  $("#detailPhoneNumber").html(userData[uid].phone_number || '-');
  $("#detailCountry").html(countries[userData[uid].country] || '-');
  if (userData[uid].country === "TH") {
    $("#citizenIdContainer").css('display', 'block')
    $("#citizenIdPhotoContainer").css('display', 'block')
    $("#citizenIdPhotoBackContainer").css('display', 'block')
    $("#detailCitizenId").html(userData[uid].citizen_id || '-')
    $("#passportNumber").css("display", "none")
    $("#passportPhoto").css("display", "none")
  } else {
    $("#citizenIdContainer").css('display', 'none')
    $("#citizenIdPhotoContainer").css('display', 'none')
    $("#citizenIdPhotoBackContainer").css('display', 'none')
    $("#passportNumber").css("display", "block")
    $("#passportPhoto").css("display", "block")
    $("#detailPassportNumber").html(userData[uid].passport_number || '-')
  }
  $('#detailAddress').text(userData[uid].address || '-')
  $('#detailPic1').attr("src", userData[uid].pic1)
  $('#detailPic2').attr("src", userData[uid].pic2)
  $('#detailPic3').attr("src", userData[uid].pic3)
  $('#detailPic4').attr("src", userData[uid].pic4)
  $('#detailPic5').attr("src", userData[uid].pic5)
  let estimate = userData[uid].estimate
  if (userData[uid].estimate_currency == "XLM") {
    estimate = estimate*2050
  }
  let estimate_text = ""
  if (estimate === undefined) {
    estimate_text = "-"
  } else {
    estimate_text = estimate+" "+(userData[uid].estimate_currency || "ETH")
  }
  $('#detailEstimate').html(estimate_text)
  $('#adminDetail').css('display', 'block')
  if (userData[uid].kyc_status === 'pending') {
    $("#rejctBox").css("display", "block")
    $("#approveBox").css("display", "block")
  } else {
    $("#rejctBox").css("display", "none")
    $("#approveBox").css("display", "none")
  }
  currentFocus = uid;
  const user = firebase.auth().currentUser;
  fetch("https://freegeoip.net/json/")
    .then(res => res.json())
    .then(data => data.ip)
    .then(ip => {
      if (currentFocus === uid) {
        currentIp = ip;
        firebase
          .database()
          .ref(`watch-list/${uid}`)
          .set({
            time: Date.now(),
            ip,
            uid: user.uid,
            email: user.email
          });
      }
    });
}

// go Back from detail
function goBack() {
  $('#adminListMain').css('display', 'block')
  $('#adminDetail').css('display', 'none')
  $('#detailPic1').attr("src", '')
  $('#detailPic2').attr("src", '')
  $('#detailPic3').attr("src", '')
  $('#detailPic4').attr("src", '')
  $('#detailPic5').attr("src", '')
  $("#detailFirstName").html("-");
  $("#detailLastName").html("-");
  $("#detailEmail").html("-");
  $("#detailPhoneNumber").html("-");
  $("#detailCountry").html("-");
  $('#detailEstimate').html("-")
  $('#detailAddress').html("-")
  $('#detailCitizenId').html("-")
  $("#detailPassportNumber").html('-')
  removeWatching();
  currentFocus = "";
}

function lockAll() {
  let btn = document.getElementById("approveBtn");
  let btn2 = document.getElementById("rejectBtn");
  let rejecttype = document.getElementById("rejectSelect");
  let rejectnote = document.getElementById("rejectNote");
  btn.disabled = true;
  btn2.disabled = true;
  rejecttype.disabled = true;
  rejectnote.disabled = true;
}

function unlockAll() {
  let btn = document.getElementById("approveBtn");
  let btn2 = document.getElementById("rejectBtn");
  let rejecttype = document.getElementById("rejectSelect");
  let rejectnote = document.getElementById("rejectNote");
  btn.disabled = false;
  btn2.disabled = false;
  rejecttype.disabled = false;
  rejectnote.disabled = false;
}

function approve() {
  let thisFocus = currentFocus;
  const user = firebase.auth().currentUser
  lockAll();
  let db = firebase.firestore();
  db
    .collection("users")
    .doc(thisFocus)
    .update({
      kyc_status: "approved",
      updater: user.uid,
      updater_ip: currentIp,
      update_time: Date.now()
    })
    .then(() => {
      // $("#" + thisFocus).remove();
      // unlockAll();
      // return goBack();
      location.reload();
    })
    .catch(err => {
      alert(err.message);
      unlockAll();
      return
    });
}

function rejectUser() {
  let thisFocus = currentFocus;
  lockAll();
  let db = firebase.firestore();
  const user = firebase.auth().currentUser
  let rejecttype = document.getElementById("rejectSelect").value;
  let rejectnote = document.getElementById("rejectNote").value;
  let updateData = {
    kyc_status: 'rejected',
    reject_type: rejecttype,
    updater: user.uid,
    updater_ip: currentIp,
    update_time: Date.now()
  }
  updateData.reject_note = rejectNote[rejecttype]
  if (rejectnote !== undefined) {
    updateData.reject_note_extend = rejectnote
  }
  if (rejecttype == "restricted") {
    updateData.is_restricted = true
  }
  db
    .collection("users")
    .doc(thisFocus)
    .update(updateData)
    .then(() => {
      // $("#" + thisFocus).remove();
      // unlockAll();
      // return goBack();
      location.reload();
    })
    .catch(err => {
      alert(err.message);
      unlockAll();
      return
    });
}

function updateWatcherText (id) {
  firebase
  .database()
  .ref(`watch-list/${id}`)
  .on("value", snapshot => {
    const value = snapshot.val();
    if (value && value !== null) {
      const { uid, ip, email } = value;
      const user = firebase.auth().currentUser;
      $(`#${id} td:last`).text(`Watching by ${email}, ip: ${ip}`);
      if (uid !== user.uid && ip !== currentIp) {
        $("#hasWatchingText").text(`${uid} watching this user `);
      }
    } else {
      let db = firebase.firestore();
      let userRef = db.collection("users").doc(id)
      userRef.get()
        .then(data => data.data())
        .then(data => {
          const { kyc_status } = data
          if (kyc_status === 'pending') {
            $(`#${id} td:last`).text("Pending");
            $("#hasWatchingText").text(``);
          }
        })
    }
  });
}

function renderRegistrationTime(id, data) {
  const date_string = data.registration_time && data.registration_time !== null ? moment(new Date(parseInt(data.registration_time))).format('DD/MM/YYYY HH:mm:ss') : ''
  const dom = document.getElementById(`remarkText_${id}`)
  dom.textContent = date_string
}

function renderStatus (id, data) {
  const { updater } = data
  switch(data.kyc_status) {
    case 'approved':
      $(`#${id} td:last`).text(`Approved by ${updater ? updater : '-'}`);
      break
    case 'rejected':
      $(`#${id} td:last`).text(`Rejected by ${updater ? updater : '-'}`);
      break
    case 'pending':
      updateWatcherText(id)
      break
    default:
      $(`#${id} td:last`).text(`Not completed KYC`);
      break
  }
}

let unsubscribe = null
let filteredUsers = []
let current_startDate = null
let current_endDate = null
// Initialize database to query data and draw to view
function initializeDatabase(status, country, startDate, endDate) {
  let promise = new Promise(function(resolve, reject) {
    if (unsubscribe !== null) {
      unsubscribe()
    }
    $("#adminList").empty()
    let db = firebase.firestore();
    let userRef = db.collection("users");
    let query = userRef
    let date_filter_field = 'registration_time'
    let date_prefix = 1
    switch(status) {
      case 'all':
        date_filter_field = 'registration_time'
        break
      case 'approved':
        date_filter_field = 'kyc_submit_time'
        date_prefix = 1000
        break
      case 'rejected':
        date_filter_field = 'kyc_submit_time'
        date_prefix = 1000
        break
      case 'pending':
        date_filter_field = 'kyc_submit_time'
        date_prefix = 1000
        break
      case 'notComplete':
        date_filter_field = 'registration_time'
        break
      default:
        break
    }

    if (country && country !== 'ALL' && typeof country === 'string') {
        if (endDate && endDate !== null && startDate && startDate !== null) {
          query = userRef
            .where('country', '==', country)
            .where(date_filter_field, '<=', endDate.toDate().getTime() / date_prefix)
            .where(date_filter_field, '>=', startDate.toDate().getTime() / date_prefix)
        } else {
          query = userRef.where('country', '==', country)
        }
    } else {
      if (endDate && endDate !== null && startDate && startDate !== null) {
        query = userRef
        .where(date_filter_field, '<=', endDate.toDate().getTime() / date_prefix)
        .where(date_filter_field, '>=', startDate.toDate().getTime() / date_prefix)
      }
    }
    switch(status) {
      case 'approved':
        query = query.where("kyc_status", "==", "approved");
        break
      case 'rejected':
        query = query.where("kyc_status", "==", "rejected");
        break
      case 'pending':
        query = query.where("kyc_status", "==", "pending");
        break
      case 'notComplete':
        query = query.where("kyc_status", "==", "not_complete");
        break
      default:
        break
    }
    unsubscribe =  query
      .onSnapshot(docs => {
        filteredUsers = []
        $("#adminList").empty()
        let allDocs = []
        let countries = ['ALL']
        docs.forEach(function (doc) {
          allDocs.push(doc)
          // if (doc.data().country !== undefined) {
          //   countries.push(doc.data().country)
          // }
        })
        // countries = _.uniq(countries)
        // countries.forEach(function (country) {
        //   const elm = buildOption(country)
        //   $('#country')[0].appendChild(elm);
        // })
        if (status != 'pending' && status != 'all') {
          allDocs.sort(compareReverse)
        } else if (status == 'all') {
          allDocs.sort(compareRegis)
        } else {
          allDocs.sort(compare)
        }
        let total_contibrute = 0
        let total_user = 0
        let total_six = 0
        allDocs.forEach(function (doc, index) {
          const data = doc.data()
          filteredUsers.push(data)
          userData[doc.id] = data
          let elem = buildListUser(doc, status);
          const six = data.total_six ? parseFloat(data.total_six) : 0
          total_user = total_user + 1
          if (six != 0) {
            total_contibrute = total_contibrute + 1
          }
          total_six = total_six + six
          document.getElementById('total_contibrute').textContent = `${total_contibrute} / ${total_user}`
          document.getElementById('total_six').textContent = `${total_six} SIX`
          $("#adminList")[0].appendChild(elem);
          const { updater, kyc_status } = data
          switch(status) {
            case 'all':
              renderRegistrationTime(doc.id, data)
              break
            case 'approved':
              if (updater) {
                $(`#${doc.id} td:last`).text(`${updater}`);
              }
              break
            case 'rejected':
              $(`#${doc.id} td:last`).text(`${updater}`);
              break
            case 'pending':
              firebase
              .database()
              .ref(`watch-list/${doc.id}`)
              .on("value", snapshot => {
                const value = snapshot.val();
                if (value && value !== null) {
                  const { uid, ip, email } = value;
                  const user = firebase.auth().currentUser;
                  $(`#${doc.id} td:last`).text(`${email}, ip: ${ip}`);
                  if (uid !== user.uid && ip !== currentIp) {
                    $("#hasWatchingText").text(`${uid} watching this user `);
                  }
                } else {
                  $(`#${doc.id} td:last`).text("-");
                  $("#hasWatchingText").text(``);
                }
              });
              break
            case 'notComplete':
              $('#remarkColumn').text('')
              break
          }
        });
        resolve();
      })
  });
  return promise;
}

function removeWatching(uid) {
  firebase
    .database()
    .ref(`watch-list/${uid}`)
    .remove();
}

let currentCountry = 'ALL'

function filterCountry (country) {
  currentCountry = country
  initializeDatabase(currentStatus, country, current_startDate, current_endDate)
}

function handleFilter (type) {
  $(`#${currentStatus}`).removeClass('is-active')
  $(`#${type}`).addClass('is-active')
  currentStatus = type
  initializeDatabase(type, null)
  $('input[name="daterange"]').val('')
  switch(type) {
    case 'all':
      $('#remarkColumn').show()
      $('#remarkColumn').text('Registration Date')
      $('#kycColumn').text("KYC Submit Datetime")
      $('#contributeColumn').text("Estimate Contribute (ETH)")
      $('#remindStatus').hide()
      break
    case 'approved':
      $('#remarkColumn').show()
      $('#remarkColumn').text('Approved By')
      $('#kycColumn').text("KYC Submit Datetime")
      $('#contributeColumn').text("Contributed")
      $('#remindStatus').hide()
      break
    case 'rejected':
      $('#remarkColumn').show()
      $('#remarkColumn').text('Rejected By')
      $('#kycColumn').text("KYC Submit Datetime")
      $('#contributeColumn').text("Estimate Contribute (ETH)")
      $('#remindStatus').hide()
      break
    case 'pending':
      $('#remarkColumn').show()
      $('#remarkColumn').text('Watcher')
      $('#kycColumn').text("KYC Submit Datetime")
      $('#contributeColumn').text("Estimate Contribute (ETH)")
      $('#remindStatus').hide()
      break
    case 'notComplete':
      $('#remarkColumn').hide()
      $('#remindStatus').show()
      $('#kycColumn').text("KYC Submit Datetime")
      $('#remindStatus').text('REMIND STATUS')
      $('#contributeColumn').text("Estimate Contribute (ETH)")
      break
  }
}

function JSONToCSVConvertor(JSONData, ReportTitle, ShowLabel) {
  //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
  var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;

  var CSV = '';
  //Set Report title in first row or line

  CSV += ReportTitle + '\r\n\n';
gas = arrData
  let allKeys = []
  for (var i = 0; i < arrData.length; i++) {
    let keys = Object.keys(arrData[i])
    for (var j = 0; j < keys.length; j++) {
      if (allKeys.indexOf(keys[j]) == -1 && keys[j] != 'pic1' && keys[j] != 'pic2' && keys[j] != 'pic3' && keys[j] != 'pic4' && keys[j] != 'pic5' && keys[j] != 'reject_note' && keys[j] != 'reject_note_extend' && keys[j] != 'updater' && keys[j] != 'updater_ip' && keys[j] != 'update_time' && keys[j] != 'seen_congrat' && keys[j] != 'first_transaction' && keys[j] != 'alloc_time' && keys[j] != 'alloc_transaction' && keys[j] != 'alloc_transaction_amount' && keys[j] != 'alloc_transaction_six_amount' && keys[j] != 'alloc_transaction_type' && keys[j] != 'reject_type' && keys[j] != 'memo' && keys[j] != 'user_number') {
        allKeys.push(keys[j])
      }
    }
  }
  //This condition will generate the Label/Header
  if (ShowLabel) {
      var row = "";

      //This loop will extract the label from 1st index of on array
      for (var j = 0; j < allKeys.length; j++) {
          let index = allKeys[j]

          //Now convert each value to string and comma-seprated
          row += index + ',';
      }

      row = row.slice(0, -1);

      //append Label row with line break
      CSV += row + '\r\n';
  }

  //1st loop is to extract each row
  for (var i = 0; i < arrData.length; i++) {
      var row = "";

      //2nd loop will extract each column and convert it in string comma-seprated
      for (var j = 0; j < allKeys.length; j++) {
          let index = allKeys[j]
          if (index == 'registration_time') {
            let date = new Date(arrData[i][index] || 0)
            var hours = date !== '' ? '0' + date.getHours() : '';
            var minutes =  date !== '' ? '0' + date.getMinutes() : '';
            var seconds =  date !== '' ? '0' + date.getSeconds() : '';
            formattedTime = hours.substr(-2) + ":" + minutes.substr(-2) + ":" + seconds.substr(-2);
            formatted_date = date.toISOString().substr(0, 10)
            row += '"' + String(formatted_date+" "+formattedTime || '-').replace(",", " ").replace("\n", " ") + '",';
          } else {
            row += '"' + String(arrData[i][index] || '-').replace(",", " ").replace("\n", " ") + '",';
          }
      }

      row.slice(0, row.length - 1);

      //add a line break after each row
      CSV += row + '\r\n';
  }

  if (CSV == '') {
      alert("Invalid data");
      return;
  }

  //Generate a file name
  var fileName = "";
  //this will remove the blank-spaces from the title and replace it with an underscore
  fileName += ReportTitle.replace(/ /g,"_");

  //Initialize file format you want csv or xls
  var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);

  // Now the little tricky part.
  // you can use either>> window.open(uri);
  // but this will not work in some browsers
  // or you will not get the correct file extension

  //this trick will generate a temp <a /> tag
  var link = document.createElement("a");
  link.href = uri;

  //set the visibility hidden so it will not effect on your web-layout
  link.style = "visibility:hidden";
  link.download = fileName + ".csv";

  //this part will append the anchor tag and remove it after automatic click
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportCSV () {
  JSONToCSVConvertor(filteredUsers, "User Report", true)
}

$(document).ready(function() {
  $(function() {
      $('input[name="daterange"]').daterangepicker({
        autoUpdateInput: false
      })
  });
  $('input[name="daterange"]').on('apply.daterangepicker', function(ev, picker) {
      const { startDate, endDate } = picker
      current_startDate = startDate
      current_endDate = endDate
      initializeDatabase(currentStatus, currentCountry, startDate, endDate)
      $(this).val(picker.startDate.format('MM/DD/YYYY') + ' - ' + picker.endDate.format('MM/DD/YYYY'));
  });

  $('input[name="daterange"]').on('cancel.daterangepicker', function(ev, picker) {
    initializeDatabase(currentStatus, currentCountry, null, null)
      $(this).val('');
  });
  // Search list
  $("body").on("click", ".search i.fa-search", function() {
    $(this)
      .parents(".search")
      .addClass("show-search");
  });

  $("body").on("click", ".search i.fa-times", function() {
    $(this)
      .parents(".search")
      .removeClass("show-search");
  });

  $('#country').change(function() {
    const value = $('#country').val()
    filterCountry(value)
  });

  $('#exportCsv').click(function() {
    exportCSV()
  })

  window.addEventListener("beforeunload", function(e) {
    return removeWatching(currentFocus);
  });

  // Listening to auth state change
  firebase.auth().onAuthStateChanged(function(user) {
    if (!user) {
      window.location.href = "/"+window.location.search
    } else {
      initializeAdmin()
        .then(() => {
          $("#adminShortcut").css("display", "block");
        })
        .catch(() => {
          window.location.href = "/wizard"+window.location.search
        })
        .finally(() => {
          initializeDatabase('all').then(() => {
            $("#preLoader").fadeToggle();
          });
        });
    }
  });
});
