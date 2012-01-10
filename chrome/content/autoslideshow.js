
// Localizing some strings
var gBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
var autoslidestrings = gBundle.createBundle("chrome://autoslideshow/locale/autoslideshow.properties");
var prefs;

var toolbars = new Array();

function init(){
	wasFullScreen = window.fullScreen;
	fullscreen = false;
	
	debug("AutoSlideshow: init\n");
	
	registerListener();
	
	try{
		prefs = Components.classes["@mozilla.org/preferences-service;1"]
	                                .getService(Components.interfaces.nsIPrefService);
	 	prefs = prefs.getBranch("extensions.AutoSlideshow.");
		
		slideshowDelay = prefs.getIntPref("slideshowDelay") * 1000;
		slideshowFinishedAction = prefs.getCharPref("slideshowFinishedAction");
		slideshowEffectsEnabled = prefs.getBoolPref("slideshowEffectsEnabled");
		slideshowEffect = prefs.getIntPref("slideshowEffect");
		zoomEnabled = prefs.getBoolPref("zoom");
		var zoomMaxIndex = prefs.getIntPref("zoomMax");
		switch(zoomMaxIndex){
			case 0: zoomMax = 1.50; break;
			case 1: zoomMax = 2; break;
			case 2: zoomMax = 4; break;
			case 3: zoomMax = -1; break;
		}
			
		imageSelectionLinks = prefs.getBoolPref("imageSelection.links");
		imageSelectionImages = prefs.getCharPref("imageSelection.images");
		imageSelectionImagesMinWidth = prefs.getIntPref("imageSelection.images.minWidth");
		imageSelectionImagesMinHeight = prefs.getIntPref("imageSelection.images.minHeight");
		overviewThumbSize = prefs.getIntPref("overview.thumbsize");
		maxgap = prefs.getIntPref("imageSelection.maxgap");
		scannedtabs = prefs.getIntPref("scannedtabs");
		
		tbVisible = document.getElementById("navigator-toolbox").getAttribute("hidden");
		toolbars["navigator-toolbox"] = tbVisible;
		//tabbarVisible = getBrowser().mStrip.getAttribute("hidden");
		//toolbars["tabbar"] = tabbarVisible;
		
		var startMode = prefs.getIntPref("startMode");
		fullscreen = startMode==1;
		osmenu = prefs.getBoolPref("osmenu");
	}catch(e){
		alert(e);
	}
}

function button_next(){
	if (slideshowRunning && isControlEnabled()){
		var nextIndex = getNextIndex(index); 
		if (nextIndex < images.length){
			debug("nextIndex: " + nextIndex)
			gotoImage(nextIndex);
			index_enabled++;
		}
	}
}
function button_prev(){
	if (slideshowRunning && isControlEnabled())
	{
		var prevIndex = getPrevIndex(index); 
		if (prevIndex >= 0){
			gotoImage(prevIndex);
			index_enabled--;
		}
	}
}

function button_saveall(){
	if (!slideshowPause)
		pauseSlideshow();
	if (images.length < 1){
		return;
	}
	window.openDialog("chrome://AutoSlideshow/content/saveall.xul", "", "chrome,titlebar,toolbar,close,modal", 
	images, -1);
}

function openSettingsWindow(){
	window.openDialog("chrome://AutoSlideshow/content/autoslideshowoptions.xul", "", "chrome,titlebar,toolbar,close,dialog=no");
}


function first(){
	if (slideshowRunning && isControlEnabled()){
			var nextIndex = getNextIndex(-1);
			if (nextIndex < images.length){
				gotoImage(nextIndex);
				index_enabled = 0;
			}
	}
}

function last(){
	if (slideshowRunning && isControlEnabled()){
			var prevIndex = getPrevIndex(images.length);
			if (prevIndex >= 0){
				gotoImage(prevIndex);
				index_enabled = enabledImagesLength-1;
			}
	}
}


function button_overview(){
	if (!slideshowRunning){
		//alert("start slideshow in overview mode");
		setButtonChecked("AutoSlideshow-Button", true);
		init();
		slideshowPause = false;
		slideTimeout = false;
		clearTimeout(Timeout_nextSlide);
		url = window.content.document.location.href;
		slideshowRunning = true;		
		checkURL = false;
		slideshowPause = true;
		
		slideshowContent = window.content;
		slideshowContent.stop();
		orgframe = copyFrame(slideshowContent);
		_title = window.content.document.title;
		pauseSlideshow();
				
		showSlideshowDocument("loadImages(false);", true);		
	}
	else{
		// var button = document.getElementById("AutoSlideshow-Button-Overview");
		if (overview){
			//alert("switch to slideshow mode");
			checkURL = false;
			selectedImage = index;
			if (selectedImage < 0)
				selectedImage = 0;
			setButtonChecked("AutoSlideshow-Button-Overview", false);
			setButtonChecked("AutoSlideshow-Button-Pause", true);
					
			stopOverview();
			showSlideshowDocument("gotoSelectedImage();");
		}
		else{
			//alert("switch to overview mode");
			pauseSlideshow();
			checkURL = false;
			showOverviewDocument("generateOverview();", false);
		}
	}
}

function cb_showOverview(){
	showOverviewDocument("generateOverview();", false);
	setTimeout(goFullscreen, 100);
}


function goFullscreen(){
	if (isFullscreen())
		window.fullScreen = fullscreen;
		
}


function button_slideshow(){
	if (slideshowRunning){
		stopSlideshow(false, true);
	}
	else{
		init();
		slideshowPause = false;
		slideTimeout = false;
		clearTimeout(Timeout_nextSlide);
		url = window.content.document.location.href;	
						
		slideshowContent = window.content;
		slideshowContent.stop();
		debug("autoslideshow: " + slideshowContent.location);
		orgframe = copyFrame(slideshowContent);
		_title = window.content.document.title;
		
		
		showSlideshowDocument("loadImages(true);", true);
	}
}

function loadImages(slideshow){
	slideshowRunning = true;
	slideshowPause = true;
	setButtonChecked("AutoSlideshow-Button", true);
	slideshowDocument = window.content.document;
	enabledControl(2);
	
	// hide menubar ?
	if (!osmenu && slideshowDocument.getElementById('menubar')){
		slideshowDocument.getElementById('menubar').style.display = "none";
	}
	
	var failed = function(){
		showNoImagesFoundMessage();
		setTimeout(stopSlideshow,100,true,false);
		window.content.history.back();
	}
	var success;
	if (slideshow){
		// slideshow
		success = function(){
			// alert("success: " + images.length);
			showSlideShow();
		}
	}else{
		// overview
		success = function(){
			cb_showOverview();
			showImageCount();
			var cmdSaveAll = document.getElementById("AutoSlideshow_cmd_saveAll");
			cmdSaveAll.setAttribute('disabled', false);
		}
	}
	var urlbar = document.getElementById("urlbar");
	urlbar.value="AutoSlideshow: " + _title;
	window.content.document.title = "AutoSlideshow: " + _title;
	
	if (url == lastUrl && images && images.length > 0 && lastFrame.frames.length == 0){
		// same page again, but maybe content in frames has changed
		// TODO check frames
		// alert("again! " + images.length);
		debug("AutoSlideshow: reopen\n");
		debug("AutoSlideshow: " + images.length + " images.\n");
		success();
	}else{
		// new page, find images
		images = null;
		showStatus();
		findImages(scannedtabs, url, orgframe, success, failed);
	}
}

function textbox_changeimage(){
	var text = document.getElementById("AutoSlideshow-Textbox-ImageNumber");
	var value = Number(text.value) - 1;
	if (value >= 0 && value < images.length){
		document.getElementById("AutoSlideshow-Button-Pause").checked = true;
		slideshowPause = true;
		clearTimeout(Timeout_nextSlide);
		showImage(value, false, false);
	}
}


function button_togglePauseSlideshow(){
	if (slideshowRunning){
		if (slideshowPause){
			slideshowPause = false;
			slideTimeout = false;
			enabledControl(1);
			showStatus();
			// peload the next image
			if (index >= images.length-1){
				setTimeout(slideshowFinished, slideshowDelay/2.);
				showStatus();
			}
			// set the timeout for the current image
			timeout_Continue = setTimeout(slide_timeout, slideshowDelay/2.);
			
			setButtonChecked("AutoSlideshow-Button-Pause", false);
			
			var buttonplay = slideshowDocument.getElementById("play");
			buttonplay.src = "chrome://autoslideshow/skin/OSPause.gif";		
		}
		else{
			pauseSlideshow();
		}
	}
}

function button_toggleToolbar(){
	
	var toolbar = document.getElementById("AutoSlideshow-Toolbar");

    toolbar.collapsed = !toolbar.collapsed;

    document.persist("AutoSlideshow-Toolbar", "collapsed");
}

// enables or disabled the buttons (pause,next,prev) and the textfield
function enabledControl(mode){
	var cmdPause = document.getElementById("AutoSlideshow_cmd_togglePauseSlideshow");
	var cmdNext = document.getElementById("AutoSlideshow_cmd_next");
	var cmdPrev = document.getElementById("AutoSlideshow_cmd_prev");
	var cmdFirst = document.getElementById("AutoSlideshow_cmd_first");
	var cmdLast = document.getElementById("AutoSlideshow_cmd_last");


	var textNumber = document.getElementById("AutoSlideshow-Textbox-ImageNumber");
	var labelNumber = document.getElementById("AutoSlideshow-Label-ImageCount");
	
	if (slideshowDocument){
		var play = slideshowDocument.getElementById("play");
		var prev = slideshowDocument.getElementById("prev");
		var next = slideshowDocument.getElementById("next");
		var overview = slideshowDocument.getElementById("overview");
		var save = slideshowDocument.getElementById("save");
	}
	
	switch(mode){
		// disabled
		case 0:
			controlEnabled = false;
			cmdPause.setAttribute('disabled', true);
			cmdNext.setAttribute('disabled', true);
			cmdPrev.setAttribute('disabled', true);
			cmdFirst.setAttribute('disabled', true);
			cmdLast.setAttribute('disabled', true);

			if (textNumber)
				textNumber.disabled=true;
			if (labelNumber)
				labelNumber.disabled=true;
			
			break;
		// all enabled
		case 1:
			controlEnabled = true;
			cmdPause.setAttribute('disabled', false);
			
			if (images!=null){
				if(index<images.length-1)
					cmdNext.setAttribute('disabled', false);
				else
					cmdNext.setAttribute('disabled', true);
				if (index>0)
					cmdPrev.setAttribute('disabled', false);
				else
					cmdPrev.setAttribute('disabled', true);
			}
			
			cmdFirst.setAttribute('disabled', false);
			cmdLast.setAttribute('disabled', false);

			if (textNumber)
				textNumber.disabled=false;
			if (labelNumber)
				labelNumber.disabled=false;
			
			if (play){
				play.className = "button";
				if (images!=null){
					if(index<images.length-1){
						next.className = "button";
						if (next.style.opacity == 0.2)
							next.style.opacity = 0.5;
					}
					else{
						next.className = "button_disabled";
						next.style.opacity = 0.2;
					}
					if (index>0){
						prev.className = "button";
						if (prev.style.opacity == 0.2)
							prev.style.opacity = 0.5;
					}
					else{
						prev.className = "button_disabled";
						prev.style.opacity = 0.2;
					}
					
				}
				overview.className = "button";
				save.className = "button";
			}
			
			break;		
		// load images (start)
		case 2:
			controlEnabled = false;
			cmdPause.setAttribute('disabled', true);
			cmdNext.setAttribute('disabled', true);
			cmdPrev.setAttribute('disabled', true);
			cmdFirst.setAttribute('disabled', true);
			cmdLast.setAttribute('disabled', true);

			if (textNumber)
				textNumber.disabled=true;
			if (labelNumber)
				labelNumber.disabled=true;
			
			if (play){
				play.className = "button_disabled";
				prev.className = "button_disabled";
				next.className = "button_disabled";
				overview.className = "button_disabled";
				save.className = "button_disabled";
			}
			
			break;
	}

}



// original page
var orgframe;
var url; 
var orgDocument;
var lastUrl; // url of last slideshow
var lastFrame;
var _title; // title of slideshow
//
var checkURL = true;
var registered = false;
var Timeout_nextSlide = 0;
var timeout_Continue = 0;
var timeout_showSlide = 0;
var timeout_stopSlideshow = 0;
var timeout_clear = 0;
var xmlhttp = null;

var images;
var enabledImagesLength = 0;

var thumbbar_index = 0;

var slideshowDocument = null; 
var slideshowContent = null; //  = browser window
var slideshowRunning=false;
var slideshowPause=false;
var slideshowDelay = 5000;
var slideshowPauseDelay = 200;
var slideshowFadeInTime = 500;
var slideshowFadeOutTime = 500;
var slideshowFinishedAction;
var slideshowEffectsEnabled;
var slideshowEffect;
var zoomEnabled;
var zoomMax = 1; // maximal zoom, negative value = unlimited
var imageSelectionLinks;
var imageSelectionImages;
var imageSelectionImagesMinWidth;
var imageSelectionImagesMinHeight;
var overviewThumbSize = 80;
var osmenu;
var scannedtabs;

var thumbbar = new Thumbbar();


var bgColor="#000000";

var controlEnabled;
var overview;
var fullscreen;
var wasFullScreen;


function registerListener(){
	window.onresize = updateSize;
	window.addEventListener("click",onMouseClick,true);
	window.addEventListener("keydown",onKeyDown,true);
	window.addEventListener("resize", onResize,true);
	if (!registered)
	{
		window.getBrowser().addProgressListener(slideshowListener , Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);	
		registered = true;
	}
}



function unregisterListener(){
	registered = false;
	window.removeEventListener("click",onMouseClick,true);
	window.removeEventListener("keydown",onKeyDown,true);
	window.removeEventListener("resize", onResize,true);
	window.getBrowser().removeProgressListener(slideshowListener);
}


var callback_afterload=null;
var callback_afterstart=null;

var slideshowListener = {
	QueryInterface: function(aIID){
		if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
			aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
			aIID.equals(Components.interfaces.nsISupports))
				return this;
		throw Components.results.NS_NOINTERFACE;
	},

	onLocationChange: function(aProgress, aRequest, aURI){
		// This fires when the location bar changes i.e load event is confirmed
		// or when the user switches tabs
		check();
		return 0;
	},

	onStateChange: function(aProgress, aRequest, aFlag, aStatus){
		const nsIWebProgressListener = Components.interfaces.nsIWebProgressListener;
	    const nsIChannel = Components.interfaces.nsIChannel;

		if (aFlag & (nsIWebProgressListener.STATE_IS_WINDOW|nsIWebProgressListener.STATE_STOP)){
			if (callback_afterload){
				setTimeout(callback_afterload, 350);
				callback_afterload = null;
			}
		}else if(aFlag & (nsIWebProgressListener.STATE_IS_WINDOW|nsIWebProgressListener.STATE_START)){
			if (callback_afterstart){
				setTimeout(callback_afterstart, 350);
				callback_afterstart = null;
			}

		}
		return 0;
	},
	onProgressChange : function (aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress)
	{
		return 0;
	},
	onStatusChange: function() {return 0;},
	onSecurityChange: function() {return 0;},
	onLinkIconAvailable: function() {return 0;}
}

function onMouseClick(e){
	if (slideshowRunning){
		// overview mode
		if (isOverview()){
			if (e.button==0){
				var id = e.originalTarget.id;
				debug("clicked element id: " + e.originalTarget.id + "\n");
				if (id == "play"){
					var nextIndex = getNextIndex(-1);
					if (nextIndex < images.length){
						index = nextIndex;	
						index_enabled = 0;
						button_overview();
						setTimeout(button_togglePauseSlideshow, 500);
						if (!slideshowPause){
						//	ssdFadeOut("menubar", 500, slideshowDocument);
						}
					}
				}
				else if (id == "close"){
					stopSlideshow(true, true);
				}
				else if (id == "save"){
					window.openDialog("chrome://AutoSlideshow/content/saveall.xul", "", "chrome,titlebar,toolbar,close,modal", 
							images, -1);
				}else if (id == "toggleDisabledImages"){
					toggleDisabledImages();
					if (showDeletedThumbs)
						e.originalTarget.src='../skin/OSFilter.gif';
					else
						e.originalTarget.src='../skin/OSFilterActive.gif';
				}else if (id == "find_more_images"){
					var num = images.length;
					debug(" num: " + images.length);
					oldImageCount = num;
					findNextImages(images, updateOverview);
					debug(" num: " + images.length);
					//var content = slideshowDocument.getElementById("thumb_content");
					//debug(" content: " + content);
					//createThumbBoxes(num, 20, -1, true);
					//loadThumbs(num, 20);
				}
				else if (startsWith(e.originalTarget.id, 'thumb_delete_button_')){
					selectedImage = parseInt(e.originalTarget.id.substr(20));
					if (!isNaN(selectedImage)){
						if (images[selectedImage].enabled){
							images[selectedImage].enabled = false;
							enabledImagesLength--;
						}else{
							images[selectedImage].enabled = true;
							enabledImagesLength++;
						}
						refreshThumb(selectedImage);
						showImageCount();
						//removeImage(selectedImage);
						//removeThumb(selectedImage);
					}
				}
				else if (startsWith(e.originalTarget.id, 'thumb_box_') 
			    || startsWith(e.originalTarget.id, 'thumb_img_')){
					selectedImage = parseInt(e.originalTarget.id.substr(10));
					if (!isNaN(selectedImage)){
						if (images[selectedImage].enabled){
							debug("clicked on thumbnail\n");
							enabledControl(0);
							stopOverview();
							setButtonChecked("AutoSlideshow-Button-Pause", true);
							checkURL = false;
							showSlideshowDocument("gotoSelectedImage();", false);
							
							setButtonChecked("AutoSlideshow-Button-Overview", false);
							showStatus();
						}
					}
			    }
			}
		}
		// slideshow mode
		else{
			var id = e.originalTarget.id;
			if (isControlEnabled()){
				if (e.button==0){
				 	if (id == "slideshowImage" || id == "body" || id == "next"){
				 		var nextIndex = getNextIndex(index);
				 		debug("nextIndex: "+nextIndex);
						if (nextIndex < images.length){
							gotoImage(nextIndex);
							index_enabled++;
						}else{
							slideshowFinished();
						}
						return;
					}
					else if (id == "play"){
						button_togglePauseSlideshow();
						if (!slideshowPause){
							ssdFadeOut("menubar", 500, slideshowDocument);
						}
						return;
					}
					else if (id == "prev"){
						var prevIndex = getPrevIndex(index);
						if (prevIndex >= 0){
							gotoImage(prevIndex);
							index_enabled--;
						}
						return;
					}
					else if (id == "overview"){
						button_overview();
						return;
					}
					else if (id == "save"){
						if (!slideshowPause)
							button_togglePauseSlideshow();
						window.openDialog("chrome://AutoSlideshow/content/saveall.xul", "", "chrome,titlebar,toolbar,close,modal", 
							images, index);
						return;						
					}else if (e.originalTarget.id == 'thumbbar_nav_back_button'
						|| e.originalTarget.id == 'thumbbar_nav_back_button_img') {
						pauseSlideshow();
						thumbbar.moveBackward();
				    }else if (e.originalTarget.id == 'thumbbar_nav_forward_button'
				    	|| e.originalTarget.id == 'thumbbar_nav_forward_button_img') {
				    	pauseSlideshow();
				    	
				    	if (thumbbar.isLastItem()){
				    		findNextImages(images, showImageCount);
				    	}
				    	thumbbar.moveForward();
				    }
					else if (startsWith(e.originalTarget.id, 'thumb_box_') 
				    	|| startsWith(e.originalTarget.id, 'thumb_img_')){
				    	debug("clicked on thumbnail\n");			    	
						selectedImage = parseInt(e.originalTarget.id.substr(10));
						if (!isNaN(selectedImage)){
							pauseSlideshow();
							gotoSelectedImage();
						}
				    }
				}
				/*
				else if (e.button==2 &&((e.originalTarget.tagName == "TD") 
				    || (e.originalTarget.tagName == "IMG"))){
					if (index > 0){
						gotoImage(index - 1);
					}
				}
				*/
			}
			// close button always accessible
			if (id == "close"){
				stopSlideshow(true, true);	
			}
		}
	}
}

function onKeyDown(e){
	if (slideshowRunning && e.keyCode == 27){
		debug("escape");
		setTimeout("window.content.history.back()", 100);
	}
}

function onKeyPress(e){
	switch(e.keyCode){
		// escape
		case 27:
		
		break;
		// space
		case 32:
		
		break;
		// 	left arrow
		case 37:
		
		break;
		
		// right arrow	
		case 39:
		
		break;
		
		
	}
}



// called after the location has changed
function check(){
	if (checkURL){
		// document has changed, stop the slideshow
		if (slideshowRunning && slideshowDocument != window.content.document){
			// go back in history?
			var goBack = slideshowContent != window.content;	
			stopSlideshow(true, goBack);
		}
	}
}




function gotoImage(idx){
	if (slideshowRunning){
		pauseSlideshow();
		showImage(idx, false, false);
	}
}


// load the image with the specified index, updates the displayed index, updates size
function showImage(idx, clear, fadein){
	thumbbar.showItem(idx);
	
	if (idx == images.length-1){
		findNextImages(images, showImageCount);
	}
	
	clearTimeout(Timeout_nextSlide);
	clearTimeout(timeout_Continue);
	clearTimeout(timeout_showSlide);
	clearTimeout(timeout_stopSlideshow);

	imageLoaded=false;
	index = idx;
	showStatus();
	enabledControl(0);
	slideshowDocument = slideshowContent.document;
	
	if (!images[idx].isLoaded()){
		slideshowImage.src = 'chrome://autoslideshow/skin/loading.gif';
		slideshowImage.width = 100;
		slideshowImage.height = 100;
		center();
	}
	else{
		slideshowImage.src = 'chrome://autoslideshow/skin/clear.gif';
	}


	if (images[index].isLoaded()){
		setTimeout(showImageCallback,100, idx, fadein);
	}
	else if (images[index].isLoading()){
		images[index].setOnload("showImageCallback(" + idx + "," + fadein + ")");
		images[index].setOnerror("showImageFailed(" + idx +")");
	}
	else{
		images[index].loadImage("showImageCallback(" + idx + "," + fadein + ")", "showImageFailed(" + idx + ")");
	}
}
// callback function of showImage(idx)
function showImageCallback(idx, doFadein){	
	slideshowImage.style.opacity = 0; //src = 'chrome://autoslideshow/skin/clear.gif';
	setTimeout(updateSize, 10);
	imageLoaded=true;
	slideshowImage.title = images[idx].getImgsrc();
	showIndex();
	showImageCount();
	showStatus();
	
	
	enabledControl(1);
	setTimeout(setImage, 100, doFadein);
	// preload next image
	if (index < images.length - 1){
		preloadImage(index+1);
		showStatus();
	}
}

function setImage(doFadein){
	if (false){
		slideshowPause = false;
		changeOpac(0);
		slideshowImage.src = images[index].getImgsrc();
		fadein();
	}
	else{
		slideshowImage.src = images[index].getImgsrc();
		slideshowImage.width = images[index].width;
		slideshowImage.height = images[index].height;
		slideshowImage.style.opacity = 1;
		resetFade();
	}
	
}

// callback function of showImage(idx)
function showImageFailed(idx){
	if (slideshowRunning){
		images.splice(idx,1);
		showImageCount();
		enabledControl(1);
		if (idx >= images.length){
			index = images.length-1;
			showIndex();
			// no images available, stop
			if (images.length == 0){
				showNoImagesFoundMessage();
				stopSlideshow(true, true);
				return;
			}
		}
		showImage(index, true, false);
	}
}

function preloadImage(idx){
	imageLoaded = false;
	if (!images[idx].isLoaded()){
		images[idx].loadImage("image_loaded()", "image_err()");
	}
	 else{
		image_loaded();
	}
}

// displays the current index
function showIndex(){
	var text = document.getElementById("AutoSlideshow-Textbox-ImageNumber");
	if (text){
		if (index < 0)
			text.value = "";
		else
			text.value="" + (index_enabled+1);
	}
	if (slideshowDocument){
		var ol = slideshowDocument.getElementById("imagenumber");	
		if (ol){
			ol.firstChild.data = (index_enabled+1);
		}
	}
}

// displays the total number of images in this slideshow
function showImageCount(){
	var l = document.getElementById("AutoSlideshow-Label-ImageCount");
	if (l){
		if (!slideshowRunning || images==null){
			l.value=" / - ";
		}
		else{
			l.value=" / " + enabledImagesLength;
		}
	}
	if (slideshowDocument){
		var ol = slideshowDocument.getElementById("imagecount");	
		if (ol && images)
			var txt = "" + enabledImagesLength;
			if (txt.length<2)
				txt = "0" + txt;
			ol.firstChild.data = txt;
	}
}

function showNoImagesFoundMessage(){
	var message=autoslidestrings.GetStringFromName("NoImageLinkFound");
	alert(message);
}

function showStatus(){
	if (images == null){
			slideshowContent.status = "AutoSlideshow: " + autoslidestrings.GetStringFromName("collecting");
	}
	else if (slideshowRunning){
		var status;
		status = (imageLoaded?"": (" " + autoslidestrings.GetStringFromName("loading")));
		var idx = index;
		if (idx < 0) idx = 0;
		var name;
		if (images[idx])
			name = getFilename(images[idx].getImgsrc());
		else
			name = "";
		slideshowContent.status = "AutoSlideshow: " + 
			name + 
			(slideshowPause?" "+autoslidestrings.GetStringFromName("pause"):"") + status;
	}else{
		slideshowContent.status = "AutoSlideshow: " + 
			autoslidestrings.GetStringFromName("loading");
	}
}

// fits the image size to the available size
function updateSize(){
	if (slideshowDocument == null)
		return;

	// overview mode
	if (isOverview()){

	}
	// single image mode
	else if (images != null){
		var img = images[index];
		if (img != null){
			//alert("updata size: " + image.width + ", " + image.height);
			// get image size
			var imageW = img.width;
			var imageH = img.height;
			// get available size
			var innerW = slideshowDocument.body.clientWidth - 10;
			var innerH = slideshowDocument.body.clientHeight - 10;
	
			var scaledWidth;
			var scaledHeight;
			if (imageW < innerW && imageH < innerH && !zoomEnabled)
			{
				// no scaling
				scaledWidth = imageW;
				scaledHeight = imageH;
			}
			else{
				// get scale
				var scaledW = innerW / imageW;
				var scaledH = innerH / imageH;
				var scale = Math.min(scaledW, scaledH);
				// don't scale more than zoomMax
				if (zoomMax >= 0){
					if (scale > zoomMax)
						scale = zoomMax;
				}
				scaledWidth = imageW * scale;
				scaledHeight = imageH * scale;
			}
			// set size
			slideshowImage.width = scaledWidth;
			slideshowImage.height = scaledHeight;
		}
		center();
	}
}

function center(){
	if (slideshowDocument == null)
		return;
	if (slideshowImage){
		var o = slideshowImage;
		var tw = slideshowDocument.body.clientWidth;
		var th = slideshowDocument.body.clientHeight;
		o.style.left = ((tw - o.width) /2) + "px";
		o.style.top = ((th - o.height) /2) + "px";
	}
}


// stop the slide show
function stopSlideshow(uncheckButton, goBack){
	
	debug("AutoSlideshow: exit\n\n");
	
	if (numtabs == 1){
		lastUrl = url; // save slideshow
		lastFrame = orgframe;
	}else{
		lastUrl = null;
		lastFrame = null;
	}
	
	abortRequests();
	
	window.content.status = "";
	clearTimeout(Timeout_nextSlide);
	clearTimeout(timeout_stopSlideshow);
	enabledControl(0);
	
	setButtonChecked("AutoSlideshow-Button-Overview", false);
	setButtonChecked("AutoSlideshow-Button-Pause", false);
			

	//var cmdOverview = document.getElementById("AutoSlideshow_cmd_overview");
	//cmdOverview.setAttribute('disabled', true);
	
	var cmdSaveAll = document.getElementById("AutoSlideshow_cmd_saveAll");
	cmdSaveAll.setAttribute('disabled', true);

	setButtonChecked("AutoSlideshow-Button", false);
	
	
	if (slideshowRunning){
		slideshowPause = false;
		if (goBack){
			try{
			if (slideshowContent != null && slideshowContent.history != null && slideshowContent.history.length>0){	
				slideshowContent.history.back();
			}
			}catch(e){}
		}
		index = -1;
		showIndex();
		showImageCount();
	}
	slideshowRunning = false;
	unregisterListener();
	debug("wasFullScreen: " + wasFullScreen);
	window.fullScreen = wasFullScreen;
	debug("window.fullScreen: " + window.fullScreen);
	initFullscreen(window.fullScreen);
}



function onResize(){
	initFullscreen(window.fullScreen);
}

function initFullscreen(fullscreen){
	if (fullscreen){
		document.getElementById("navigator-toolbox").setAttribute("hidden", true);
		//getBrowser().mStrip.setAttribute("hidden", true);
	}else{
		var tbVisible = toolbars["navigator-toolbox"];
		//var tabbarVisible = toolbars["tabbar"];
		document.getElementById("navigator-toolbox").setAttribute("hidden", tbVisible);
		//getBrowser().mStrip.setAttribute("hidden", tabbarVisible);
	}
}


function isControlEnabled(){
	return controlEnabled;
}


function isFullscreen(){
	return fullscreen;
}

function isOverview(){
	debug("overview: " + overview);
	return overview;	
}

function removeImage(index){
	images.splice(index,1);
}