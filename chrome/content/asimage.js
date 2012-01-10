function ASImage(_imgsrc, _thumbsrc){
	var self = this;
	
	this.width = 0;
	this.height = 0;
	this.thumbwidth = 0;
	this.thumbheight = 0;
	this.description = "";
	
	this.enabled = true;
	
	this.imgsrc = _imgsrc;
	this.thumbsrc = _thumbsrc;
	
	var state = null;
	var thumbstate = null;
	var image = null;
	var thumb = null;	
	var onloadImageCallback;
	var onloadThumbCallback;
	var onerrorImageCallback;
	var onerrorThumbCallback;
	
	
	this.hasThumb = function(){
		return self.thumbsrc != null;
	}
	
	this.getImgsrc = function(){
		return self.imgsrc;
	}
	
	this.getThumbsrc = function(){
		if (self.thumbsrc == null)
			return self.imgsrc;
		return self.thumbsrc;
	}

	this.isLoaded = function(){
		return self.state == "loaded";
	}
	
	this.isLoading = function(){
		return self.state == "loading";
	}
	
	this.isError = function(){
		return self.state == "error";
	}
	
	this.isThumbError = function(){
		return self.thumbstate == "error";
	}
	
	
	this.isThumbLoaded = function(){
		if (self.thumbsrc == null)			return self.isLoaded();
		return self.thumbstate == "loaded";
	}
	
	this.isThumbLoading = function(){
		if (self.thumbsrc == null)
			return self.isLoading();
		return self.thumbstate == "loading";
	}
	
	this.loadImage = function(onload, onerror){
		debug("load thumb: " + self.imgsrc);
		self.state = "loading";
		self.image = new Image();
		self.onloadImageCallback = onload;
		self.onerrorImageCallback = onerror;
		self.image.src = self.imgsrc;	
		self.image.onload = self.onImageLoad;
		self.image.onerror = self.onImageError;
	}
	
	this.stopLoading = function(){
		if (self.state == "loading"){
			self.image.src = "";
		}
	}

	this.onImageLoad = function(){
		checkExpirationTime(self.imgsrc);
		self.state = "loaded";
		self.width = self.image.width;
		self.height = self.image.height;
		//alert("loaded: " + self.imgsrc);
//		self.onloadImageCallback();
		setTimeout(self.onloadImageCallback, 0);
	}

	this.onImageError = function(){
		self.state = "error";
//		self.onerrorImageCallback();
		setTimeout(self.onerrorImageCallback, 0);
	}
	
	
	/*
	 * 
	 */
	this.loadThumbnail = function(onload, onerror){
		if (self.thumbsrc == null){
			self.loadImage(onload, onerror);	
		}else{
//			debug("load thumb: " + self.thumbsrc);
			self.thumbstate = "loading";
			self.thumb = new Image();
			self.onloadThumbCallback = onload;
			self.onerrorThumbCallback = onerror;
			self.thumb.src = self.thumbsrc;
			self.thumb.onload = self.onThumbLoad;
			self.thumb.onerror = self.onThumbError;
		}
	}
					
	this.onThumbLoad = function(){
		checkExpirationTime(self.thumbsrc);
		self.thumbstate = "loaded";
		self.thumbwidth = self.thumb.width;
		self.thumbheight = self.thumb.height;
//		self.onloadThumbCallback();
		setTimeout(self.onloadThumbCallback, 0);
	}
		
	this.onThumbError = function(){
		self.thumbstate = "error";
		// invalid thumbsrc, try the original image:
		self.thumbsrc = null;
		self.loadImage(self.onloadThumbCallback, self.onerrorThumbCallback);
	}	
	
	/*
	 * 
	 */
	
	this.setOnload = function(onload){
		self.onloadImageCallback = onload;
	}
	this.setOnerror = function(onerror){
		self.onerrorImageCallback = onerror;
	}
}



