function StudiVzImageFinder(){
	
	var self = this;
	var ipp;
	var current_pagenr;
	var last_pagenr;
	var doc;
	var maxPage;
	var url;
	var asimages;
	
	this.multiPage = true;
	
	this.checkPage = function(_document, asimages){
		self.doc = _document;
		self.asimages = asimages;
	
		// current page?
		if (self.doc.URL.indexOf("/p/") > 0){
			var p = self.doc.URL.lastIndexOf("/") + 1;
			self.current_pagenr = parseInt(self.doc.URL.substring(p));
			debug(self.doc.URL.substring(p));
			debug(self.current_pagenr);
			self.url = self.doc.URL.substring(0, p);
		}else{
			self.current_pagenr = 1
			self.url = self.doc.URL + "/p/";
		}
		
		try{
			var childPos;
			var mainDiv = self.doc.getElementById("PhotoAlbums_Thumbs");
			if (!mainDiv){
				mainDiv = self.doc.getElementById("FriendsList");
				if (!mainDiv){
					mainDiv = self.doc.getElementById("PhotoAlbums_Thumbs_Friends");
					childPos = 1;
				}else{
					childPos = 0;
				}
			}else{
				childPos = 1;
			}
			debug(mainDiv);
			var nav = mainDiv.getElementsByTagName("div");
			debug(nav);
			var navLinks = nav[childPos];
			self.maxPage = 1;
			for (var i = navLinks.childNodes.length-1; i>=0; i--){
				var lastItem = navLinks.childNodes[i];
				var nodeValue;
				switch(lastItem.nodeName){
					case "A":
						nodeValue = lastItem.getAttribute("title");
						break;
					default:
						nodeValue = lastItem.innerHTML;
				}
				var value = parseInt(nodeValue);
				if (value > 0){
					self.maxPage = value;
					break;
				}
			}
			/*
			var lastItem = navLinks.childNodes[navLinks.childNodes.length-2];
			debug(lastItem.nodeName);
			if (lastItem.nodeName=="A")
				self.maxPage = parseInt(lastItem.getAttribute("title"));
			else
				self.maxPage = parseInt(lastItem.innerHTML);
			*/			
			debug("numPages: " + self.maxPage);

		}catch(e){
			debug("failed");
			debug(e);
			self.maxPage = 1;
		}
		self.last_pagenr = self.current_pagenr;
		
		
		
		for (var i = 0; i < _document.images.length; i++){
			var link = _document.images[i].src;
			var pos = link.lastIndexOf("-");
			if (pos > 0){
				var size = link.substring(pos+1, pos+2);
				if (size == "w" || size == "m"){
					var img = link.substring(0, pos) + ".jpg";
					var asimage = new ASImage(img, link);
					// get image description:
					try{
						var p = _document.images[i];
						p = p.parentNode.parentNode.nextSibling.nextSibling;
						if (p){
							var c = p.childNodes;
							var descr = "";
							for (var j = 0; j < c.length; j++){
								p = c[j];
								if (p.nodeType == 3)
									descr += trim(p.data) + "\n";
							}
							asimage.description = descr;
						}
					}catch(e){}
					addImage(asimage);
				}
			}
		}
		
		self.addNextPage(asimages, self.addNextPage);
	}
	
	this.addNextPage = function(asimages, funct){
		debug("addNextPage()");
		debug("last_pagenr = " + self.last_pagenr);
		self.addPage(self.last_pagenr+1, asimages, funct);
	}
	
	this.addPage = function(pagenr, asimages, funct){
		debug("addPage(" + pagenr + ")");
		debug("last_pagenr = " + self.last_pagenr); 
		if (pagenr > self.last_pagenr && pagenr <= self.maxPage){
			debug("check images on " + self.url + pagenr);
			this.checkImagesLinks(self.url + pagenr, asimages, funct);
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
			
		var images = doc.match(/\<img\s(.|\r|\n)*?\>/ig);
		var count = 0;
		if (images){
			for (var i = 0; i < images.length; i++){
				// get image src
				var src = getAttribute(images[i], /src\=((.|\r|\n)*)$/i);
				var pos = src.lastIndexOf("-");
				if (pos > 0){
					var size = src.substring(pos+1, pos+2);
					if (size == "w" || size == "m"){
						var img = src.substring(0, pos) + ".jpg";
						var asimage = new ASImage(img, src);
						addImage(asimage);
						count++;
					}
				}
			}
		}
		debug("found " + count + " images on " + link);
		
		if (funct)
			funct();
	}
}