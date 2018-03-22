// Forgot password function using in Login page for recovering user's account
function forgotPassword () {
  const email = document.getElementById('forgotPasswordEmail').value
  return firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
      console.log("Forgot password : success")
    })
    .catch(err => {
      console.log('Forgot password : error : ', err)
    })
}

$(document).ready(function(){
	// Sign up, Sign in
	$("body").on("click", ".login header .btn-tool a", function(){
		if ( $(this).hasClass("open-sign-up") ) {
			$(this).parents("section").find(".sign-in, .forgot").removeClass("show-detail");
			$(this).parents("section").find(".sign-up").addClass("show-detail");
			$(this).parent(".btn-tool").find("p").text("Have an account?");
			$(this).removeClass("open-sign-up").addClass("open-sign-in").text("Sign in");
		} else if ( $(this).hasClass("open-sign-in") ) {
			$(this).parents("section").find(".sign-up, .forgot").removeClass("show-detail");
			$(this).parents("section").find(".sign-in").addClass("show-detail");
			$(this).parent(".btn-tool").find("p").text("Don't have an account?");
			$(this).removeClass("open-sign-in").addClass("open-sign-up").text("Sign up");
		}
	});

	// Forget password
	$("body").on("click", ".login a.open-forgot", function(){
		$(this).parents("section").find(".sign-in, .sign-up").removeClass("show-detail")
		$(this).parents("section").find(".forgot").addClass("show-detail");
	});

	$("body").on("click", ".login .sign-in form button", function(){
		if ( !$('.login .sign-in form input').filter(function(){ return $(this).val().length == 0; }).length ) {

			// $(this).addClass('loading-button').attr('disable','true');
			// $('.login-page .login .alert-box').removeClass('show-alert-box');

			setTimeout(function(){
				window.location.href = "dashboard.html";
			},1000);
			
		}
		// else {
		// 	$('.login-page .login .alert-box').addClass('show-alert-box');
		// }
	});

	$("body").keydown(function(e) {
		if (e.keyCode == 13)  {
			$(".login .sign-in form button").click();
		}
	});

	//Slider
	var $slider = $("ul.slider-img"),
		$container = $slider.find(".slide"),
		$nav = $("ul.slider-nav"),
		$slide = $container.children(),
		s_length = $slide.length,
		s_wide = $slider.width() * s_length,
		s_height = $slider.height(),
		autoSlide = null;

	// Click to switch
	$nav.find("li").on("click", function(pos) {
		$nav.find(".current").removeClass("current");
		$(this).addClass("current");
		pos = $(this).index() * $slider.width();
		$container.animate({left:'-'+pos+'px'}, 600);
		clearInterval(autoSlide);
		autoSlide = setInterval(slideShow, 3000);
		return false;
	}).first().addClass("current");

	function slideShow() {
		if ( $nav.find(".current").next().length ) {
			$nav.find(".current").next().trigger("click");
		} else {
			$nav.find("li").first().trigger("click");
		}
	}
	
	autoSlide = setInterval(slideShow, 3000);

	// Override submit on forgot password form
	$('#forgotPasswordForm').submit(function(e) {
		e.preventDefault()
		forgotPassword()
	})
});
