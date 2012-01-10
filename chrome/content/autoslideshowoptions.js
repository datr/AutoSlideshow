// Localizing some strings
var gBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
var autoslidestrings = gBundle.createBundle("chrome://autoslideshow/locale/autoslideshow.properties");


var prefs;

var textDelay;
var radioGroupSlideshowEnd;
var checkEffectsEnabled;
var menulistEffects;
var checkLinkedImages;
var radioGroupImages;
var textImagesMinWidth;
var textImagesMinHeight;
var checkZoom;
var menulistZoomMax;
var textThumbsSize;
var checkFullscreen;
var textMaxgap;
var checkOsmenu;
var menulistScannedTabs;

function init(){
//	var dialog = window;
//	window.resizeTo(600,600);
//	alert(window.outerWidth);

	textDelay = document.getElementById("AutoSlideshow-Textbox-Delay");
	radioGroupSlideshowEnd = document.getElementById("AutoSlideshow-Radiogroup-SlideshowEnd");
	checkEffectsEnabled = document.getElementById("AutoSlideshow-check-effects");
	menulistEffects = document.getElementById("AutoSlideshow-Menulist-effects");
	checkZoom = document.getElementById("AutoSlideshow-check-zoom");
	menulistZoomMax = document.getElementById("AutoSlideshow-Menulist-zoomMax");	
	checkFullscreen = document.getElementById("AutoSlideshow-check-fullscreen");
	menulistScannedTabs = document.getElementById("AutoSlideshow-Menulist-scannedTabs");
	
	//
	//checkLinkedImages = document.getElementById("AutoSlideshow-check-linkedImages");
	textMaxgap = document.getElementById("AutoSlideshow-text-maxgap");
	radioGroupImages = document.getElementById("Autoslideshow-Radiogroup-images");
	textImagesMinWidth = document.getElementById("AutoSlideshow-text-imagesMinWidth");
	textImagesMinHeight = document.getElementById("AutoSlideshow-text-imagesMinHeight");
	//
	textThumbsSize = document.getElementById("AutoSlideshow-text-thumbsSize");
	checkOsmenu = document.getElementById("AutoSlideshow-check-osmenu");

	prefs = Components.classes["@mozilla.org/preferences-service;1"]
                                .getService(Components.interfaces.nsIPrefService).getBranch("extensions.AutoSlideshow.");

	textDelay.value = prefs.getIntPref("slideshowDelay");

	switch (prefs.getCharPref("slideshowFinishedAction"))
	{
	case "end":
		radioGroupSlideshowEnd.selectedIndex = 0; break;
	case "restart":
		radioGroupSlideshowEnd.selectedIndex = 1; break;
	case "pause":
		radioGroupSlideshowEnd.selectedIndex = 2; break;
	case "overview":
		radioGroupSlideshowEnd.selectedIndex = 3; break;
	default:
		radioGroupSlideshowEnd.selectedIndex = 0;
	}

	checkFullscreen.checked = prefs.getIntPref("startMode") == 1;
	checkEffectsEnabled.checked = prefs.getBoolPref("slideshowEffectsEnabled");
	menulistEffects.selectedIndex = prefs.getIntPref("slideshowEffect");
	checkZoom.checked = prefs.getBoolPref("zoom");
	menulistZoomMax.selectedIndex = prefs.getIntPref("zoomMax");
	menulistScannedTabs.selectedIndex = prefs.getIntPref("scannedtabs");

//checkLinkedImages.checked = prefs.getBoolPref("imageSelection.links");
	switch (prefs.getCharPref("imageSelection.images"))
	{
	case "never":
		radioGroupImages.selectedIndex = 0; break;
	case "always":
		radioGroupImages.selectedIndex = 1; break;
	case "ondemand":
		radioGroupImages.selectedIndex = 2; break;
	default:
		radioGroupImages.selectedIndex = 2; 
	}
	textImagesMinWidth.value = prefs.getIntPref("imageSelection.images.minWidth");
	textImagesMinHeight.value = prefs.getIntPref("imageSelection.images.minHeight");
	textMaxgap.value = prefs.getIntPref("imageSelection.maxgap");
	
	textThumbsSize.value = prefs.getIntPref("overview.thumbsize");
	checkOsmenu.checked = prefs.getBoolPref("osmenu");
}

function checkValues(){
	var delay = parseInt(textDelay.value);
	if (isNaN(delay) || delay < 0 || delay > 60)
	{
		alert(autoslidestrings.GetStringFromName("InsertCorrectValue"));
		return false;
	}
	var imageMinWidth = parseInt(textImagesMinWidth.value);
	var imageMinHeight = parseInt(textImagesMinHeight.value);
	if (isNaN(imageMinWidth) || isNaN(imageMinHeight) || imageMinWidth < 0 || imageMinHeight < 0){
		alert(autoslidestrings.GetStringFromName("InsertCorrectMinMaxValue"));
		return false;
	}

	var thumbsize = parseInt(textThumbsSize.value);
	if (isNaN(thumbsize) || thumbsize <= 0){
		alert(autoslidestrings.GetStringFromName("InsertCorrectThumbnailSize"));
		return false;
	}
	
	var maxgap = parseInt(textMaxgap.value);
	if (isNaN(maxgap) || maxgap < 0){
		alert(autoslidestrings.GetStringFromName("InsertCorrectGapValue"));
		return false;
	}
	
	return true;
}

function doOK(){
	if (checkValues())
		return save();
	return false;
}

function doCancel(){
	return true;
}

function save(){
	prefs.setIntPref("slideshowDelay", parseInt(textDelay.value));
	prefs.setCharPref("slideshowFinishedAction", radioGroupSlideshowEnd.selectedItem.value);
	prefs.setIntPref("startMode", (checkFullscreen.checked?1:0));
	prefs.setBoolPref("slideshowEffectsEnabled", checkEffectsEnabled.checked);
	prefs.setIntPref("slideshowEffect", menulistEffects.selectedIndex);
	prefs.setBoolPref("zoom", checkZoom.checked);
	prefs.setIntPref("zoomMax", menulistZoomMax.selectedIndex);
	//prefs.setBoolPref("imageSelection.links", checkLinkedImages.checked);
	prefs.setIntPref("imageSelection.maxgap", parseInt(textMaxgap.value));
	prefs.setCharPref("imageSelection.images", radioGroupImages.selectedItem.value);
	prefs.setIntPref("imageSelection.images.minWidth", parseInt(textImagesMinWidth.value));
	prefs.setIntPref("imageSelection.images.minHeight", parseInt(textImagesMinHeight.value));
	prefs.setIntPref("overview.thumbsize", parseInt(textThumbsSize.value));
	prefs.setBoolPref("osmenu", checkOsmenu.checked);
	prefs.setIntPref("scannedtabs", menulistScannedTabs.selectedIndex);

	return true;
}

function reset(){

}