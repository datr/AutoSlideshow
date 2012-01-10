function PicassaImageFinder(){
	
	var self = this;
	var maxLimit;
	var ipp;
	var current_pagenr;
	var last_pagenr;
	var doc;
	
	this.multiPage = false;
	
	this.checkPage = function(_document, asimages){
		if (_document.URL.indexOf("picasaweb.google.") < 0)
		return false;
		
		debug("PicassaImageFinder");
		
		self.doc = _document;
		
		var scripts = self.doc.getElementsByTagName("script"); 
		for (var i = 0; i < scripts.length; i++){
			var text = scripts[i].text;
			                 //match(/\<a                           \s(.|\r|\n)*?\<\/a\>/ig);
			var album = text.match(/pwa\.setup\((.|\r|\n)*?]\)/);
			if (album){
				var pics = text.match(/s:"(.|\r|\n)*?"/g);
				for (var j=0; j<pics.length; j++){
					var pic = pics[j].replace(/x2F\//,"");
					pic = pic.replace(/x2F/g,"");
					pic = pic.replace(/\\\w*\\(\w*).jpg/, '/$1.jpg');
					pic = pic.replace(/\\/g, '/');
					pic = pic.substring(3, pic.length-1);
					var asimage = new ASImage(pic, pic);
					addImage(asimage);
					debug("picassa: " + pic);
				}
				break;
			}
		}
		debug("PicassaImageFinder: found " + asimages.length + " images.");
		return asimages.length > 0;
	}
	
	this.addNextPage = function(asimages, funct){
		
	}
}