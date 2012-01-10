
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// begin slide show
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++
var index = 0; // the current image index
var index_enabled = 0; // the current image index (only enabled images) 

var imageLoaded = false;
var slideTimeout = false;
var slideshowImage;

function getCurrentImageIndex(){
	return index;
}

function showSlideshowDocument(afterload, newdoc){
	debug("autoslideshow: showSlideshowDocument");
	overview = false;
	try{slideshowcontent.document.stop();}catch(exception){};
	callback_afterload = afterload;
	
	if (newdoc)
	{
		window.content.location.href="chrome://autoslideshow/content/slideshow.html";
	}
	else{
		window.content.location.replace("chrome://autoslideshow/content/slideshow.html");
	}
}

// starts the slide show
function showSlideShow(replace){
	debug("AutoSlideshow: showSlideshow.\n");
	//alert("show slideshow: " + images.length);
	index = -1;
	index_enabled = -1;
	goFullscreen();
	setTimeout(initSlideShow, 100);
}


function initSlideShow(){
	//alert("init slideshow: " + images.length);
//	slideshowDocument.getElementsByTagName("body")[0].bgColor = "#FFFFFF";
	
	debug("AutoSlideshow: initSlideshow\n");
		
	slideshowImage = slideshowDocument.getElementById('slideshowImage');
/* 
	slideshowImage.src = 'chrome://autoslideshow/skin/loading.gif';
	center();
*/	
	showImageCount();
	
	var buttonplay = slideshowDocument.getElementById("play");
	buttonplay.src = "chrome://autoslideshow/skin/OSPause.gif";	
	
	
	showStatus();
	slideshowRunning=true;
	slideshowPause=false;
	updateSize();
	showImageCount();
	enabledControl(1);
	var cmdOverview = document.getElementById("AutoSlideshow_cmd_overview");
	cmdOverview.setAttribute('disabled', false);
	var cmdSaveAll = document.getElementById("AutoSlideshow_cmd_saveAll");
	cmdSaveAll.setAttribute('disabled', false);

	// preload first image
	
	slideshowDocument.title = "AutoSlideshow: " + _title;
	var urlbar = document.getElementById("urlbar");
	urlbar.value="AutoSlideshow: " + _title;
	
	var i = getNextIndex(-1);
	debug("next image: " + i);
	if (i >= 0 && i < images.length){
		if (images[i].state == null){
		//		alert(images[0].getImgsrc());
			images[i].loadImage("showSlide()", "image_err()");
		}
		else{
			showSlide();
		}
	}
}



function image_err(){
	// alert("error: " + images[index]);
	//if (slideshowRunning){
	{
		images.splice(index+1,1);
		showStatus();
		showImageCount();
		if (index+1 < images.length)
		{
			// initial
			if (index == -1){
				images[0].loadImage("showSlide()", "image_err()");
/*				var src = images[0];
				images[0] = new Image();
				images[0].src = src;
				images[0].onload = showSlide;
				images[0].onerror = image_err;
*/
			}
			else{
				var nextIndex = getNextIndex(index);
				preloadImage(nextIndex);
			}
		}else{
	    	// no images available at all, stop
			if (images.length == 0){
				showNoImagesFoundMessage();
				stopSlideshow(true, true);
			}else
				setTimeout(stopSlideshow, slideshowDelay, true, true);
		}
	}
}

// next slide show image loaded
function image_loaded(){
	if (images[index]){
		imageLoaded = true;
		if (!images[index].isLoaded())
		{
			return;
		}
		showStatus();
		// if current image has reached timeout, fadeout and show next image
		if (slideTimeout && !slideshowPause){
			var delay = 0;
			if (slideshowEffectsEnabled)
				delay = slideshowFadeInTime + slideshowPauseDelay;
			fadeout();
			timeout_showSlide = setTimeout(showSlide, delay);
		}
	}
}

// current image has reached timeout
function slide_timeout(){
	slideTimeout = true;
	showStatus();
	// if next image is loaded, fadeout and show next image
	if (imageLoaded && !slideshowPause){
		var delay = 0;
		if (slideshowEffectsEnabled)
			delay = slideshowFadeInTime + slideshowPauseDelay;
		fadeout();
		timeout_showSlide = setTimeout(showSlide, delay);
	}
}

function getNextIndex(_index){
	_index++;
	if (_index >= images.length)
			return _index;
	while (!images[_index].enabled){
		_index++;
		if (_index >= images.length)
			return _index;
	}
	return _index;
}

function getPrevIndex(_index){
	_index--;
	if (index < 0)
			return index;
	while (!images[_index].enabled){
		_index--;
		if (index < 0)
			return index;
	}
	return _index;
}

// show the next image
function showSlide(){
	
	debug("AutoSlideshow: showSlide\n");
	
	if (slideshowRunning  && !slideshowPause){
		slideTimeout = false;
		changeOpac(0);
		index = getNextIndex(index);
		index_enabled++;
		showIndex();
		showImageCount();
		enabledControl(1);
		if (!isThumbbarVisible())
			thumbbar.showItem(index);
		
		if (!images[index].isLoaded()){
			return;
		}
		//ioService.offline = true;
		slideshowImage.src = images[index].getImgsrc();
		slideshowImage.title = images[index].getImgsrc();
		//ioService.offline = false;
	
				
		updateSize();
		showStatus();
		fadein();
		
		
		

		// preload next image
		if (index == images.length-3){
			findNextImages(images, showImageCount);
		}
		var nextIndex = getNextIndex(index);
		if (index < images.length && nextIndex < images.length){
			preloadImage(nextIndex);
			showStatus();
			// slide timeout:
			clearTimeout(Timeout_nextSlide);
			Timeout_nextSlide = setTimeout(slide_timeout, slideshowDelay);
		}
		// slide show end
		else{
			//slideshow has finished
			setTimeout("fadeout()", slideshowDelay-(slideshowFadeInTime+slideshowPauseDelay));
			timeout_stopSlideshow = setTimeout(slideshowFinished, slideshowDelay);
		}
	}
}



function slideshowFinished(){
	if (slideshowRunning)
	{
		switch (slideshowFinishedAction)
		{
		case "end":
			stopSlideshow(true, true);
			break;
		case "restart":
			index = -1;
			index_enabled = -1;
			updateSize();
			showSlide();
			break;
		case "pause":
			pauseSlideshow();
			break;
		case "overview":
			checkURL = false;
			window.addEventListener("click",onMouseClick,true);
			showOverviewDocument("generateOverview();", false);
			break;
		}
	}
}

function pauseSlideshow(){
	clearTimeout(Timeout_nextSlide);
	clearTimeout(timeout_Continue);
	clearTimeout(timeout_showSlide);
	clearTimeout(timeout_stopSlideshow);
	clearTimeout(timeout_clear);

	resetFade();
	if (slideshowRunning && !slideshowPause)
	{
		setButtonChecked("AutoSlideshow-Button-Pause", true);
		slideshowPause = true;
		
		var buttonplay = slideshowDocument.getElementById("play");
		buttonplay.src = "chrome://autoslideshow/skin/OSPlay.gif";
		
		if (index >= 0 && images[index].isLoaded()){
			slideshowImage.src = images[index].getImgsrc();
		}else if(index>0 && images[index-1].isLoaded()){
			index = getPrevIndex(index);
			index_enabled--;
			slideshowImage.src = images[index].getImgsrc();
		}
		else{
			/*
			images[index].loadImage(null, null);
			slideshowDocument.getElementById('slideshowImage').src = images[index].getImgsrc();
			*/
		}
		showStatus();
	}
}

// start fade out effect for current image
function fadeout(){
	if (slideshowPause)
		return;
	if (slideshowEffectsEnabled)
	{	
		timeout_clear = setTimeout("slideshowImage.src = 'chrome://autoslideshow/skin/clear.gif';",slideshowFadeInTime);
		var effect = slideshowEffect;
		if (effect == 0)
		{	
			effect = Math.round(Math.random()) + 1;
		}
		switch (effect)
		{
		case 1: // Fade in / Fade out
			fadeOut(slideshowFadeInTime);
			//opacity(100, 0, slideshowFadeInTime);
			break;
		case 2: // zoom effect
			zoomEffect(slideshowImage.width, slideshowImage.height, 0, 0, slideshowFadeInTime);
			break;
		}
	}else{
		slideshowImage.src = 'chrome://autoslideshow/skin/clear.gif';
	}
}

function fadein(){
	if (slideshowEffectsEnabled){
		slideshowImage.style.opacity = 0;
		center();
		
		var effect = slideshowEffect;
		if (effect == 0)
		{	
			effect = Math.round(Math.random()) + 1;
		}
		switch (effect)
		{
		case 1: // Fade in / Fade out
			fadeIn(slideshowFadeInTime);
			//opacity(0, 100, slideshowFadeInTime);
			break;
		case 2: // zoom effect
			zoomEffect(0, 0, slideshowImage.width, slideshowImage.height, slideshowFadeInTime);
			break;
		}
	}else{
		resetFade();
	}
}

function resetFade(){
	updateSize();
	changeOpac(100);
}