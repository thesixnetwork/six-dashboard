
$(document).ready(function(){
    // Dialog
    // Open
    $("body").on("click", ".open-dialog-video", function(){
        $('.dialog-video').addClass('show-dialog');
    });
    // Close
		$('body').on('click', '[class^="dialog-"] dialog', function(e){
			e.stopPropagation();
    });

    $('body').on('click', '[class^="dialog-"]', function(){
			$(this).removeClass('show-dialog');
    });

    $('body').on('click', '[class^="dialog-"] dialog a.close', function(){
			$(this).parents('[class^="dialog-"]').removeClass('show-dialog');
		});

		// payment
    $('body').on('click', '.payment-box button', function(){
			$(".payment-box").removeClass("show-detail")
			$(".address-history").addClass("show-detail")
		});

    $('body').on('click', '[class^="dialog-"] dialog a.close', function(){
			$(this).parents('[class^="dialog-"]').removeClass('show-dialog');
		});
});