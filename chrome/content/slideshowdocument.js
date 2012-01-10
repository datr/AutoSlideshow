var gBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
var autoslidestrings = gBundle.createBundle("chrome://autoslideshow/locale/autoslideshow.properties");

function ssdInit(){
	var m = document.getElementById('menubar');
	xb.addEvent(m, 'mouseenter', ssdMenuEnter, false);
	xb.addEvent(m, 'mouseleave', ssdMenuOut, false);
	
	var t = document.getElementById('thumbbar');
	xb.addEvent(t, 'mouseenter', ssdThumbbarEnter, false);
	xb.addEvent(t, 'mouseleave', ssdThumbbarOut, false);

	window.onresize = ssdWindowResize;
	
	document.getElementById("next").title = autoslidestrings.GetStringFromName("buttonNextImage");
	document.getElementById("prev").title = autoslidestrings.GetStringFromName("buttonPrevImage");
	document.getElementById("save").title = autoslidestrings.GetStringFromName("buttonSaveImage");
	var b = document.getElementById("toggleDisabledImages");
	if (b)
		b.title = autoslidestrings.GetStringFromName("buttonToggleDisabledImages");
	document.getElementById("play").title = autoslidestrings.GetStringFromName("buttonPlay");
	document.getElementById("close").title = autoslidestrings.GetStringFromName("buttonClose");
	b = document.getElementById("overview");
	if (b)
		b.title = autoslidestrings.GetStringFromName("buttonOverview");

}

function ssdClose(){
	window.clearInterval(interval);
}

function ssdWindowResize(e){
	ssdCenter('slideshowImage');
}

function ssdMenuEnter(){
	ssdFadeIn('menubar', 500);
}

function ssdMenuOut(){
	if (document.getElementById('menubar').style.opacity > 0)
		ssdFadeOut('menubar', 500);
}

function ssdThumbbarEnter(){
	document.getElementById('thumbbar').style.opacity = 1;
	// ssdFadeIn('thumbbar', 500);
}

function ssdThumbbarOut(){
	document.getElementById('thumbbar').style.opacity = 0;
	/*
	if (document.getElementById('thumbbar').style.opacity > 0)
		ssdFadeOut('thumbbar', 500);
	*/
}


function ssdCenter(id){
	var o;
	
	o = document.getElementById(id);
	
	var tw = document.body.clientWidth;
	var th = document.body.clientHeight;
	o.style.left = ((tw - o.width) /2) + "px";
	o.style.top = ((th - o.height) /2) + "px";
}


var interval;
function ssdFadeOut(id, time, doc) {
	if (!doc)
		doc = document;
	obj = doc.getElementById(id);
	obj.style.opacity = 1;
    var steptime = 20;
	var opacStep = 2 * (-100) * steptime / time;
	window.clearInterval(interval);
	interval = window.setInterval("ssdChangeOpac(" + opacStep + ", " + 0 + ")", steptime);
}

function ssdFadeIn(id, time, doc) {
	if (!doc)
		doc = document;	
	obj = doc.getElementById(id);
	obj.style.opacity = 0;
    var steptime = 20;//Math.round(time / 100);
	var opacStep = 2* (100) * steptime / time;
	window.clearInterval(interval);
	interval = window.setInterval("ssdChangeOpac(" + opacStep + ", " + 0 + ")", steptime);
}

function ssdChangeOpac(dopacity, finalOpacity) {
	obj.style.opacity = Math.min(1,Math.max(0, (obj.style.opacity * 100 + dopacity) / 100));
	if (obj.style.opacity == 0 || obj.style.opacity == 1){
		window.clearInterval(interval);
	}
}