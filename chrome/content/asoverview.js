var showDeletedThumbs = true;

function showOverviewDocument(afterload, newdoc){
	slideshowContent.stop();
	overview = true;
	callback_afterload = afterload;
	if (newdoc)
		slideshowContent.location.href = "chrome://autoslideshow/content/overview.html";
	else
		slideshowContent.location.replace("chrome://autoslideshow/content/overview.html");
}

/*
 * creates the html overview document
 */
function generateOverview(){
	debug("generateOverview()");
	if (checkURL){
		return;
	}

	var buttonOverview = document.getElementById("AutoSlideshow-Button-Overview");
	if (buttonOverview)
		buttonOverview.checked = true;
	
	slideshowDocument = window.content.document;
	if (!slideshowDocument || !slideshowDocument.body){
		//alert("wait for slideshowDocument");
		setTimeout(generateOverview, 100);
		return;
	}
	
	enabledControl(0);
	showImageCount();
	
	// hide menubar ?
	if (!osmenu && slideshowDocument.getElementById('menubar')){
		slideshowDocument.getElementById('menubar').style.display = "none";
	}

	var content = slideshowDocument.getElementById("thumb_content");
	
	checkExpirationTimes(images);
	
	createThumbBoxes(content, 0, images.length, -1, true, isMultiPage());
	
	slideshowDocument.body.style.backgroundImage = "url(chrome://autoslideshow/skin/clear.gif)";
	
	//setTimeout(loadThumbs, 0, images.length);
	loadThumbs(0, images.length, true);
	checkURL = true;
	// set title and url
	setTimeout(setOverviewTitle, 100);
	
	setTimeout(scrollToImage, 100, getCurrentImageIndex());
}


function createThumbBoxes (content, start, length, selectedIndex, menu, moreButton){
	debug("createThumbBoxes(" + start + ", " + length + ")");
	for (var i = start; i<start+length && i < images.length; i++){
		if (menu || images[i].enabled){
			var outerthumbbox = slideshowDocument.createElement('div');
			outerthumbbox.setAttribute('class', 'thumb_outerbox');
			outerthumbbox.id = 'thumb_outerbox_' + i;
			
			var thumbbox = slideshowDocument.createElement('div');
			thumbbox.setAttribute('class', 'thumb_box');
			if (i == selectedIndex)
				thumbbox.setAttribute('class', 'thumb_box thumb_box_selected');
			
				
			var centerTable = slideshowDocument.createElement("table");
			centerTable.setAttribute('class', 'center_table');
			var tr = slideshowDocument.createElement("tr");
			var td = slideshowDocument.createElement("td");
			td.id="thumb_box_" + i;
			
			if (menu){
				var deleteButton = slideshowDocument.createElement('img');
				deleteButton.setAttribute('src', '../skin/disable.png')
				deleteButton.setAttribute('class', 'thumb_button');
				deleteButton.id="thumb_delete_button_" + i;
				if (images[i].enabled)
					deleteButton.title='Disable image.';
				else
					deleteButton.title='Enable image.';
			}
			
			var img = slideshowDocument.createElement('img');
			img.src = "chrome://autoslideshow/skin/clear.gif";		
			img.id="thumb_img_" + i;
			img.setAttribute('class', 'thumb_image');
			img.width=1;
			img.height=1;
			
			if (!images[i].enabled){
				img.setAttribute('class', 'thumb_image_deleted');
				if (showDeletedThumbs){
					outerthumbbox.setAttribute('class', 'thumb_outerbox_deleted');
				}else{
					outerthumbbox.setAttribute('class', 'thumb_outerbox_hidden');
				}
			}
			
			td.appendChild(img);
			tr.appendChild(td);
			centerTable.appendChild(tr);
			
			var name = getFilename(images[i].imgsrc);
			// add the filename
			var len = getTextWidth(name, slideshowDocument);
			if (len > overviewThumbSize){
				name = name.substr(0,10) + "...";
			}
			
			var span_text = slideshowDocument.createElement('span');
			span_text.setAttribute("class", "thumbtitle");
			var text = slideshowDocument.createTextNode(name);
			span_text.appendChild(text);
			
			if (menu){
				thumbbox.appendChild(deleteButton);
			}
			thumbbox.appendChild(centerTable);
			outerthumbbox.appendChild(thumbbox);
			outerthumbbox.appendChild(span_text);
			content.appendChild(outerthumbbox);
		}else{
			length++;
		}
	}
	if (moreButton){
		var outerthumbbox = slideshowDocument.createElement('div');
		outerthumbbox.id="find_more_images_box";
		outerthumbbox.setAttribute('class', 'thumb_outerbox');
		var moreButton = slideshowDocument.createElement('div');
		moreButton.setAttribute('class', 'thumb_box');
		var centerTable = slideshowDocument.createElement("table");
		centerTable.setAttribute('class', 'center_table');
		var tr = slideshowDocument.createElement("tr");
		var td = slideshowDocument.createElement("td");
		var text = slideshowDocument.createTextNode("find more...");
		td.appendChild(text);
		td.id="find_more_images";
		tr.appendChild(td);
		centerTable.appendChild(tr);
		moreButton.appendChild(centerTable);
		outerthumbbox.appendChild(moreButton);
		content.appendChild(outerthumbbox);
	}
}

/*
 * loads all thumbs, the hthm overview page must be created before
 */
function loadThumbs(start, length, menu){
	debug("loadThumbs(" + start + ", " + length + ")");
	for (var i = start;  i<start + length && i < images.length; i++){
		if (menu || images[i].enabled){
			setTimeout(loadThumb, 10, i);
		}else{
			length++;	
		}
	}
}

function loadThumb(i){
	debug("loadThumb("+ i + ")");
	var img =  slideshowDocument.getElementById("thumb_img_" + i);
	
	// check if original image is already loaded
	// no:
	//if (!images[i].isLoaded())
	{
		
		// check if image is in cache
		/*
		var incache = false;
		try {
			var URL = "" + images[i].getImgsrc();
			debug(URL);
			var cacheEntryDescriptor = httpCacheSession.openCacheEntry(URL, nsICacheEntryDescriptor, false);
    		if (cacheEntryDescriptor) {
				incache = true;
    		}
    	}
	    catch(ex){
	    	debug("fehler: " + ex)};
	    */
		
		/*
		// image is cached, load original image as thumbnail
		if (incache){

			images[i].loadImage("thumbLoaded(" + i +")", "thumbLoaded(" + i +")");
		}
		// not cached, load thumb
		else
		*/
		{
			if (images[i].isThumbLoaded()){
				thumbLoaded(i);
			}
			else{
				images[i].loadThumbnail("thumbLoaded(" + i +")");
			}
		}
	}
	// original image is loaded, use this as thumbnail
	//else{
	//	thumbLoaded(i);
	//}
}

function toggleDisabledImages(){
	if (showDeletedThumbs){
		showDeletedThumbs = false;
	}else{
		showDeletedThumbs = true;
	}
	for (var i = 0; i < images.length; i++){
		refreshThumb(i);
	}
}

function refreshThumb(idx){
	var id = 'thumb_outerbox_' + idx;
	var thumb = slideshowDocument.getElementById(id);
	var img = slideshowDocument.getElementById('thumb_img_' + idx);
	var deleteButton = slideshowDocument.getElementById('thumb_delete_button_' + idx);
			
	if (!images[idx].enabled){
		deleteButton.title='Enable image.';
		img.setAttribute('class', 'thumb_image_deleted');
	}else{
		deleteButton.title='Disable image.';
		img.setAttribute('class', 'thumb_image');
	}
	if (!showDeletedThumbs){
		if (images[idx].enabled){	
			thumb.setAttribute('class', 'thumb_outerbox');
		}else{
			thumb.setAttribute('class', 'thumb_outerbox_hidden');
		}
	}else{		
		if (images[idx].enabled){	
			thumb.setAttribute('class', 'thumb_outerbox');
		}
		else{
			thumb.setAttribute('class', 'thumb_outerbox_deleted');
		}
	}
}

function removeThumb(idx){
	var id = 'thumb_outerbox_' + idx;
	var thumb = slideshowDocument.getElementById(id);
	thumb.id="deleted";
	
	var sibling = thumb.nextSibling;
	var tmpId = idx;
	while(sibling){
		if (startsWith(sibling.id, 'thumb_outerbox_')){ 
			sibling.id = 'thumb_outerbox_' + tmpId;
			slideshowDocument.getElementById('thumb_delete_button_' + (tmpId+1)).id = 'thumb_delete_button_'+tmpId;
			slideshowDocument.getElementById('thumb_box_' + (tmpId+1)).id = 'thumb_box_'+tmpId;
			slideshowDocument.getElementById('thumb_img_' + (tmpId+1)).id = 'thumb_img_'+tmpId;
			sibling = sibling.nextSibling;
			tmpId++;
		}else{
			break;
		}
	}
	thumb.parentNode.removeChild(thumb);
	showImageCount();
}

function getTextWidth(text, _document) {
   var ea = _document.createElement("span");
   ea.innerHTML = text;
   _document.body.appendChild(ea);
   var len = ea.offsetWidth;
   _document.body.removeChild(ea);
   return len;
}

function setOverviewTitle(){
	// set title and url
	slideshowDocument.title = "AutoSlideshow: " + _title;
	var urlbar = document.getElementById("urlbar");
	urlbar.value="AutoSlideshow: " + _title;
}

function thumbLoaded(index){
//	debug("thumb_loaded(" + index + ")");
	var img =  slideshowDocument.getElementById("thumb_img_" + index);
	var box = slideshowDocument.getElementById("thumb_box_" + index);
	
	if (img && box){ // = null if overview aborted
		
			if (images[index].isError()){
				img.title = "error";
				box.title = "error";
			}
			else{
				img.src = images[index].getThumbsrc();
				debug("thumbsrc: " + img.src);
				resizeThumb(img, index, images[index].hasThumb());
				if (images[index].isLoaded()){
					img.title = getFilename(images[index].getImgsrc()) + " (" + images[index].width + " x " + images[index].height + ")";
				}else{
					img.title = getFilename(images[index].getImgsrc());	
				}
				box.title = img.title;
			}
		
	}
}

/*
 * resize the specified thumbnail 
 * (htmlimage, index, boolean: true-thumbnail, false-original) 
 */
function resizeThumb(img, num, thumb){
	var srcimage;
	var width;
	var height;
	if (thumb){
		width = images[num].thumbwidth;
		height = images[num].thumbheight;
	}
	else{
		width = images[num].width;
		height = images[num].height;
	}
	if (width > overviewThumbSize || height > overviewThumbSize){
		if (width >= height){
			img.width = overviewThumbSize;
			var scale = overviewThumbSize / width;
			img.height = height * scale;
		}
		else{
			img.height = overviewThumbSize;
			var scale = overviewThumbSize / height;
			img.width = width * scale;
		}
	}else{
		img.width = width;
		img.height = height;
	}
}


/* stops loading images which are not loaded completely */
function stopOverview(){
	for (var i = 0;  i<images.length; i++){
		if (images[i].isLoading()){
			images[i].stopLoading();
			var img =  slideshowDocument.getElementById("thumb_img_" + i);
			img.src = "";
		}
	}
}



var selectedImage;

/*
 * called after click on image in overview mode
 */
function gotoSelectedImage(){
	slideshowDocument = slideshowContent.document;
//	slideshowDocument.getElementsByTagName("body")[0].bgColor = bgColor;
	slideshowImage = slideshowDocument.getElementById('slideshowImage');
	showImage(selectedImage, true, true);
	index_enabled = 0;
	for (i = 0; i < images.length; i++){
		if (i==selectedImage)
			break;
		if (images[i].enabled)
			index_enabled++;
	}
	// show title and url
	slideshowDocument.title = "AutoSlideshow: " + _title;
	var urlbar = document.getElementById("urlbar");
	urlbar.value="AutoSlideshow: " + _title;
	showImageCount();
	
	// hide menubar ?
	if (!osmenu && slideshowDocument.getElementById('menubar')){
		slideshowDocument.getElementById('menubar').style.display = "none";
	}
	
	checkURL = true;
}

function scrollToImage(index){
	//debug("scrollto: " + index);
	var thumb_content = slideshowDocument.getElementById('thumb_content');
	var thumb = slideshowDocument.getElementById('thumb_outerbox_' + index);
	//debug("scrollto: " + thumb.offsetTop);
	thumb_content.scrollTop = thumb.offsetTop - 271;
}

function isThumbbarVisible(){
	var thumbbar = document.getElementById('thumbbar');
	if (thumbbar)
		return thumbbar.style.opacity == 1;
	return false;
}


var oldImageCount;
function updateOverview(){
	var len = images.length - oldImageCount;
	var content = slideshowDocument.getElementById("thumb_content");
	var find_more_images_box = slideshowDocument.getElementById("find_more_images_box");
	if (find_more_images_box) find_more_images_box.parentNode.removeChild(find_more_images_box);
	createThumbBoxes(content, oldImageCount, len, -1, true, isMultiPage());
	loadThumbs(oldImageCount, len, true);
	showImageCount();
}
