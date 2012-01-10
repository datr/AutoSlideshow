function GoogleImageFinder(){
	
	var self = this;
	var maxLimit;
	var ipp;
	var current_pagenr;
	var last_pagenr;
	var doc;
	
	this.multiPage = true;
	
	this.checkPage = function(_document, asimages){
		if (_document.URL.indexOf("images.google.") < 0)
		return false;
	
		debug("AutoSlideshow: findImages: google images - mode");
		
		self.doc = _document;
	
		// what page are we?
		var navbar = self.doc.getElementById("navbar");
		debug(navbar);
		if (navbar){
			var pos = navbar.innerHTML.indexOf("class=\"i\"") + 10;
			var pos2 = navbar.innerHTML.indexOf("<", pos);
			self.current_pagenr = parseInt(navbar.innerHTML.substr(pos, pos2-pos));
		}else{
			self.current_pagenr = 1;	
		}
		debug("current page: " + self.current_pagenr);
		
		
		// max number of images?
		var maxLimitElement = self.doc.getElementById("maxLimit");
		self.maxLimit = parseInt(maxLimitElement.innerHTML.replace(/\./g, ""));
		debug("maxLimit: " + self.maxLimit);
		
		// number of images per page
		var lowerLimitElement = self.doc.getElementById("lowerLimit");
		var lowerLimit = parseInt(lowerLimitElement.innerHTML.replace(/\./g, "")); 
		debug("lowerLimit: " + lowerLimit);
		
		var upperLimitElement = self.doc.getElementById("upperLimit");
		var upperLimit = parseInt(upperLimitElement.innerHTML.replace(/\./g, "")); 
		debug("upperLimit: " + upperLimit);
		
		if (self.current_pagenr == 1)
			self.ipp = upperLimit - (lowerLimit-1);
		else
			self.ipp = (lowerLimit-1) / (self.current_pagenr-1);
		debug("ipp: " + self.ipp)
			 	
		var scripts = self.doc.getElementsByTagName("script");
	
		debug("AutoSlideshow: findImages: scripts.length: " + scripts.length);
		
		
		/*
		 * get images on current page
		 */
		for (var i = 0; i < scripts.length; i++){
			var text = scripts[i].text;
			self.parseScriptBlock(text, asimages);
		}
		self.last_pagenr = self.current_pagenr;

		debug("AutoSlideshow: findImages: imagecount: " + asimages.length);
		if (asimages.length > 0){
			return true;
		}
		return false;
	}
	
	this.addNextPage = function(asimages, funct){
		debug("addNextPage()");
		debug("last_pagenr = " + self.last_pagenr);
		self.addPage(self.last_pagenr+1, asimages, funct);
	}
	
	this.addPage = function(pagenr, asimages, funct){
		debug("addPage(" + pagenr + ")");
		debug("last_pagenr = " + self.last_pagenr); 
		if (pagenr > self.last_pagenr){
			var startimage = self.ipp*(pagenr-1) + 1;
			// alert(startimage + " - " + maxLimit);
			if (startimage > self.maxLimit)
				return;
			this.checkImagesLinks(self.doc.URL + "&start=" + startimage, asimages, funct);
			self.last_pagenr = pagenr;
		}
	}
	
	this.checkImagesLinks = function(url, asimages, funct){	
		var link = url;
		debug(link);
		
		var xmlhttp1 = new XMLHttpRequest();
		requests.push(xmlhttp1);
				
		xmlhttp1.onload = function(){
			if (slideshowRunning){
				retrievedPagesCount++;
				self.parsePage(link, xmlhttp1, asimages, funct);
			}
		}
		xmlhttp1.onerror = function(){
			retrievedPagesCount++;
		}
		xmlhttp1.open('GET', link);
		xmlhttp1.send(null);
	}
	
	this.parsePage = function(link, request, asimages, funct){
		debug("retrieved page: " + link);
		var doc = request.responseText;
		
		var scriptpos = doc.indexOf("<script>");
		var scripttext = doc.substr(scriptpos);
		
		self.parseScriptBlock(scripttext, asimages);
		
		if (funct)
			funct();
	}
	
	this.parseScriptBlock = function(scripttext, asimages){
		var pos = 0;
		var pos2 = 0;
		var count = 0;
		while(count < self.ipp){
			// find start of dyn.Img(
			pos = scripttext.indexOf("dyn.Img(", pos2);
			if (pos < 0)
				break;
			// find end of dyn.Img
			pos2 = scripttext.indexOf(");", pos);
			// get image
			var t = scripttext.substring(pos,pos2);
			var parts = t.split("\",");
			var imgSrc = parts[3].substring(1,parts[3].length);
			imgSrc = decodeURL1(imgSrc);
	
			if (isImage(imgSrc)){
				var thumb = parts[14].substring(1,parts[14].length) + "?q=tbn:" + parts[2].substring(1,parts[2].length) + parts[3].substring(1,parts[3].length);
				debug("google thumbnail: " + thumb);
				var asimage = new ASImage(imgSrc, thumb);
				// debug("thumbnail: " + thumb);
				// debug("fullsize: " + imgSrc);
				var descr = parts[6].substring(1,parts[6].length-1);
				descr = descr.replace(/<b>/g, "");
				descr = descr.replace(/<\/b>/g, "");
				asimage.description = descr;
				addImage(asimages, asimage);
				count++;
			}else{
				debug("!!! no image??? : " + imgSrc);
			}
		}
	}

}