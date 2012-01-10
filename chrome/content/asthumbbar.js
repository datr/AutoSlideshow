function Thumbbar(){
	var self = this;

	var topItemIndex = 0;
	this.currentItemIndex = 0;
	this.currentItemIndexEnabled = 0;
	var numItems = 0;
	var highlightedIndex = 0;
	
	this.isLastItem = function(){
		if (self.currentItemIndex >= images.length)
			return true;
		return self.topItemIndex + self.numItems >= enabledImagesLength-1;
	}
	
	this.moveForward = function(){
		self.topItemIndex++;
		while (self.topItemIndex < images.length && !images[self.topItemIndex].enabled){
			self.topItemIndex++;	
		}
		self.currentItemIndex = -1;
		debug("moveForward(" + self.currentItemIndex + ", " + self.topItemIndex + ")");
		self.generateThumbbar();
	}
	this.moveBackward = function(){
		self.topItemIndex--;
		while (self.topItemIndex > 0 && !images[self.topItemIndex].enabled){
			self.topItemIndex--;	
		}
		self.currentItemIndex = -1;
		debug("moveBackward(" + self.currentItemIndex + ", " + self.topItemIndex + ")");
		self.generateThumbbar();
	}
	
	this.showItem = function(itemIndex){
		self.currentItemIndex = itemIndex;
		self.highlightedIndex = itemIndex;
		if (!self.topItemIndex)
			self.topItemIndex = 0;
		debug("showItem(" + self.currentItemIndex + ", " + self.topItemIndex + ")");
		self.generateThumbbar();
	}

	this.generateThumbbar = function(){
		debug("generateThumbbar(" + self.currentItemIndex + ", " + self.topItemIndex + ")");
		
		if (!window.content)
			return;
		
		slideshowDocument = window.content.document;
		var thumbbar = slideshowDocument.getElementById("thumbbar");
		if (thumbbar){
			var content = slideshowDocument.getElementById("thumbbar_thumbs");
			
			var buttonBack = slideshowDocument.getElementById("thumbbar_nav_back");
			// var buttonForward = slideshowDocument.getElementById("thumbbar_nav_back");
			var height = thumbbar.clientHeight - 2*buttonBack.clientHeight;
			debug("available thumbbar height: " + height);
			self.numItems = Math.round(height / 190);
			debug("max thumbbar thumbs: " + length);
			
			if ( content.hasChildNodes() ){
			    while ( content.childNodes.length >= 1 ){
			        content.removeChild( content.firstChild );       
			    } 
			}
			
			var bottom = self.topItemIndex + self.numItems;
			
			if (self.currentItemIndex >= 0){
				if (self.currentItemIndex < self.topItemIndex){
					self.topItemIndex -= self.topItemIndex - self.currentItemIndex;	
				}else if (self.currentItemIndex >= bottom){
					self.topItemIndex += self.currentItemIndex - bottom + 1;
				}
			} else{
				if (self.topItemIndex + self.numItems > images.length)
					self.topItemIndex = images.length - self.numItems;
				if (self.topItemIndex < 0)
					self.topItemIndex = 0;
			}
			
			createThumbBoxes(content, self.topItemIndex, self.numItems, self.highlightedIndex);
			
			loadThumbs(self.topItemIndex, self.numItems);
		}
	}
}