/* slidBox 0.1

Requirements:	jQuery (tested with 1.4.2)

Licence:	Do whatever you want with it. Seriously there is plenty of js/css picture viewer out there and this one is not reinventing anything. So take it, change the code, authorship or even the licence, I don't care.

Known bug:
- in opera the images are not vertically aligned properly
- Some version of jQuery (like 1.4.4) have a bug for really long galleries. After some point the animation seem to restart from 0

ToDo :
- Manage loading error of images (404, 403, etc..)
- Support of <video> or html content

*/

// touchGallery class
var slidBox = new function() {
	//
	// CONFIGURATION
	//
	
	// Speed of the sliding animations (0 to have no animation)
	this.configAnimationSpeed = 1000;

	// Image shown when an image is loading
	this.loadingImage = './slidBox/images/loading.gif';
	
	// Left and right margin aroung the viewer area (between 0 and 0.5)
	this.configHorizontalMargin = 0.1;
	
	// Preload of full gallery
	//	true: Try to preload all the picture in the set, can eat quite some bandwidth if the picture set is big 
	//	false: The system will only preload the picture in the viewer and the next and previous ones
	this.configPreloadSet = false;
	
	//
	// CODE
	//

	// Initialisation
	this.loadingWidth;
	this.loadingHeight;
	this.init = function() {
	
		// we install all the stuff
		slidBox.install();
		
		// Preload loading animation
		var loading = new Image();
		$(loading)
			.load(function() { 
				$(this).removeAttr("width").removeAttr("height").css({ width: "", height: "" });
				slidBox.loadingWidth = this.width;
				slidBox.loadingHeight = this.height;
			})
			.attr('src', slidBox.loadingImage);
			
		// we refresh the slideshow when the window is resized (or the device is tilted)
		$(window).resize(function() {
			slidBox.refresh();
		});
	};
	
	// Check if this is the current browser
	this.browser = function(s) {
		return (navigator.userAgent.match(new RegExp(s,"i"))!=null);
	}
	
	// Start the show
	this.hidePageContent = false;
	this.initialScroll;
	this.start = function() {
		var rel = $(this).attr('rel');
		if ( rel == 'slidBox' ) {
			// We load a single picture
			slidBox.add($(this), true);
		}
		else {
			// We load a group of pictures
			var foc = $(this);
			$('a[rel='+rel+']').each( function() { slidBox.add($(this), ($(this).context==$(foc).context) ); });
		}

		// Hide all the direct children of body
		// This is a hack for iOS device whoch doesn't support element with fixed positiom due to the viewport system
		// By hidding the whole page, the fixed position work properly
		if ( slidBox.browser('iPad') || slidBox.browser('iPod') || slidBox.browser('iPhone') || slidBox.browser('Android') || slidBox.browser('msie') ) {
			slidBox.hidePageContent = true;
			slidBox.initialScroll = $(document).scrollTop();
			$('body').children().hide();
		}
		
		// Oh the dirty hack. Even if internet explorer doesn't support opacity, we force it to use css opacity to avoid jquery to use filters.
		// I don't know why but filters cause some bugs with backgrounds which lose their transparency
		if ( slidBox.browser('msie') ) {
			jQuery.support.opacity = true;
		}
		
		// and the gallery appears
		$('#sb_container').show().css('opacity', 0).animate({opacity:1.0}, 300, 'swing');
		slidBox.refresh();
		
		return false;
	};

	// Quit the show
	this.end = function() {
		if ( slidBox.hidePageContent ) {
			$('body').children().show();
			slidBox.hidePageContent = false;
			setTimeout( function() {
				$(document).scrollTop(slidBox.initialScroll);
			}, 200);
			
		}
		
		$('#sb_container').animate({opacity:0}, 200, 'swing', function() {
			$('#sb_container').hide();
			$('li', '#sb_container').remove();
		});
	};
	
	// the user tapped or clicked on the list
	// now we have to figureout what to do
	this.click = function(event) {
		// the the user tap on the viewer, end the show
		if ( $(event.target).attr('id')=='sb_focus' || $(event.target).hasClass('sb_viewer') ){
			slidBox.end();
			return;
		}
		
		// refocus on the tapped picture
  		var target = $(event.target);
		if ( $(event.target).hasClass('sb_item') ) {
			slidBox.setfocus($(event.target).find('img.sb_image'));
			slidBox.refocus(true);
			return;
		}
		if ( $(event.target).hasClass('sb_image') ) {
			slidBox.setfocus($(event.target));
			slidBox.refocus(true);
			return;
		}
		
		// anything else, quit
		slidBox.end();
		
		return false;
	};
	
	// Manage keyboard events
	this.previousKey;
	this.acceptPreviousKey = true;
	this.keydown = function(e) {
		var keyCode = e.keyCode || e.which;
		var key = {j: 74, k:75, left: 37, up: 38, right: 39, down: 40, enter: 13, escape: 27, spacebar:32, backspace:8 };

		// Webkit tend to repeat keydown event when a key is hold. We prevent that with a timer		
		if ( slidBox.previousKey==keyCode && slidBox.acceptPreviousKey==false )
			return;
		
		var newfocus;
		switch (keyCode) {
			case key.left:
			case key.k:
			case key.backspace:
				newfocus = $('#sb_focus').parent().parent().prev().find('img.sb_image');
				if ( $(newfocus).length==0 ) {
					$('ul', "#sb_container")
						.each( function() { slidBox.refocus(false); slidBox.hideCaption(); })
						.animate( {left: '+=50px'}, 100, 'swing')
						.animate( {left: '-=50px'}, 200, 'swing', function() { slidBox.showCaption(true)});
				}
				break;
			
			case key.right:
			case key.j:
			case key.spacebar:
				newfocus = $('#sb_focus').parent().parent().next().find('img.sb_image');
					$('ul', "#sb_container")
						.each( function() { slidBox.refocus(false); slidBox.hideCaption(); })
						.animate( {left: '-=50px'}, 100, 'swing')
						.animate( {left: '+=50px'}, 200, 'swing', function() { slidBox.showCaption(true)});
				break;

			case key.escape:
				slidBox.end();
				return;
		}
		
		// Block the same key input for some time
		slidBox.previousKey = keyCode;
		slidBox.acceptPreviousKey = false;
		setTimeout( function() {
			slidBox.acceptPreviousKey = true;
		}, 200);

		// we focus on the new element
		if ( $(newfocus).length ) {
			slidBox.setfocus($(newfocus));
			slidBox.refocus(true);
		}
		return;
	};
  	
	// Called when the user touch with a multitouch device (iOS)
	this.dragOrigin;
	this.dragPrevious;
  	this.dragStart = function(jquery_event) {
  		e = jquery_event.originalEvent;
  		
  		if ( !$(jquery_event.target).hasClass('sb_image') && !$(jquery_event.target).hasClass('sb_item') ) {
  			return;
		}

		if (e.touches.length == 1) {
			slidBox.dragPrevious = slidBox.dragOrigin = e.touches[0].pageX;
		 	document.addEventListener('touchmove', slidBox.drag, false);
		 	document.addEventListener('touchend', slidBox.dragEnd, false);
		 	
		 	slidBox.hideCaption();
		 	
		 	return false;
		}
  	};
  	
  	this.drag = function(e) {
		e.preventDefault();

		var newLeft = parseInt($('ul', '#sb_container').css('left'));
		newLeft-= slidBox.dragPrevious - e.touches[0].pageX;
		$('ul', "#sb_container").stop(true).css( {left:newLeft});
		
		// Basicaly we are checking touch direction and if it changes
		var frameVelocity = e.touches[0].pageX - slidBox.dragPrevious;
		var previousVelocity = slidBox.dragPrevious - slidBox.dragOrigin;
		var directionChange = frameVelocity * previousVelocity;
		if ( directionChange<0 )
			slidBox.dragOrigin = slidBox.dragPrevious;
		
		slidBox.dragPrevious = e.touches[0].pageX;
		
		return false;
  	};

  	this.dragEnd = function(e) {
		document.removeEventListener('touchmove', slidBox.drag, false);
		document.removeEventListener('touchend', slidBox.dragEnd, false);
		
		var threshold = 50;
		var direction = slidBox.dragOrigin - slidBox.dragPrevious;
		if ( direction > threshold ) {
			$('#sb_focus').parent().parent().next().find('img.sb_image').each( function() { slidBox.setfocus($(this)); });
		}
		else if ( direction < -threshold ) {
			$('#sb_focus').parent().parent().prev().find('img.sb_image').each( function() { slidBox.setfocus($(this)); });
		}
		
		slidBox.refocus(true);
		
		return false;
  	};

	// insert basic HTML element required to display the gallery and various event handler
	this.install = function() {
		var content =
		'<div id="sb_container" style="position:fixed;left:0;right:0;overflow:visible;white-space:nowrap;z-index:525;top:10%;bottom:10%;font-family:Helvetica;font-size:12px;">'+
			'<span id="sb_background" style="position:fixed;top:0;bottom:0;left:0;right:0;background-color:#334;opacity:0.8;"></span>'+
			'<ul style="position:absolute;height:100%;margin:0;padding:0;"></ul>'+
			'<span id="sb_close" style="position:fixed;top:0;right:5%;background-color:white;font-size:16px;color:#334;padding:5px;cursor:pointer;">Close</span>'+
		'</div>';
		$('body').append(content);
		
		$('#sb_container').hide();
		
		// Add the click event on slidBox links
		$('a[rel^=slidBox]').click( slidBox.start);
		
		// Add click event on background to quit the show
		$("#sb_background").click( slidBox.end);
		$("#sb_close").click( slidBox.end);
		
		// Add click event on the list
		$('ul', "#sb_container").click( function(e){slidBox.click(e)});
		
		// Add keyboard event
		$(document).keydown( function(e){slidBox.keydown(e)});
		
		// Add touch evemt
		$("#sb_container").bind( 'touchstart', function(e){ slidBox.dragStart(e); });
//		document.getElementById('sb_container').addEventListener('touchstart', slidBox.dragStart, false);
	};

	// Add a new picture to the list
	//	e: link object
	// 	f: should it be the picture in the viewer
	this.add = function(e, f) {
		var content = $(
		'<li class="sb_item" style="display:inline-block;height:100%;background-color:transparent;vertical-align:middle;white-space:normal;">'+
			'<div class="sb_img_container" style="position:relative;-webkit-transform:translateZ(0);">'+
				'<img class="sb_image" src="'+slidBox.loadingImage+'" style="margin-left:0;margin-right:0;" />'+
				'<span class="sb_caption" style="position:absolute;left:0;right:0;bottom:0px;width:100%;background-color:white;opacity:0;"></span>'+
				'<span class="sb_overlay"></span>'+
			'</div>'+
		'</li>');
	
		$('ul', '#sb_container').append(content);
		$(content).find('img.sb_image')
			.data('width', slidBox.loadingWidth)
			.data('height', slidBox.loadingHeight)
			.data('src', $(e).attr('href'))
			.data('status', 'off')
			.data('caption', $(e).attr('title'));

		// set the correct class to the list element
		// (in theory we need to test only the sb_next class but just in case we test the sb_next too (being future proof, idiot proof and double rainbow proof)
		if ( $(content).prev().hasClass('sb_viewer') )
			$(content).addClass('sb_next');
			
		if ( $(content).next().hasClass('sb_viewer') )
			$(content).addClass('sb_prev');
		
		// if the argument is there, we set this picture as the one we need to focus on
		if(f) slidBox.setfocus($(content).find('img.sb_image'));
	};
	
	// set the picture we should focus on
	// after setting it, make sure to call refocus()
	//	i: image object
	this.setfocus = function(i) {
		if ( $(i).length==0 )
			return;
	
		// reset previous and next class
		$('li', '#sb_container')
			.removeClass('sb_prev')
			.removeClass('sb_next');
		
		// remove id from previously focused picture
		$('#sb_focus').parent().parent().removeClass('sb_viewer');
		$('#sb_focus').attr('id', '');
		
		// set new focused picture and set classes
		var p = $(i).parent().parent();
		$(p).addClass('sb_viewer');
		$(p).next().addClass('sb_next');
		$(p).prev().addClass('sb_prev');
		$(i).attr('id', 'sb_focus');
	};
	
	// refresh a picture properties (image size, margins)
	//	i: image object
	this.refreshImage = function(i) {
		var imgWidth = $(i).data('width');
		var imgHeight = $(i).data('height');
		
		var p = $(i).parent();
		var pp = $(p).parent();

		// refresh some properties
		$(i).width(imgWidth);
		$(i).height(imgHeight);
		$(p).width($(i).outerWidth());
		$(p).height($(i).outerHeight());

		sizeRatio = imgWidth / imgHeight;
		if ( $(i).outerWidth()>$(pp).innerWidth() ) {
			$(i).width( Math.round($(pp).innerWidth() - ($(p).outerWidth() - $(i).width())) );
			$(i).height(Math.round($(i).width() / sizeRatio));
			$(p).width($(i).outerWidth());
			$(p).height($(i).outerHeight());
		}
		if ( $(i).outerHeight()>$(pp).innerHeight() ) {
			$(i).height(Math.round($(pp).innerHeight() - ($(p).outerHeight() - $(i).height())));
			$(i).width(Math.round($(i).height() * sizeRatio));
			$(p).width($(i).outerWidth());
			$(p).height($(i).outerHeight());
		}

		var newMargin = ($(pp).innerHeight() - $(p).outerHeight())/2;
		$(p).css( {marginTop:newMargin, marginBottom:0} );
		
		newMargin = ($(pp).innerWidth() - $(p).outerWidth())/2;
		$(p).stop(true).css( {marginLeft:newMargin, marginRight:newMargin});
		
		// If this is the next picture we have to change the margin
		if ($(pp).hasClass('sb_prev')) {
			newMargin = $(pp).innerWidth() - $(p).outerWidth();
			$(p).stop(true).css( {marginLeft: newMargin, marginRight:0});
		}
		
		// Same for the previous one
		if ($(pp).hasClass('sb_next')) {
			var newMargin = $(pp).innerWidth() - $(p).outerWidth();
			$(p).stop(true).css( {marginRight: newMargin, marginLeft:0});
		}
	};
	
	// refresh the whole presentation, resize the list element and pictures and focus on current picture
	this.refresh = function() {
		// resize the list elements
		$("#sb_container").find("li").width($(window).width() * (1.0 - slidBox.configHorizontalMargin*2));
		
		// resize the pictures
		$('img.sb_image', "#sb_container").each( function() { slidBox.refreshImage($(this))} );
		
		// resize internet explorer (to fake css fixed position, we did hide the rest of the webpage before)
		if ( slidBox.browser('msie') ) {
			var b = $('body');
			var w = $(window).width() - parseInt(b.css('margin-left')) - parseInt(b.css('margin-right'));
			var h = $(window).height() - parseInt(b.css('margin-top')) - parseInt(b.css('margin-top'));
			$('#sb_container').css({
				position: 'relative',
				width: w,
				height:h} );
		}
		
		slidBox.refocus(false);		
	};
	
	// put the current picture in the middle of the screen and move the previous and next picture on the border of the screen
	this.refocus = function(animate) {
		viewer_width = $(window).width() * (1.0 - slidBox.configHorizontalMargin*2);
		
		// if the galery is empty we can just leave discretly
		if ( $('li', '#sb_container').length==0 )
			return;
			
		// if there is no focus, set the focus on the first of the list
		if ( $('#sb_focus').length==0 )
			slidBox.setfocus($('img.sb_image', "#sb_container").first());
			
		// hide the current caption
		slidBox.hideCaption();

		var div = $('#sb_focus').parent();
		var li = $(div).parent();
		var prev = $(li).prev().find('div.sb_img_container');
		var next = $(li).next().find('div.sb_img_container');

		// shift the list to put the focus on the correct picture
		var newLeft = (($(window).width()-viewer_width)/2) - $(li).position().left;
		var newMargin = ($(li).innerWidth() - $('#sb_focus').outerWidth())/2;
		var newMarginPrev = $(li).prev().innerWidth() - $(prev).outerWidth();
		var newMarginNext = $(li).next().innerWidth() - $(next).outerWidth();
		
		// set the new values
		if (animate){
			$('ul', "#sb_container").stop(true).animate( {left:newLeft}, slidBox.configAnimationSpeed, 'swing', function() {slidBox.showCaption()});
			$(div).stop(true).animate({marginLeft:newMargin, marginRight:newMargin}, slidBox.configAnimationSpeed, 'swing');
			$(li).stop(true).animate({opacity:1.0}, slidBox.configAnimationSpeed, 'swing');
			
			$(prev).stop(true).animate( {marginLeft: newMarginPrev, marginRight:0}, slidBox.configAnimationSpeed, 'swing');
			$(prev).parent().stop(true).animate( {opacity:0.5}, slidBox.configAnimationSpeed, 'swing');
			
			$(next).stop(true).animate( {marginRight: newMarginNext, marginLeft:0}, slidBox.configAnimationSpeed, 'swing');
			$(next).parent().stop(true).animate( {opacity:0.5}, slidBox.configAnimationSpeed, 'swing');
		}else{
			$('ul', "#sb_container").stop(true).css( {left:newLeft});
			$(div).stop(true).css({marginLeft:newMargin, marginRight:newMargin});
			$(li).stop(true).css({opacity:1.0});

			$(prev).stop(true).css( {marginLeft: newMarginPrev, marginRight:0});
			$(prev).parent().stop(true).css( {opacity:0.5});

			$(next).stop(true,true).css( {marginRight: newMarginNext, marginLeft:0});
			$(next).parent().stop(true).css( {opacity:0.5});
			
			slidBox.showCaption();
		}
		
		slidBox.load($('#sb_focus'));
	};
	
	// hide the caption box
	this.hideCaption = function() {
		$('.sb_caption', '#sb_container').stop(true).animate({opacity:0}, 200, 'swing');
	};
	
	this.showCaption = function() {
		var caption = $('#sb_focus').data('caption');
		if ( caption=='' )
			return;
		
		var e = $('#sb_focus').parent().find('.sb_caption');
		
		// change the text
		$(e).html( '<p style="margin:10px;">'+caption+'</p>');
		
		// if the image of the caption is not loaded we don't show the the caption
		if ( $('#sb_focus').data('status')!='ok' )
			return;

		// show it to the world
		$(e).stop(true).animate({opacity:1.0}, 200, 'swing');
	};
	
	// load an image with the information stored in the data field
	this.load = function(i) {
		if ( $(i).data('status')=='loading' || $(i).data('status')=='ok' ) {
			slidBox.preload();
			return;
		}
		
		$(this).data('status', 'loading');
		
		// create a new picture that load the resource
		// when loaded switch the address of the picture in the page
		var tmp = new Image();
		$(tmp)
			.data(i)
			.load(function() {
				var img = $(this).data();
				var li = $(img).parent().parent();
				
				var opa = 0;
				if ( $(li).hasClass('sb_prev') ||  $(li).hasClass('sb_next') ) {
					opa = 0.5;
				}
				else if ( $(img).attr('id')=='sb_focus' ) {
					opa = 1.0;
				}
				
				// set the displayed picture with the information we need
				$(img)
					.data('width', this.width)
					.data('height', this.height)
					.data('status', 'ok')
					.width(this.width)
					.height(this.height)
					.attr('src', $(this).attr('src'))
					.css({padding:10, backgroundColor: 'white'});
					
				
				$(li)
					.addClass('sb_loaded')
					.stop(true)
					.css({opacity:0})
					.animate({opacity:opa}, slidBox.configAnimationSpeed, 'swing');
				
				// refresh the picture if we need to
				slidBox.refreshImage($(img));
				
				// show caption if necessary
				if ( $(img).attr('id')=='sb_focus' )
					slidBox.showCaption();
				
				// preload other picture if necessary
				slidBox.preload();
			})
			.attr('src', $(i).data('src'));
		
	};
	
	// preload pictures
	this.preload = function() {
		// now we check if we need to preload more pictures
		//	(we assume the picture in the viewer was the first one to be loaded
		var li = $('#sb_focus').parent().parent();
		var next = $(li).next().find('img.sb_image');
		if ($(next).data('status')=='off') {
			slidBox.load($(next));
			return;
		}
		
		var prev = $(li).prev().find('img.sb_image');
		if ($(prev).data('status')=='off') {
			slidBox.load($(prev));
			return;
		}
		
		if ( slidBox.configPreloadSet ) {
			$('img.sb_image', '#sb_container').each( function() {
				if ($(this).data('status')=='off') {
					slidBox.load($(this));
					return false;
				}
			});
		}
	};
};


