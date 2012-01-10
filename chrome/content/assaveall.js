var gBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
var autoslidestrings = gBundle.createBundle("chrome://autoslideshow/locale/autoslideshow.properties");
var prefs;

function init(){
	prefs = Components.classes["@mozilla.org/preferences-service;1"]
	                                .getService(Components.interfaces.nsIPrefService);
	 prefs = prefs.getBranch("extensions.AutoSlideshow.");
	 	
	var images = window.arguments[0];
	var selectedImage = window.arguments[1];
	
	var lastSaveDir = prefs.getCharPref("lastSaveDir");
	
	var list = document.getElementById("AutoSlideshow-Listbox-imagelist");
	var dest = document.getElementById("AutoSlideshow-Textbox-destfolder");
	
	// load all images into the list:
	for (var i = 0; i < images.length; i++){
		list.appendItem(images[i].getImgsrc(), images[i].getImgsrc());
	}
	
	if (selectedImage >= 0){
		list.selectedIndex = selectedImage;
	}
	
	dest.value = lastSaveDir;
}

function doSelectAll(){
	var list = document.getElementById("AutoSlideshow-Listbox-imagelist");
	list.selectAll();
}

function doOK(){
	return saveImages();
}

function doCancel(){
	
}

function chooseDestinationFolder(){
	var dest = document.getElementById("AutoSlideshow-Textbox-destfolder");
	
	var dir = Components.classes["@mozilla.org/file/local;1"].
		createInstance(Components.interfaces.nsILocalFile);
	var filechooser = Components.classes["@mozilla.org/filepicker;1"].
		createInstance(Components.interfaces.nsIFilePicker);

	try{
		dir.initWithPath(dest.value);
		filechooser.displayDirectory = dir;
	}
	catch(e){}
	
	filechooser.init(window, autoslidestrings.GetStringFromName("SaveAllDialog"), filechooser.modeGetFolder);
	if(filechooser.show() == filechooser.returnOK) {
		dest.value = filechooser.file.path;
	}
}

function saveImages(){
	var dest = document.getElementById("AutoSlideshow-Textbox-destfolder");
	var dir = Components.classes["@mozilla.org/file/local;1"].
		createInstance(Components.interfaces.nsILocalFile);

	try{
		dir.initWithPath(dest.value);
	}
	catch(e){
		alert(autoslidestrings.GetStringFromName("SaveDirectory"));
		return false;
	}
	
	if (!dir.exists()){
		file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0664);
	}
	if (!dir.exists()){
		alert(autoslidestrings.GetStringFromName("SaveDirectory"));
		return false;
	}
	prefs.setCharPref("lastSaveDir", dir.path);														
	dm = Components.classes["@mozilla.org/download-manager;1"].getService(Components.interfaces.nsIDownloadManager);

	var list = document.getElementById("AutoSlideshow-Listbox-imagelist");
	var items = list.selectedItems;
	for (var i = 0; i < items.length; i++){
		saveImage(dm, dir.path, items[i].value);
	}		
}



/*
	Saves the image with the specified index. If a file with the same name already exists
	an number is appended to the filename.
*/
function saveImage(dm, dir, imgsrc){
    var fromUri = Components.classes["@mozilla.org/network/standard-url;1"]
                            .createInstance(Components.interfaces.nsIURI);
    var file = Components.classes["@mozilla.org/file/local;1"]
                            .createInstance(Components.interfaces.nsILocalFile);

	var img = imgsrc

    
	fromUri.spec = img;  
    var uriparts = img.split("/");
	var filename = uriparts[uriparts.length - 1];
	var filenameparts = filename.split(".");
    file.initWithPath(dir + getPathSeparator() + encodeURIComponent(filename));

	var num = 0;
	while (true){
		if (!file.exists()){
			destFile = file;
			save(fromUri, file);
//			download(dm, fromUri, file, idx==0); // if it is the first image, we open the downloadmanager window
			break;
		}	
		else{
			file.initWithPath(dir + getPathSeparator() 
				+ encodeURIComponent(filenameparts[0]+"_"+num+"."+filenameparts[filenameparts.length-1]));
			num++;
		}
	}
}

function save(uri, targetFile) 
{ 
  var ioservice = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
  var persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"].createInstance(Components.interfaces.nsIWebBrowserPersist);
  persist.saveURI(uri, null, null, null, null, targetFile); 
}

/*
// downloads the fromUri to destFile using the download manager
function download(dm, fromUri, destFile, openDMWindow){
	var persist = makeWebBrowserPersist();
	var fileUri = makeFileURI(destFile);
		
	if (false){//openDMWindow){
		// hack! 
		// internalSave opens downloadmanager-window automatically
		// but it happens, that this window is opened multiple times, so we
		// use this method only for the first image
		

//		var dest = new AutoChosen(destFile, fromUri);
//		internalSave(fromUri, null, "AutoSlideshow: " + (downloadNextIndex+1)+ " / " + images.length , null,
//                       null, false, null,
//                       dest, null);
		dl = Components.classes["@mozilla.org/transfer;1"].createInstance(Components.interfaces.nsIDownload);
		dl.init(fromUri,fileUri,"",null,null,null,persist);
	
		var persistArgs = {source : fromUri, target : destFile, postData : null, bypassCache : false};
		
		persist.saveURI(fromUri, null, null, persistArgs, "AutoSlideshow", destFile);
		
		persist.progressListener = dl;

		//timerId = window.setInterval(checkLoad, 100);	
	}
	else{

//		persist.progressListener = 	downloadListener;
//		persist.saveURI(fromUri, null, null, persistArgs, "AutoSlideshow", destFile);

		
		
		// all other images are downloaded this way:
		//var persist = makeWebBrowserPersist();
		//var fileUri = makeFileURI(destFile);
		// var
		dl = dm.addDownload(Components.interfaces.nsIDownloadManager.DOWNLOAD_TYPE_DOWNLOAD, 
			fromUri, fileUri, fromUri.spec, null, null, new Date(), null, persist);
			
		var persistArgs = {source : fromUri, target : destFile, postData : null, bypassCache : false};
		
		persist.saveURI(fromUri, null, null, persistArgs, "AutoSlideshow", destFile);
		
		persist.progressListener = dl;

		//timerId = window.setInterval(checkLoad, 100);

	
		}
}
*/

function getPathSeparator() { 
    return navigator.platform.search(/win/i) == -1 ? "/" : "\\";
}


