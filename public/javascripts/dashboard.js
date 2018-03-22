$(document).ready(function(){
	// ===================== //
	// ===== Countdown ===== //
	// ===================== //
	var countDownDate = new Date("March 27, 2018 11:00:00").getTime();
	var now = new Date().getTime();
	var distance = countDownDate - now;

	function flipTo(digit, n){
		var current = digit.attr('data-num');
		digit.attr('data-num', n);
		digit.find('.front').attr('data-content', current);
		digit.find('.back, .under').attr('data-content', n);
		digit.find('.flap').css('display', 'block');
		setTimeout(function(){
			digit.find('.base').text(n);
			digit.find('.flap').css('display', 'none');
		}, 350);
	}

	var getTime = function(){
		var time = [];

		now = new Date().getTime();
		distance = countDownDate - now;

		var days = Math.floor(distance / (1000 * 60 * 60 * 24));
		var hrs = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		var mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
		var secs = Math.floor((distance % (1000 * 60)) / 1000);

		if (days < 10) {
			days = "0"+days;
		}
		if (hrs < 10) {
			hrs = "0"+hrs;
		}
		if (mins < 10) {
			mins = "0"+mins;
		}
		if (secs < 10) {
			secs = "0"+secs;
		}

		time = {"days":days, "hrs":hrs, "mins":mins, "secs":secs};

		return time;
	};

	// Coundown
	var countdown = function(){
		var countTime = getTime();

		if(countTime["hrs"] == 24) {
			flipTo($("ul.countdown li.days .digit"), countTime["days"]);
		}
		if(countTime["mins"] == 59) {
			flipTo($("ul.countdown li.hrs .digit"), countTime["hrs"]);
		}
		if(countTime["secs"] == 59) {
			flipTo($("ul.countdown li.mins .digit"), countTime["mins"]);
		}

		flipTo($("ul.countdown li.secs .digit"), countTime["secs"]);

		// If the count down is over, write some text
		if (distance < 0) {
			clearInterval(x);
			$("ul.countdown").remove();
		}
	};

	// Update Time
	var x = setInterval(function() {
		countdown();
	}, 1000);

	// Set First Time
	var firstTime = getTime();
	flipTo($("ul.countdown li.days .digit"), firstTime["days"]);
	flipTo($("ul.countdown li.hrs .digit"), firstTime["hrs"]);
	flipTo($("ul.countdown li.mins .digit"), firstTime["mins"]);
	flipTo($("ul.countdown li.secs .digit"), firstTime["secs"]);
	// ===================== //
	// ===================== //

	// KYC Form
	$("body").on("click", ".dashboard .kyc-form button", function(){
		$(this).parents(".kyc-form").removeClass("show-detail");
		$(".loading").addClass("show-loading");
		$("ul.step").find("li.current").next("li").addClass("current");

        setTimeout(function(){
			$(".loading").removeClass("show-loading");
			$(".dashboard").find(".padding").addClass("show-detail");
			$(".status p:nth-of-type(02)").text("Pending");
        }, 1000);
	});
	
	// Address form
	$("body").on("click", ".dashboard .address-form button", function(){
		$(this).parents(".address-form").removeClass("show-detail");
		$(".loading").addClass("show-loading");
		$("ul.step").find("li.current").next("li").addClass("current");

        setTimeout(function(){
			$(".loading").removeClass("show-loading");
			$(".dashboard").find(".waiting-ico").addClass("show-detail");
        }, 1000);
	});
	
	// Transection log
	$("body").on("click", ".dashboard .open-transection-log", function(){
		$(".transection-log").toggleClass("show-transection-log");
	});
	
	// approved to rejected
	$("body").on("click", ".dashboard .padding .approved a.next-step", function(){
		$(this).parents(".approved").removeClass("show-detail");
		$(this).parents(".approved").next(".rejected").addClass("show-detail");
		$(".status p:nth-of-type(02)").addClass("rejected").text("rejected");
	});
	
	// rejected to Submit address form
	$("body").on("click", ".dashboard .padding .rejected a.next-step", function(){
		$(this).parents(".padding").removeClass("show-detail");
		$(this).parents(".dashboard").find(".address-form").addClass("show-detail");
		$("ul.step").find("li.current").next("li").addClass("current");
		$(".status p:nth-of-type(02)").removeClass("rejected").addClass("approved").text("approved");		
	});
	
	// wait to ico
	$("body").on("click", ".dashboard .waiting-ico .waiting a.next-step", function(){
		$(this).parents(".waiting").removeClass("show-detail");
		$(this).parents(".waiting").next(".ico").addClass("show-detail");
	});
	
	// Option
	$('body').on('change', 'ul.option-list label.option input[type="checkbox"]', function() {
		var li = $(this).parent('label').parent('li').find("label.text");

		if ( $(this).is(':checked') ) {
			li.find('input').prop('disabled', false);
			li.removeClass("disable-label"); 
		} else {
			li.find('input').prop('disabled', true);
			li.addClass("disable-label");
		}
	});
});