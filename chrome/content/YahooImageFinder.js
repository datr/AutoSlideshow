function YahooImageFinder(){
	
	var self = this;
	var maxPage;
	var ipp;
	var current_pagenr;
	var last_pagenr;
	var doc;
	
	this.multiPage = true;
	
	this.checkPage = function(_document, asimages){
		debug("AutoSlideshow: findImages: yahoo images - mode");
		
		self.doc = _document;
		
		self.current_pagenr = 1;
		self.maxPage = null;
		var nav = self.doc.getElementById("yschpg");
		if (nav){
			var selected = nav.getElementsByTagName("span");
			if (selected){
				var value = parseInt(selected.innerHTML);
				if (value > 0){
					self.current_pagenr
				}
				debug("currend page: " + self.current_pagenr);
			}
		}else{
			self.maxPage = 1;
		}
		self.last_pagenr = self.current_pagenr;
		
		self.ipp = 20;
		var imgtable = self.doc.getElementById("yschimg");
		if (imgtable){
			var imgs = imgtable.getElementsByTagName("img");
			if (imgs){
				self.ipp = imgs.length;
			}
		}
		debug("images per page: " + self.ipp);
		
		
		
		for (var i = 0; i < _document.links.length; i++){
			var link = _document.links[i].href;
			var pos = link.indexOf("imgurl=");
			if (pos >= 0){
				var pos2 = link.indexOf("%26rurl=", pos);
				if (pos2 >= 0){
					var imgSrc = link.substring(pos+7, pos2);
					imgSrc = decodeURL1(imgSrc);
					imgSrc = decodeURL2(imgSrc);
		
					if (isImage(imgSrc)){
						var thumb = null;
						// thumbnail:
						var imgs = _document.links[i].getElementsByTagName("img");
						if (imgs.length>0)
							thumb = imgs[0].src;
						var asimage = new ASImage("http://" + imgSrc, thumb);
						addImage(asimages, asimage);
					}
				}
			}
		}
		
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
		if (!self.maxPage || pagenr <= self.maxPage){
			if (pagenr > self.last_pagenr){
				var startimage = self.ipp*(pagenr-1) + 1;
				// alert(startimage + " - " + maxLimit);
				if (startimage > self.maxLimit)
					return;
				this.checkImagesLinks(self.doc.URL + "&b=" + startimage, asimages, pagenr, funct);
			}
		}
	}
	
	this.checkImagesLinks = function(url, asimages, pagenr, funct){	
		var link = url;
		debug(link);
		
		var xmlhttp1 = new XMLHttpRequest();
		requests.push(xmlhttp1);
				
		xmlhttp1.onload = function(){
			if (slideshowRunning){
				retrievedPagesCount++;
				self.parsePage(link, xmlhttp1, asimages, pagenr, funct);
			}
		}
		xmlhttp1.onerror = function(){
			retrievedPagesCount++;
		}
		xmlhttp1.open('GET', link);
		xmlhttp1.send(null);
	}
	
	this.parsePage = function(link, request, asimages, pagenr, funct){
		debug("retrieved page: " + link);
		self.last_pagenr = pagenr;
		var doc = request.responseText;
		
		var links = doc.match(/\<a\s(.|\r|\n)*?\<\/a\>/ig);
		for (var i = 0; i < links.length; i++){
			var href = getAttribute(links[i], /href\=((.|\r|\n)*)$/i);
			debug("***********href: " + href);
			var pos = href.indexOf("imgurl=");
			if (pos >= 0){
				debug("***********imgurl: " + href);
				var pos2 = href.indexOf("%26rurl=", pos);
				if (pos2 >= 0){
					currPos = pos2;
					var imgSrc = href.substring(pos+7, pos2);
					imgSrc = decodeURL1(imgSrc);
					imgSrc = decodeURL2(imgSrc);
		
					if (isImage(imgSrc)){
						var thumb = null;
						// thumbnail:
						var p1 = links[i].indexOf(" src=");
						if (p1 >= 0){
							var p2 = links[i].indexOf("\"", p1+6);
							var src = links[i].substring(p1+6, p2)
							debug("thumbsrc=" + src);
							thumb = src;
						}
						/*
						var img = links[i].match(/\<img\s(.|\r|\n)*?\>/i);
						//var imgs = _document.links[i].getElementsByTagName("img");
						if (img){
							debug(img);
							var src = getAttribute(img, /src\=((.|\r|\n)*)$/i);
							thumb = src;
						}
						*/
						var asimage = new ASImage("http://" + imgSrc, thumb);
						debug("************ ad images *************" +  asimages.length);
						addImage(asimages, asimage);
					}
				}
			}
		}

		
		if (funct)
			funct();
	}
	
}