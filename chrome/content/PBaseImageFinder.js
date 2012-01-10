function PBaseImageFinder(){
	
	var self = this;
	var doc;
	
	this.multiPage = false;
	
	this.checkPage = function(_document, asimages){
		if (_document.URL.indexOf("www.pbase.com") < 0)
		return false;
	
		debug("AutoSlideshow: findImages: pbase - mode");
		
		self.doc = _document;
	
		
		//var links = self.doc.getElementsByTagName("a")
		for (var i = 0; i < self.doc.links.length; i++){
			if (_document.links[i].getAttribute("class") == "thumbnail"){
				var imgs = _document.links[i].getElementsByTagName("img");
				if (imgs[0]){
					var thumb = imgs[0].src;
					var descr = imgs[0].alt;
					var asimage = new ASImage(_document.links[i].href + "/original.jpg", thumb);
					addImage(asimage);
					asimage.description = descr;
				}
			}
		}
		return asimages.length > 0;
	}
	
	this.addNextPage = function(asimages, funct){
	}
	
}