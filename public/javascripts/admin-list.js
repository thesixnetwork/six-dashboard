// global user data
userData = {}

// Logout function to sign user out
function logOut() {
	firebase.auth().signOut()
}

// Initialize admin to check if user is admin
function initializeAdmin() {
	let promise = new Promise(function(resolve, reject) {
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
function createElementFromHTML(htmlString) {
	var div = document.createElement('li');
	div.innerHTML = htmlString.trim();
	return div;
}

// Build kyc user list element
function buildListUser(doc) {
	var elem = createElementFromHTML(`
			<a href='javascript:;' onclick="openUser('${doc.id}')">
				<div class="image">
					<span class="avatar">
						<img src="images/avatar/avatar.jpg">
					</span>
				</div>
				<div class="name">
					<p>${doc.data().firstName}</p>
				</div>
				<div class="last-name">
					<p>${doc.data().lastName}</p>
				</div>
				<div class="email">
					<p>${doc.data().email}</p>
				</div>
			</a>
	`)
	return elem
}

// Open user detail
function openUser(uid) {
	$("#adminListMain").css("display", "none")
	$("#detailFirstName").html(userData[uid].firstName)
	$("#detailLastName").html(userData[uid].lastName)
	$("#detailEmail").html(userData[uid].email)
	$("#detailPhoneNumber").html(userData[uid].phone)
	$("#detailCountry").html(userData[uid].nationality)
	$("#detailAddress").html(userData[uid].address)
	$("#detailPic1").html(userData[uid].passportUrl)
	$("#detailPic2").html(userData[uid].billUrl)
	$("#adminDetail").css("display", "block")
}

// go Back from detail
function goBack() {
	$("#adminListMain").css("display", "block")
	$("#adminDetail").css("display", "none")
}

// Initialize database to query data and draw to view
function initializeDatabase() {
	let promise = new Promise(function(resolve, reject) {
		let db = firebase.firestore();
		let userRef = db.collection("users");
		let query = userRef.where("kycStatus", "==", "pending")
		query.get()
		.then(docs => {
			docs.forEach(function(doc) {
				userData[doc.id] = doc.data()
				let elem = buildListUser(doc)
				$("#adminList")[0].appendChild(elem)
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

$(document).ready(function(){
	// Search list
	$("body").on("click", ".search i.fa-search", function(){
		$(this).parents(".search").addClass("show-search");
	});

	$("body").on("click", ".search i.fa-times", function(){
		$(this).parents(".search").removeClass("show-search");
	});

	// Listening to auth state change
	firebase.auth().onAuthStateChanged(function(user) {
		if (!user) {
			console.log('Go to login')
			window.location.href = "/";
		} else {
			initializeAdmin().then(() => {
				$("#adminShortcut").css("display", "block")
			}).catch(() => { 
				window.location.href = "/dashboard"
			}).finally(() => {
				initializeDatabase().finally(() => {
					$("#preLoader").fadeToggle()
				})
			})
		}
	})
});
