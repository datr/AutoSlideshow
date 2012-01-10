const CACHESERVICE  = Components.classes["@mozilla.org/network/cache-service;1"].getService(Components.interfaces.nsICacheService);
const nsICache                  = Components.interfaces.nsICache;
const nsICacheEntryDescriptor   = Components.interfaces.nsICacheEntryDescriptor;

var httpCacheSession            = CACHESERVICE.createSession("HTTP", nsICache.STORE_ANYWHERE, true);

// list of sended requests (neccessary for aborting all requests)
var requests;

// number of checked tabs
var numtabs; 
var tabcount;
// list of the image lists for each tab
var tabimages;


var imageFinder;

function isMultiPage(){
	if (imageFinder){
		return imageFinder.multiPage;
	}
	return false;
}

function findNextImages(asimages, funct){
    if (imageFinder){
        imageFinder.addNextPage(asimages, funct);
    }
}

function findImages(mode, url, frame, functSuccess, functFailed){
    imageFinder = null;
    enabledImagesLength = 0;
    debug("AutoSlideshow: findImages");
    
    httpCacheSession.doomEntriesIfExpired = false; 
    tabcount = 0;
    tabimages = new Array();
    requests = new Array();
    switch(mode){
    case 0:
        numtabs = 1;
        findImages1(url, frame, functSuccess, functFailed);
        break;
    case 1: // check all tabs right to the current one (including current tab)
        var currIndex = -1;
        var num = gBrowser.browsers.length;
        for (var i = 0; i < num; i++) {
            var b = gBrowser.getBrowserAtIndex(i);
            try {
                if (currIndex < 0 && b == gBrowser.selectedBrowser){
                    currIndex = i;
                    numtabs = gBrowser.browsers.length - i;
                }
                if (currIndex >= 0 && i >= currIndex){
                    var tabFrame;
                    var tabURI;
                    if (i != currIndex){
                        tabframe = copyFrame(b.contentWindow);
                        tabURI = b.currentURI.spec;
                    }else{
                        tabframe = frame;
                        tabURI = url;
                    }
                    findImages1(tabURI, tabframe, functSuccess, functFailed);
                }
            } catch(e) {
                Components.utils.reportError(e);
            }
        }
        break;
    case 2: // check all tabs
        var currIndex = -1;
        numtabs = gBrowser.browsers.length;
        for (var i = 0; i < numtabs; i++) {
            var b = gBrowser.getBrowserAtIndex(i);
            try {
                if (currIndex < 0 && b == gBrowser.selectedBrowser){
                    currIndex = i;
                }
                var tabFrame;
                var tabURI;
                if (i != currIndex){
                    tabframe = copyFrame(b.contentWindow);
                    tabURI = b.currentURI.spec;
                }else{
                    tabframe = frame;
                    tabURI = url;
                }
                findImages1(tabURI, tabframe, functSuccess, functFailed);
            } catch(e) {
                Components.utils.reportError(e);
            }
        }
        break;
    }
}

/*
 * Checks the given url for images.
 */
function findImages1(url, frame, functSuccess, functFailed)
{
    asimages = new Array(); 
    tabimages.push(asimages);
    
    // test if current page is a jpg
    if (isImage(url))
    {
        debug("AutoSlideshow: findImages: image-mode");
        // find all images with similar numbering (eg. pic1, pic2,pic5,...)
        var parsedURL = new ParsedURL(url);
        gapcount = 0; // reset gap counter
        checkNextImage(asimages, url, parsedURL, functSuccess, functFailed);
    }
    // page is not a jpg, assume that page is an overview page
    else{
        var ok;
        ok = checkGoogleImages(frame.document, asimages);
        if (!ok)
            ok = checkYahooImages(frame.document, asimages);
        if (!ok)
            ok = checkFlickr(frame.document, asimages);
        if (!ok)
            ok = checkWikipedia(frame.document, asimages);
        if (!ok)
            ok = checkWikimedia(frame.document, asimages);
        if (!ok)
            ok = checkStudiVZ(frame.document, asimages);
        if (!ok)
            ok = checkFacebook(frame.document, asimages);
        if (!ok)
            ok = checkPBase(frame.document, asimages);
        if (!ok)
            ok = checkPicassa(frame.document, asimages);    
        if (!ok)
            ok = check23HQ(frame.document, asimages);
        if (!ok)
            ok = checkPhotoNet(frame.document, asimages);   
        if (!ok)
            ok = checkSXC(frame.document, asimages);
        if (!ok)
            ok = checkDeviantArt(frame.document, asimages);
        if (!ok)
            ok = checkSnif(frame.document, asimages);


        if (!ok){
            debug("AutoSlideshow: findImages: image links - mode");
            findImageLinks(frame, asimages);
            debug("AutoSlideshow: findImages: imagecount: " + asimages.length);
            //alert("image links: " + asimages.length);
            ok = asimages.length > 0;
            if (ok){
                debug("AutoSlideshow: findImages: embedded images - mode");
                findEmbeddedImages(frame, asimages, asimages.length);
                debug("AutoSlideshow: findImages: imagecount: " + asimages.length);
            }                                                           
        }
        
        
        if (!ok){
            possibleImageCount = 0;
            retrievedPagesCount = 0;
            var possibleLinks = new Array();
            pageLinkFlag = false;
            debug("AutoSlideshow: findImages: page links - mode");
            findPageLinks(frame, asimages, true, possibleLinks);
            debug("AutoSlideshow: findImages: imagecount: " + asimages.lenght);
            countWait = 0;
            wait(frame, asimages, functSuccess, functFailed);
        }
        else{
            finished(asimages, functSuccess, functFailed);
        }
    }
}

var countWait;
function wait(frame, asimages, functSuccess, functFailed){
    
    if (pageLinkFlag && (possibleImageCount < 0 || (possibleImageCount > 0 && possibleImageCount <= retrievedPagesCount))){
        if (slideshowRunning){
            if (asimages.length > 0){
            }else{
                findEmbeddedImages(frame, asimages, asimages.length);
            }
            finished(asimages, functSuccess, functFailed);
        }
    }else{
        countWait++;
        if (countWait > 50){
            possibleImageCount = -1;
            pageLinkFlag = true;    
        }
        if (slideshowRunning){
            setTimeout(wait, 250, frame, asimages, functSuccess, functFailed);
        }
    }
}

/*
 * Called each time when a tab is checked completly. 
 * If the last tab is finishied, the result of all tabs is merged and returned.
 */
function finished(asimages, functSuccess, functFailed){
    debug("AutoSlideshow: findImages: tab " + (tabcount+1) + " finished, found " + asimages.length + " images.");
    tabcount++;
    //dump("finished: " + tabcount + "\n");
    if (tabcount == numtabs){
        //dump("finished all: " + tabimages.length + "\n");
        // create result image list
        var result;
        if (tabcount == 1) // only one tab
            result = asimages;
        else{
            // copy results of all tabs to one list
            result = new Array();
            //dump(result.length + "\n");
            for (var i = 0; i < tabimages.length; i++){
                //dump(tabimages[i].length + "\n");
                result = result.concat(tabimages[i]);
                //dump(result.length + "\n");
            }
        }
        debug("AutoSlideshow: findImages: finished, found total " + result.length + " images.\n");
        //dump(result.length + "\n");
        if (result.length > 0){
            checkExpirationTimes(result);
            images = result;
            functSuccess();
        }
        else{
            functFailed();
        }
    }
}

// special support for google images
function checkGoogleImages(_document, asimages){
    if (_document.URL.indexOf("images.google.") < 0)
        return false;
    
    debug("AutoSlideshow: google images - mode");
    imageFinder = new GoogleImageFinder();
    debug(imageFinder);
    return imageFinder.checkPage(_document, asimages);
}

            
function checkYahooImages(_document, asimages){
    if (_document.URL.indexOf("search.yahoo.com") < 0)
        return false;

    imageFinder = new YahooImageFinder();
    return imageFinder.checkPage(_document, asimages);
}

function checkPBase(_document, asimages){
    imageFinder = new PBaseImageFinder();
    return imageFinder.checkPage(_document, asimages);
}

function checkPicassa(_document, asimages){
    imageFinder = new PicassaImageFinder();
    return imageFinder.checkPage(_document, asimages);
}

function checkFlickr(_document, asimages){
    if (_document.URL.indexOf("flickr.com") < 0)
        return false;
        
    debug("AutoSlideshow: findImages: flickr - mode");
        
    for (var i = 0; i < _document.images.length; i++){
        var link = _document.images[i].src;
        var pos = link.lastIndexOf("_");
        if (pos > 0){
            var size = link.substring(pos, pos+3);          
            if (size == "_m."){
                var img = link.substring(0, pos) + ".jpg";
                var thumb = link.substring(0, pos) + "_m.jpg";
                var asimage = new ASImage(img, thumb);
                addImage(asimages, asimage);
            }
            else if (size == "_s."){
                var img = link.substring(0, pos) + ".jpg";
                var thumb = link.substring(0, pos) + "_s.jpg";
                var asimage = new ASImage(img, thumb);
                addImage(asimages, asimage);
            }
            else if (size == "_t."){
                var img = link.substring(0, pos) + ".jpg";
                var thumb = link.substring(0, pos) + "_t.jpg";
                var asimage = new ASImage(img, thumb);
                addImage(asimages, asimage);
            }
        }
    }   
    debug("AutoSlideshow: findImages: imagecount: " + asimages.length);
    if (asimages.length > 0){
        return true;
    }
    return false;   
}

function check23HQ(_document, asimages){
    if (_document.URL.indexOf("www.23hq.com") < 0)
        return false;
    
    debug("AutoSlideshow: findImages: 23hq - mode");
    
    for (var i = 0; i < _document.images.length; i++){
        var link = _document.images[i].src;
        
        var pos = link.lastIndexOf("_quad100.jpg");
        if (pos > 0){
            var img = link.substring(0, pos) + ".jpg";
            var asimage = new ASImage(img, link);
            addImage(asimages, asimage); 
        }
        else{
            pos = link.lastIndexOf("/") + 1;
            if (pos > 0){
                var size = link.substring(pos);
                if (size == "quad100" || size == "standard" || size == "large"){
                    var img = link.substring(0, pos) + "large";
                    var thumb = link.substring(0,pos) + "standard";
                    var asimage = new ASImage(img, link);
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

function checkPhotoNet(_document, asimages){
    if (_document.URL.indexOf("photo.net") < 0)
        return false;
    
    debug("AutoSlideshow: findImages: photo.net - mode");
        
    // find links to pages containing an image for (var i = 0; i < _document.images.length; i++){
        var link = _document.images[i].src;
        var pos = link.lastIndexOf(".1.jpg");
        if (pos > 0){
            var img = link.substring(0, pos) + ".3.jpg";
            var asimage = new ASImage(img, link);
            addImage(asimages, asimage);
        }
    }
    // find directly linked images and images in photodb
    for (var i = 0; i < _document.links.length; i++){
        var link = _document.links[i].href;     
        if (isImage(link)){
                var asimage = new ASImage(link, null);
                addImage(asimages, asimage); 
        }else{
            pos = link.lastIndexOf("photodb/photo?");
            if (pos > 0){
                var pos2 = link.lastIndexOf("photo_id");            
                var img = "http://gallery.photo.net/photo/" + link.substring(pos2+9) + "-md.jpg";
                var thumb = "http://thumbs.photo.net/photo/" + link.substring(pos2+9) + "-sm.jpg";
                var asimage = new ASImage(img, thumb);
                addImage(asimages, asimage);
            }
        }
    }
    debug("AutoSlideshow: findImages: imagecount: " + asimages.length);
    if (asimages.length > 0){
        return true;
    }
    return false;   
}

function checkSXC(_document, asimages){
    if (_document.URL.indexOf(".sxc.hu") < 0)
        return false;
        
    debug("AutoSlideshow: findImages: sxc - mode");
    
    for (var i = 0; i < _document.images.length; i++){
        var link = _document.images[i].src;
        if (isJpg(link)){
            var pos = link.indexOf("pic/s/");
            if (pos != 0){
                var img = "http://www.sxc.hu/pic/m/" + link.substring(pos + 6);
                var asimage = new ASImage(img, link);
                addImage(asimages, asimage);
            }
        }
    }
    debug("AutoSlideshow: findImages: imagecount: " + asimages.length);
    if (asimages.length > 0){
        return true;
    }
    return false;
}

function checkDeviantArt(_document, asimages){
    if (_document.URL.indexOf("deviantart.com") < 0)
        return false;
        
    debug("AutoSlideshow: findImages: deviantart - mode");
    
    for (var i = 0; i < _document.images.length; i++){
        var link = _document.images[i].src;
        if (isJpg(link)){
            var pos1 = link.indexOf("//tn");
            var pos2 = link.indexOf(".pv.", pos1);
            if (pos1 != 0){
                var img = "http://fc01." + link.substring(pos2 + 4);
                img = img.replace("/150/", "/");
                var asimage = new ASImage(img, link);
                addImage(asimages, asimage);
            }
        }
    }
    debug("AutoSlideshow: findImages: imagecount: " + asimages.length);
    if (asimages.length > 0){
        return true;
    }
    return false;
}

function checkStudiVZ(_document, asimages){
    if (_document.URL.indexOf("studivz.net") < 0){
        return false;
    }
    
    debug("AutoSlideshow: findImages: studivz - mode");
    
    imageFinder = new StudiVzImageFinder();
    return imageFinder.checkPage(_document, asimages);
    
    for (var i = 0; i < _document.images.length; i++){
        var link = _document.images[i].src;
        var pos = link.lastIndexOf("-");
        if (pos > 0){
            var size = link.substring(pos+1, pos+2);
            if (size == "w" || size == "m"){
                var img = link.substring(0, pos) + ".jpg";
                var asimage = new ASImage(img, link);
                // get image description:
//              try{
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
//              }catch(e){}
                addImage(asimages, asimage);
            }
        }
    }
    
    debug("AutoSlideshow: findImages: imagecount: " + asimages.length);
    if (asimages.length > 0){
        return true;
    }
    return false;
}

function checkFacebook(_document, asimages){
    if (_document.URL.indexOf("facebook.com") < 0)
        return false;
    
    debug("AutoSlideshow: findImages: facebook - mode");
    
    for (var i = 0; i < _document.images.length; i++){
        var link = _document.images[i].src;
        var pos = link.lastIndexOf("/");
        if (pos > 0){
            var size = link.substring(pos+1,pos+2);
            if (size  == "t" || size == "s"){
                var img = link.substring(0, pos+1) + "n" + link.substring(pos+2);
                var thumb = link.substring(0, pos+1) + "t" + link.substring(pos+2);
                var asimage = new ASImage(img, thumb);
                addImage(asimages, asimage);
            }else if (size == 'n'){
                var thumb = link.substring(0, pos+1) + "t" + link.substring(pos+2);
                var asimage = new ASImage(img, thumb);
                addImage(asimages, asimage);
            }
            
        }
    }
    debug("AutoSlideshow: findImages: imagecount: " + asimages.length);
    if (asimages.length > 0){
        return true;
    }
    return false;
}

// support for wikipedia
function checkWikipedia(_document, asimages){
    if (_document.URL.indexOf("wikipedia.org")< 0)
        return false;
    
    debug("AutoSlideshow: findImages: wikipedia - mode");
    
    // find all images on this page
    for (var i = 0; i < _document.images.length; i++){
        var imgSrc = _document.images[i].src;
        if (_document.images[i].width > 50){
            var wiki = "http://upload.wikimedia.org/wikipedia/";
            var pos = imgSrc.indexOf(wiki);
            if (pos == 0){
                var thumbPos = imgSrc.indexOf("thumb/", wiki.length);
                if (thumbPos >= 0){
                    // thumbnail
                    var extSize=4;
                    var posEnd = imgSrc.indexOf(".jpg/", wiki.length);
                    if (posEnd < 0){
                        posEnd = imgSrc.indexOf(".png/", wiki.length);
                    }
                    if (posEnd < 0){
                        posEnd = imgSrc.indexOf(".gif/", wiki.length);
                    }
                    if (posEnd < 0){
                        posEnd = imgSrc.indexOf(".jpeg/", wiki.length);
                        extSize=5;
                    }
                    if (posEnd >= 0){
                        var asimage = new ASImage(imgSrc.substring(0,thumbPos) + imgSrc.substring(thumbPos+6, posEnd+extSize), imgSrc);
                        addImage(asimages, asimage);
                    }
                }
                // no thumb
                else{
                    var asimage = new ASImage(imgSrc, null);
                    addImage(asimages, asimage);
                }
            }
        }
    }
    debug("AutoSlideshow: findImages: imagecount: " + asimages.length);
    if (asimages.length > 0){
        return true
    }
    return false;
}

// support for wikipedia
function checkWikimedia(_document, asimages){
    if (_document.URL.indexOf("wikimedia.org")< 0)
        return false;
    
    debug("AutoSlideshow: findImages: wikimedia - mode");
    
    // find all images on this page
    for (var i = 0; i < _document.images.length; i++){
        var imgSrc = _document.images[i].src;
        if (_document.images[i].width > 50){
            // wikimedia commons
            var wiki = "http://upload.wikimedia.org/wikipedia/commons/";
            var pos = imgSrc.indexOf(wiki);
            var thumbPos = imgSrc.indexOf("thumb/", wiki.length);
            if (thumbPos >= 0){
                // thumbnail
                var extSize=4;
                var posEnd = imgSrc.indexOf(".jpg/", wiki.length);
                if (posEnd < 0){
                    posEnd = imgSrc.indexOf(".png/", wiki.length);
                }
                if (posEnd < 0){
                    posEnd = imgSrc.indexOf(".gif/", wiki.length);
                }
                if (posEnd < 0){
                    posEnd = imgSrc.indexOf(".jpeg/", wiki.length);
                    extSize=5;
                }
                if (posEnd >= 0){
                    var asimage = new ASImage(imgSrc.substring(0,thumbPos) + imgSrc.substring(thumbPos+6, posEnd+extSize), imgSrc);
                    addImage(asimages, asimage);
                }
            }
        }
    }
    debug("AutoSlideshow: findImages: imagecount: " + asimages.length);
    if (asimages.length > 0){
        return true
    }
    return false;
}

// modified for server generated index files with snif
function checkSnif(_document, asimages){
    if (_document.getElementsByTagName("body")[0] && _document.getElementsByTagName("body")[0].className=="snif"){
        
        debug("AutoSlideshow: findImages: snif - mode");
        
        //find images
        if (imageSelectionLinks && _document.links){
            // find all image links on this page
            for (var i = 0; i < _document.links.length; i++){
                if (_document.links[i].href.indexOf("?path=") < 0){
                    if (isImage(_document.links[i].href)){
                        if (!contains(asimages, _document.links[i].href)){
                            var imgs = _document.links[i].getElementsByTagName("img");
                            var asimage = new ASImage(_document.links[i].href, null);
                            addImage(asimages, asimage);
                        }
                    }
                }
            }
        }
        debug("AutoSlideshow: findImages: imagecount: " + asimages.length);
        return true;
    }
    else
        return false;
    
    
}



function htmlReady(event){
    alert(event);
//  alert(xmlhttp.responseText);
}

/*
 * Remove multiple times encoded "%"
 */
function decodeURL1(url){
    var u = url;
    while (u.indexOf("%25") >= 0)
        u = u.replace("%25", "%");
    return u;
}

function decodeURL2(url){
    var u = url;
    while (u.indexOf("%2F") >= 0)
        u = u.replace("%2F", "/");
    return u;
}





/*
 * Looks for linked and embedded images om a page.
 */
function findImageLinks(frame, asimages){
    // test for frameset
    if (frame.frames && frame.frames.length > 0){
        for (var i=0; i<frame.frames.length; i++){
            findImageLinks(frame.frames[i], asimages);
        }
    }
    
    var _document = frame.document;
    //find links and images
    if (_document.links){
        // find all image links on this page
        for (var i = 0; i < _document.links.length; i++){
            if (isImage(_document.links[i].href)){
                if (!contains(asimages, _document.links[i].href)){
                    var thumb;
                    var descr = null;
                    if (_document.links[i].href.indexOf("file:") == 0){
                        thumb = null;
                        var imgs = _document.links[i].getElementsByTagName("img");
                    }
                    else{
                        var imgs = _document.links[i].getElementsByTagName("img");
                        if (imgs.length>0){                     
                            thumb = imgs[0].src;
                            descr = imgs[0].alt;
                        }
                        else
                            thumb = null;
                    }
                    var asimage = new ASImage(_document.links[i].href, thumb);
                    addImage(asimages, asimage);
                    asimage.description = descr;
                }
            }
        }
    }
}

function findEmbeddedImages(frame, asimages, numImagesBefore){
    
    // test for frameset
    if (frame.frames &&  frame.frames.length > 0){
        for (var i=0; i< frame.frames.length; i++){
            findEmbeddedImages(frame.frames[i], asimages, numImagesBefore);
        }
    }
    
    var _document = frame.document;
    if (_document.images){
        if (imageSelectionImages  == "always" || (imageSelectionImages == "ondemand" && numImagesBefore==0)){
            var array;
                        
            // find all images on this page
            for (var i = 0; i < _document.images.length; i++){
                if (_document.images[i].width >= imageSelectionImagesMinWidth && _document.images[i].height >= imageSelectionImagesMinHeight ){         
                    if (!contains(asimages, _document.images[i].src)){
                        debug(_document.images[i].src);
                        var asimage = new ASImage(_document.images[i].src, null);
                        addImage(asimages, asimage);
                    }
                }
            }
        }
    }
}

/*
 * Find links to pages are which containing images.
 */
var possibleImageCount;
var retrievedPagesCount;
var pageLinkFlag;
var possibleLinks;

function findPageLinks(frame, asimages, mainframe, possibleLinks){
    // test for frameset
    if (frame.frames &&  frame.frames.length > 0){
        //alert("(findPageLinks)frames: " + frame.frames.length);
        for (var i=0; i< frame.frames.length; i++){
            findPageLinks(frame.frames[i], asimages, false, possibleLinks);
        }
    }
    
    var _document = frame.document;
        
    // collect all possible links on current frame
    //dump(_document.links.length + "\n");
    for (var index = 0; index < _document.links.length; index++){
        var link = _document.links[index];
        
        debug("AutoSlideshow: findImages: found link: " + link.href);
        
        //dump("0: " + link + "\n");
        // link to page on same host?
        if (frame.host == link.host)
        {
            //dump("1: " + link + "\n");
            // what kind of link?
            if (isWebpage(link.href))
            {
                debug("AutoSlideshow: findImages: check link.");
                // img child?
                var imgchild = getIMGChild(link);
                if (imgchild){
                    debug("AutoSlideshow: findImages: found possible image: " + imgchild.src);
                    possibleImageCount++;
                    var pageLink = new PageLink(link, imgchild.src);
                    possibleLinks.push(pageLink);
                    //dump("possible: " + link + "\n");
                }
            }
            
//          var children = link.childNodes;
//          for (var i = 0; i < children.length; i++){
//              
//                  dump("2: " + link + "\n");
//                  var child = children[i];
//                  var wait = false;
//                  if (child && child.nodeName == 'IMG'){
//                      if (child.src.match(/previous[^//]*/i))
//                          continue;
//                      if (child.src.match(/next[^//]*/i))
/*                          continue;
                        //if (isJpg(child.src)){
                            possibleImageCount++;
                            var pageLink = new PageLink(link, child.src);
                            possibleLinks.push(pageLink);
                            dump("possible: " + link + "\n");
                            break;
                        //}
                    }
                }
            }
            */
        }else{
            //dump("wrong host: " + frame.host +" "  +link.host + "\n");
        }
    }
    
    // check all collected links
    if (mainframe){
        debug("AutoSlideshow: findImages: possible image count: " + possibleImageCount);
        if (possibleImageCount <=0 ){
            possibleImageCount = -1;
        }
        else{
            checkLinks(possibleLinks, 0, asimages);
        }
        pageLinkFlag = true;
    }
}

function getIMGChild(node){
    //dump(node.nodeName + "\n");
    var children = node.childNodes;
    for (var i = 0; i < children.length; i++){
        if (children[i].nodeName == 'IMG'){
            if (children[i].src.match(/previous[^//]*/i))
                continue;
            if (children[i].src.match(/next[^//]*/i))
                continue;
            return children[i];
        }else{
            var c = getIMGChild(children[i]);
            if (c)
                return c;
        }
    }
    return null;
}


function checkLinks(possibleLinks, index, asimages){
    if (index < possibleLinks.length){
        var link = possibleLinks[index].url;
        var thumb = possibleLinks[index].thumb;
        
        debug("AutoSlideshow: findImages: check possible image on : " + link);
        
        var xmlhttp1 = new XMLHttpRequest();
        requests.push(xmlhttp1);
        
        xmlhttp1.onload = function(){
            if (slideshowRunning){
                retrievedPagesCount++;
                parsePage(link, xmlhttp1, asimages, thumb);
            }
        }
        xmlhttp1.onerror = function(){
            retrievedPagesCount++;
        }
        xmlhttp1.open('GET', link.href);
        xmlhttp1.send(null);
        
        // check next link (wait a little)
        if (slideshowRunning)
            setTimeout(checkLinks, 100, possibleLinks, index+1, asimages);
    }
    else{
        // all requests were send
//      pageLinkFlag = true;
    }
}

/*
function checkLink(links, index, asimages){
    if (index < links.length){
        var link = links[index];
        var children = link.childNodes;
        for (var i = 0; i < children.length; i++){
            var child = children[i];
            var wait = false;
            if (child && child.nodeName == 'IMG'){
                // only jpeg thumbnails
                if (isJpg(child.src)){
                    possibleImageCount++;
                    var pageLink = new PageLink(link, child.src);
                    possibleLinks.push(pageLink);
                    break;
                    
                    
                    var xmlhttp1 = new XMLHttpRequest();
                    xmlhttp1.onload = function(){
                        retrievedPagesCount++;
                        parsePage(link, xmlhttp1, asimages, child.src);
                    }
                    xmlhttp1.onerror = function(){
                        retrievedPagesCount++;
                    }
                    xmlhttp1.open('GET', link.href);
                    xmlhttp1.send(null);
                    wait = true;
                    break;
                }
            }
        }
        // wait before sending the next request
        if (wait)
            setTimeout(checkLink, 100, links, index+1, asimages);
        else
            checkLink(links, index+1,asimages);
    }else{
        visitedFrameCount++;
        pageLinkFlag = true;

        if (possibleImageCount == 0){
            possibleImageCount = -1;
            retrievedPagesCount = -1;
        }

    }
}
*/

/*
 * Parse requested page, find largest image and add it to image list.
 */
function parsePage(link, request, asimages, thumb){
    if (request.status == 200 && slideshowRunning){
        
        var doc = request.responseText;
        var maxWidth = -1;
        var maxHeight = -1;
        var img;
        var foundflag = false; // true if image with specified width and height was found
        var numJpgs = 0;
        var firstJpg = null;
                
        // get all images on page
        var images = doc.match(/\<img\s(.|\r|\n)*?\>/ig);
        debug("AutoSlideshow: findImages: found " + images.length + " images on linke page.");
        if (images){
            for (var i = 0; i < images.length; i++){
                // get image src
                var src = getAttribute(images[i], /src\=((.|\r|\n)*)$/i);
                var jpg = false;
                if (isJpg(src)){
                    numJpgs++;
                    jpg = true;
                    if (!firstJpg)
                        firstJpg = src;
                }
                // get image width and height
                var width = getAttribute(images[i], /width\=((.|\r|\n)*)$/i);
                var height = getAttribute(images[i], /height\=((.|\r|\n)*)$/i);
                if (width && height){
                    if (width.indexOf("%") < 0 && height.indexOf("%" < 0)){
                        var w = parseInt(width);
                        var h = parseInt(height);
                        if (jpg)
                            foundflag = true;
                        // image has minimum size?
                        if (w >= imageSelectionImagesMinWidth && h >= imageSelectionImagesMinHeight ){
                            // new largest image?
                            if (w > maxWidth && h > maxHeight){
                                maxWidth = w;
                                maxHeight = h;
                                img = src;
                            }
                        }
                    }
                }
            }
            // no image detected, but there is exactly one jpg without specified width and height
            // suppose this is the one we are looking for
            //alert(foundflag + "  " + numJpgs);
            if (!foundflag && numJpgs == 1){
                img = firstJpg;
            }
        }
        // add argest image
        if (img){
            debug("AutoSlideshow: findImages: image found: " + img);
            // absolute path?
            if (img.indexOf("://") < 0){
                // relative path
                var p = link.href.lastIndexOf("/");
                img = link.href.substring(0, p+1) + img;
            }
            asimage = new ASImage(img, thumb)
            addImage(asimages, asimage);
            showImageCount();       
        }
        
    }
}

/*
 * Get attribute of image tag: src, width, height
 */
function getAttribute(text, regexp){
    if (!text.match(regexp))
        return null;
    var attr = RegExp.$1;
    var quoteChar = attr[0]; 
    var attrlen;
    if (quoteChar == '\"' || quoteChar == '\''){
        attrlen = attr.slice(1).indexOf(quoteChar); 
        attr = attr.substr(1, attrlen);
    }
    else{
        attrlen = Math.min(attr.indexOf(" "), attr.indexOf(">"));
        attr = attr.substr(0, attrlen);
    }
    return attr;
}


function contains(array, item){
    for (var i=0; i < array.length; i++)
    {
        if (array[i].getImgsrc() == item)
        {
            return true;
        }
    }
    return false;
}


var maxgap; // number of images which can be skipped
var gapcount; // current count of skipped images
/**
 * Autodected images with similar names. 
 * When an images is shown in the browser, autoslideshow tries to find all 
 * images with the same name and successive or preceding numbers.
 */
function checkNextImage(asimages, url, parsedURL, success, failed)
{
    if (!slideshowRunning)
        return;

    var xmlhttp = new XMLHttpRequest();
    requests.push(xmlhttp);

    xmlhttp.open('HEAD', url, true);
//  xmlhttp.setRequestHeader("accept", "image/jpeg");
    
    xmlhttp.onerror=function()
    {
//      alert("error");
    }
    xmlhttp.onload=function()
    {
        //if (xmlhttp.readyState==4) 
        {
            if (!slideshowRunning)
                return;
                
            if (xmlhttp.status!=200){
//              alert("fehler: " + url);
            }
            else
            {
                var content = xmlhttp.getResponseHeader("content-type");
                // image returned by request:
                if (content.indexOf("image") == 0){
                    parsedURL.gapcount = 0; // reset counter
//                  alert(url);
                    var asimage = new ASImage(url, url);
                    if (parsedURL.direction>0)
                        addImage(asimages, asimage);
                    else
                        asimages.unshift(asimage);
                    parsedURL.imageNum += parsedURL.direction;
                    url = parsedURL.createURL();
                    checkNextImage(asimages, url, parsedURL, success, failed);
                    return;
                }
            }
            // no image returned            
            {
                parsedURL.gapcount++;
                // check gap between last retrieved image and current index
                if (parsedURL.gapcount > maxgap){
                    // finish or go into opposite direction
                    if (parsedURL.direction > 0 && (parsedURL.firstImageNum + parsedURL.direction >= 0)){
                        // find previous images
                        parsedURL.direction = -1;
                        parsedURL.gapcount = 0;
                        parsedURL.imageNum = parsedURL.firstImageNum + parsedURL.direction;
                        url = parsedURL.createURL();
                        checkNextImage(asimages, url, parsedURL, success, failed);
                    }else{
                        // finish search
                        finished(asimages, success, failed);
                    }
                }
                // skip current index, try next one
                else if (parsedURL.imageNum + parsedURL.direction >= 0){
                    parsedURL.imageNum += parsedURL.direction;
                    url = parsedURL.createURL();
                    checkNextImage(asimages, url, parsedURL, success, failed);
                }
                // nothing left
                else{
                    // finish search
                    finished(asimages, success, failed);
                }
            }
        }
    }
    try{
        xmlhttp.send(null);
    }catch(e){
        // finished search
        finished(asimages, success, failed);
    }
}




function checkExpirationTimes(asimages){
    for (var i = 0; i < asimages.length; i++){
        checkExpirationTime(asimages[i].imgsrc);
        checkExpirationTime(asimages[i].thumbsrc);
    }
}

function checkExpirationTime(URL){
    // timeout: now + 10 minutes
    var timenow = parseInt((new Date().getTime())) / 1000 + 600;
    
    try {
        var cacheEntryDescriptor = httpCacheSession.openCacheEntry(URL, nsICacheEntryDescriptor, false);
        if (cacheEntryDescriptor.expirationTime < timenow) {
            cacheEntryDescriptor.setExpirationTime(timenow);
            cacheEntryDescriptor.markValid();
        }
        cacheEntryDescriptor.close();
        try {
            cacheEntryDescriptor = httpCacheSession.openCacheEntry(URL, nsICache.ACCESS_READ, false);
        } catch(ex) {}
    } catch(e) {}
}

// abort all requests
function abortRequests(){
    if(requests){
        for(var i=0; i<requests.length; i++){
            if(requests[i])
                requests[i].abort();
        }
    }
}


function ParsedURL(url){
    var self = this;
    this.firstImageNum; // the basic image number
    this.imageNum; // the current image number
    this.leadingURL; // the part of the url before the number
    this.trailingURL; // the part of the url afte the number
    this.numLength; // the length of the number
    this.gapcount = 0;
    this.direction = 1;
    
    this.parseURL = function(url){
        var dotPos = url.lastIndexOf(".");
        var i;
        // find the first number:
        for (i=dotPos-1; i>=0; i--)
        {
            var c = url.charCodeAt(i);
            if (c >=48 && c <= 57)
            {
                dotPos = i + 1;
                break;
            }
        }
        // find the last number
        for (i=dotPos-1; i>=0; i--)
        {
            var c = url.charCodeAt(i);
            if (c <48 || c > 57)
            {
                var c2 = url.charAt(i);
                break;
            }       
        }
        var num = url.substring(i+1, dotPos);
        self.numLength = num.length;
        self.firstImageNum = Number(num);
        self.imageNum = self.firstImageNum;
        self.leadingURL = url.substring(0,i+1);
        self.trailingURL = url.substr(dotPos);
    }

    // fills the number with leading zeros
    this.fill = function(num, requiredLength){
        var res = "";
        for (var i=0; i < requiredLength - num.length; i++){
            res = res + "0";
        }
        return res + num;
    }
    
    // creates the url with the current imageNum
    this.createURL = function(){
        // fill with leading zeros
        var newnum = self.fill("" + self.imageNum, self.numLength);
        return self.leadingURL + newnum + self.trailingURL;
    }
    
    this.parseURL(url);
}


function addImage(asimages, image){
	asimages.push(image);
	enabledImagesLength++;
}

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// 
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++


