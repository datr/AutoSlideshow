function LTrim( value ) {
	
	var re = /\s*((\S+\s*)*)/;
	return value.replace(re, "$1");
	
}

// Removes ending whitespaces
function RTrim( value ) {
	
	var re = /((\s*\S+)*)\s*/;
	return value.replace(re, "$1");
	
}

// Removes leading and ending whitespaces
function trim( value ) {
	
	return LTrim(RTrim(value));
	
}

function startsWith(string, prefix){
	
	var result = (string.substr(0,prefix.length) == prefix);
	debug("startWith: " + string.substr(0,prefix.length) + " - " + prefix + " -> " + result + "\n");
	return result;
}

function isJpg(filename){
	var r = filename.match(/\.jpe?g$/i);
	if (r) return true;
	return false;
}

function isImage(filename){
	var r = filename.match(/\.jpe?g$/i);
	if (r) return true;
	r = filename.match(/\.png$/i);
	if (r) return true;
	r = filename.match(/\.gif$/i);
	if (r) return true;
	return false;
}

// everything like "/xyz", "xyz.html",...
function isWebpage(filename){
	var r = filename.match(/\/[^\.]*$/i);
	if (r) return true;
	r = filename.match(/\.html?/i);
	if (r) return true;
	r = filename.match(/\.php?/i);
	if (r) return true;
	r = filename.match(/\.jsp?/i);
	if (r) return true;
	r = filename.match(/\.asp?/i);
	if (r) return true;
	return false;
}

/*
 * Holds the data of a frameset or a window
 */
function Myframe(_document, _frames, _host){
	this.document = _document;
	this.frames = _frames;
	this.host = _host;
}

/*
 * Copies frameset or window into a Myframe.
 */
function copyFrame(srcframe){
	var myframe;
	var myframes;
	var doc;
	debug("copyFrame: " + srcframe);
	debug(srcframe.location);
	debug(srcframe.document.URL);
	try{
		var host = srcframe.location.host;
		
		// frames?
		if (srcframe.frames){
			myframes = new Array();
			for (var i = 0; i < srcframe.frames.length; i++){
				var myframe1 = copyFrame(srcframe.frames[i]);	
				if (myframe1)
					myframes.push(myframe1)
			}
		}
		
		// document
		doc = srcframe.document.implementation.createDocument('','',null);
		doc.URL = srcframe.document.URL;
		
		var children = srcframe.document.childNodes;
		for (var i = 0; i < children.length; i++){
			var element = children[i];
			// firefox2
			//var dup = element.cloneNode(true);
			// firefox 3
			try{
				var dup = doc.importNode(element, true);
				doc.appendChild(dup);
			}catch(e){
			}
		}
		
		
		if (srcframe.document.links){
			var links = new Array();
			for (var i = 0; i < srcframe.document.links.length; i++)
				links.push(srcframe.document.links[i])
			doc.links = links;
		}
		if (srcframe.document.images){
			var images = new Array();
			for (var i = 0; i < srcframe.document.images.length; i++)
				images.push(srcframe.document.images[i])
			doc.images = images;
		}
		
		
		debug(srcframe.location);
		debug(host);
		myframe = new Myframe(doc, myframes, host);
		return myframe;
	}catch (e){
		debug(e);
		return null;
	}
}


function PageLink(_url, _thumb){
	this.url = _url;
	this.thumb = _thumb;
}

function getFilename(url){
	var x = "" + url;
	var pos = x.lastIndexOf("/");
	return x.substring(pos+1);
}


function debug(info){
	// window.dump(info + "\n");	
}

function setButtonChecked(buttonId, checked){
	var button = document.getElementById(buttonId);
	if (button)
		button.checked = checked;
}
