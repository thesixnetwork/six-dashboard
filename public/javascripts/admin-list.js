// global user data
userData = {};

countries = {
  AF: "Afghanistan",
  AX: "Åland Islands",
  AL: "Albania",
  DZ: "Algeria",
  AS: "American Samoa",
  AD: "AndorrA",
  AO: "Angola",
  AI: "Anguilla",
  AQ: "Antarctica",
  AG: "Antigua and Barbuda",
  AR: "Argentina",
  AM: "Armenia",
  AW: "Aruba",
  AU: "Australia",
  AT: "Austria",
  AZ: "Azerbaijan",
  BS: "Bahamas",
  BH: "Bahrain",
  BD: "Bangladesh",
  BB: "Barbados",
  BY: "Belarus",
  BE: "Belgium",
  BZ: "Belize",
  BJ: "Benin",
  BM: "Bermuda",
  BT: "Bhutan",
  BO: "Bolivia",
  BA: "Bosnia and Herzegovina",
  BW: "Botswana",
  BV: "Bouvet Island",
  BR: "Brazil",
  IO: "British Indian Ocean Territory",
  BN: "Brunei Darussalam",
  BG: "Bulgaria",
  BF: "Burkina Faso",
  BI: "Burundi",
  KH: "Cambodia",
  CM: "Cameroon",
  CA: "Canada",
  CV: "Cape Verde",
  KY: "Cayman Islands",
  CF: "Central African Republic",
  TD: "Chad",
  CL: "Chile",
  CN: "China",
  CX: "Christmas Island",
  CC: "Cocos (Keeling) Islands",
  CO: "Colombia",
  KM: "Comoros",
  CG: "Congo",
  CD: "Congo, The Democratic Republic of the",
  CK: "Cook Islands",
  CR: "Costa Rica",
  CI: "Cote D'Ivoire",
  HR: "Croatia",
  CU: "Cuba",
  CY: "Cyprus",
  CZ: "Czech Republic",
  DK: "Denmark",
  DJ: "Djibouti",
  DM: "Dominica",
  DO: "Dominican Republic",
  EC: "Ecuador",
  EG: "Egypt",
  SV: "El Salvador",
  GQ: "Equatorial Guinea",
  ER: "Eritrea",
  EE: "Estonia",
  ET: "Ethiopia",
  FK: "Falkland Islands (Malvinas)",
  FO: "Faroe Islands",
  FJ: "Fiji",
  FI: "Finland",
  FR: "France",
  GF: "French Guiana",
  PF: "French Polynesia",
  TF: "French Southern Territories",
  GA: "Gabon",
  GM: "Gambia",
  GE: "Georgia",
  DE: "Germany",
  GH: "Ghana",
  GI: "Gibraltar",
  GR: "Greece",
  GL: "Greenland",
  GD: "Grenada",
  GP: "Guadeloupe",
  GU: "Guam",
  GT: "Guatemala",
  GG: "Guernsey",
  GN: "Guinea",
  GW: "Guinea-Bissau",
  GY: "Guyana",
  HT: "Haiti",
  HM: "Heard Island and Mcdonald Islands",
  VA: "Holy See (Vatican City State)",
  HN: "Honduras",
  HK: "Hong Kong",
  HU: "Hungary",
  IS: "Iceland",
  IN: "India",
  ID: "Indonesia",
  IR: "Iran, Islamic Republic Of",
  IQ: "Iraq",
  IE: "Ireland",
  IM: "Isle of Man",
  IL: "Israel",
  IT: "Italy",
  JM: "Jamaica",
  JP: "Japan",
  JE: "Jersey",
  JO: "Jordan",
  KZ: "Kazakhstan",
  KE: "Kenya",
  KI: "Kiribati",
  KP: "Korea, Democratic People'S Republic of",
  KR: "Korea, Republic of",
  KW: "Kuwait",
  KG: "Kyrgyzstan",
  LA: "Lao People'S Democratic Republic",
  LV: "Latvia",
  LB: "Lebanon",
  LS: "Lesotho",
  LR: "Liberia",
  LY: "Libyan Arab Jamahiriya",
  LI: "Liechtenstein",
  LT: "Lithuania",
  LU: "Luxembourg",
  MO: "Macao",
  MK: "Macedonia, The Former Yugoslav Republic of",
  MG: "Madagascar",
  MW: "Malawi",
  MY: "Malaysia",
  MV: "Maldives",
  ML: "Mali",
  MT: "Malta",
  MH: "Marshall Islands",
  MQ: "Martinique",
  MR: "Mauritania",
  MU: "Mauritius",
  YT: "Mayotte",
  MX: "Mexico",
  FM: "Micronesia, Federated States of",
  MD: "Moldova, Republic of",
  MC: "Monaco",
  MN: "Mongolia",
  MS: "Montserrat",
  MA: "Morocco",
  MZ: "Mozambique",
  MM: "Myanmar",
  NA: "Namibia",
  NR: "Nauru",
  NP: "Nepal",
  NL: "Netherlands",
  AN: "Netherlands Antilles",
  NC: "New Caledonia",
  NZ: "New Zealand",
  NI: "Nicaragua",
  NE: "Niger",
  NG: "Nigeria",
  NU: "Niue",
  NF: "Norfolk Island",
  MP: "Northern Mariana Islands",
  NO: "Norway",
  OM: "Oman",
  PK: "Pakistan",
  PW: "Palau",
  PS: "Palestinian Territory, Occupied",
  PA: "Panama",
  PG: "Papua New Guinea",
  PY: "Paraguay",
  PE: "Peru",
  PH: "Philippines",
  PN: "Pitcairn",
  PL: "Poland",
  PT: "Portugal",
  PR: "Puerto Rico",
  QA: "Qatar",
  RE: "Reunion",
  RO: "Romania",
  RU: "Russian Federation",
  RW: "RWANDA",
  SH: "Saint Helena",
  KN: "Saint Kitts and Nevis",
  LC: "Saint Lucia",
  PM: "Saint Pierre and Miquelon",
  VC: "Saint Vincent and the Grenadines",
  WS: "Samoa",
  SM: "San Marino",
  ST: "Sao Tome and Principe",
  SA: "Saudi Arabia",
  SN: "Senegal",
  CS: "Serbia and Montenegro",
  SC: "Seychelles",
  SL: "Sierra Leone",
  SG: "Singapore",
  SK: "Slovakia",
  SI: "Slovenia",
  SB: "Solomon Islands",
  SO: "Somalia",
  ZA: "South Africa",
  GS: "South Georgia and the South Sandwich Islands",
  ES: "Spain",
  LK: "Sri Lanka",
  SD: "Sudan",
  SR: "Suriname",
  SJ: "Svalbard and Jan Mayen",
  SZ: "Swaziland",
  SE: "Sweden",
  CH: "Switzerland",
  SY: "Syrian Arab Republic",
  TW: "Taiwan, Province of China",
  TJ: "Tajikistan",
  TZ: "Tanzania, United Republic of",
  TH: "Thailand",
  TL: "Timor-Leste",
  TG: "Togo",
  TK: "Tokelau",
  TO: "Tonga",
  TT: "Trinidad and Tobago",
  TN: "Tunisia",
  TR: "Turkey",
  TM: "Turkmenistan",
  TC: "Turks and Caicos Islands",
  TV: "Tuvalu",
  UG: "Uganda",
  UA: "Ukraine",
  AE: "United Arab Emirates",
  GB: "United Kingdom",
  US: "United States",
  UM: "United States Minor Outlying Islands",
  UY: "Uruguay",
  UZ: "Uzbekistan",
  VU: "Vanuatu",
  VE: "Venezuela",
  VN: "Viet Nam",
  VG: "Virgin Islands, British",
  VI: "Virgin Islands, U.S.",
  WF: "Wallis and Futuna",
  EH: "Western Sahara",
  YE: "Yemen",
  ZM: "Zambia",
  ZW: "Zimbabwe"
};

estimates = {
  "1-2": "1K USD - 2K USD",
  "2-5": "2K USD - 5K USD",
  "5-15": "5K USD - 15K USD",
  "15-100": "15K USD - 100K USD",
  "100+": "100K USD - More"
};

rejectNote = {
  need_more: `We appreciate that you took the time for the registration. However, we received insufficient information regarding your KYC/ AML documents and/ or information. 

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

Thank you for your interest in our ICO. 

SIX.network`,
  other: ""
};

currentFocus = "";
var currentIp = "";
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
function buildListUser(doc) {
  var date = ''
  if (doc.data().kyc_submit_time && doc.data().kyc_submit_time !== null) {
    date = new Date((doc.data().kyc_submit_time + 3600 * 7) * 1000);
  }
  var hours = date !== '' ? date.getHours() : '';
  var minutes =  date !== '' ? '0' + date.getMinutes() : '';
  var seconds =  date !== '' ? '0' + date.getSeconds() : '';
  var formattedTime = ''
  var formatted_date = ''
  if (date && date !== '') {
    formattedTime = hours + ":" + minutes.substr(-2) + ":" + seconds.substr(-2);
    formatted_date = date.toISOString().substr(0, 10);
  } 
  var tr = document.createElement("tr");
  var td1 = document.createElement("td");
  var txt1 = document.createTextNode(
    doc.data().first_name + " " + doc.data().last_name
  );
  td1.appendChild(txt1);
  var td2 = document.createElement("td");
  var txt2 = document.createTextNode(formatted_date);
  td2.appendChild(txt2);
  var td3 = document.createElement("td");
  var txt3 = document.createTextNode(formattedTime !== '' ? formattedTime + ' +07:00' : '-');
  var td4 = document.createElement("td");
  var txt4 = document.createTextNode("-");
  td4.setAttribute("id", `remarkText(${doc.id})`)
  td4.appendChild(txt4);
  td3.appendChild(txt3);
  tr.appendChild(td1);
  tr.appendChild(td2);
  tr.appendChild(td3);
  tr.appendChild(td4);
  tr.onclick = function() {
    openUser(doc.id);
  };
  tr.id = doc.id;
  return tr
}

// Open user detail
function openUser(uid) {
  $("#adminListMain").css("display", "none");
  $("#detailFirstName").html(userData[uid].first_name);
  $("#detailLastName").html(userData[uid].last_name);
  $("#detailEmail").html(userData[uid].email);
  $("#detailPhoneNumber").html(userData[uid].phone_number);
  $("#detailCountry").html(countries[userData[uid].country]);
  if (userData[uid].country === "TH") {
    $("#citizenIdContainer").css("display", "block");
    $("#citizenIdPhotoContainer").css("display", "block");
    $("#detailCitizenId").html(userData[uid].citizen_id);
  } else {
    $("#citizenIdContainer").css("display", "none");
    $("#citizenIdPhotoContainer").css("display", "none");
  }
  $("#detailPassportNumber").html(userData[uid].passport_number);
  $("#detailAddress").html(userData[uid].address);
  $("#detailPic1").attr("src", userData[uid].pic1);
  $("#detailPic2").attr("src", userData[uid].pic2);
  $("#detailPic3").attr("src", userData[uid].pic3);
  $("#detailPic4").attr("src", userData[uid].pic4);
  $("#detailEstimate").html(userData[uid].estimate + " ETH");
  $("#adminDetail").css("display", "block");
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
  $("#adminListMain").css("display", "block");
  $("#adminDetail").css("display", "none");
  $("#detailPic1").attr("src", "");
  $("#detailPic2").attr("src", "");
  $("#detailPic3").attr("src", "");
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
    kyc_status: "rejected",
    reject_type: rejecttype,
    updater: user.uid,
    updater_ip: currentIp,
    update_time: Date.now()
  };
  if (rejectnote !== undefined && rejecttype === "other") {
    updateData.reject_note = rejectnote;
  } else {
    updateData.reject_note = rejectNote[rejecttype];
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

// Initialize database to query data and draw to view
function initializeDatabase(status) {
  let promise = new Promise(function(resolve, reject) {
    $("#adminList").empty()
    let db = firebase.firestore();
    let userRef = db.collection("users");
    let query = userRef
    switch(status) {
      case 'approved':
        query = userRef.where("kyc_status", "==", "approved");
        break
      case 'rejected':
        query = userRef.where("kyc_status", "==", "rejected");
        break
      case 'pending':
        query = userRef.where("kyc_status", "==", "pending");
        break
      case 'notComplete':
        query = userRef.where("kyc_status", "==", null);
        break       
      default:
        break
    }
    query
      .onSnapshot(docs => {
        $("#adminList").empty()
        docs.forEach(function(doc, index) {
          const data = doc.data()
          userData[doc.id] = data
          let elem = buildListUser(doc);
          $("#adminList")[0].appendChild(elem);
          const { updater, kyc_status } = data
          switch(status) {
            case 'all':
              renderStatus(doc.id, data)
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

function handleFilter (type) {
  $(`#${currentStatus}`).removeClass('is-active')
  $(`#${type}`).addClass('is-active')
  currentStatus = type
  initializeDatabase(type)
  switch(type) {
    case 'all':
      $('#remarkColumn').text('Status')
      break
    case 'approved':
      $('#remarkColumn').text('Approved By')
      break
    case 'rejected':
      $('#remarkColumn').text('Rejected By')
      break
    case 'pending':
      $('#remarkColumn').text('Watcher')
      break
    case 'notComplete':
      $('#remarkColumn').text('')
      break
  }
}

$(document).ready(function() {
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

  window.addEventListener("beforeunload", function(e) {
    return removeWatching(currentFocus);
  });

  // Listening to auth state change
  firebase.auth().onAuthStateChanged(function(user) {
    if (!user) {
      window.location.href = "/";
    } else {
      initializeAdmin()
        .then(() => {
          $("#adminShortcut").css("display", "block");
        })
        .catch(() => {
          window.location.href = "/wizard";
        })
        .finally(() => {
          initializeDatabase('all').then(() => {
            $("#preLoader").fadeToggle();
          });
        });
    }
  });
});
