var interval;


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// opacity effect
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function fadeOut(time, id) {
	if (slideshowPause)
		return;
	slideshowImage.style.opacity = 1;
    var steptime = 20;
	var opacStep = 2 * (-100) * steptime / time;
	window.clearInterval(interval);
	interval = window.setInterval("changeOpac(" + opacStep + ", " + 0 + ")", steptime);
}

function fadeIn(time, id) {
	if (slideshowPause)
		return;
	slideshowImage.style.opacity = 0;
    var steptime = 20;//Math.round(time / 100);
	var opacStep = 2* (100) * steptime / time;
	window.clearInterval(interval);
	interval = window.setInterval("changeOpac(" + opacStep + ", " + 0 + ")", steptime);
}

function changeOpac(dopacity, finalOpacity, id) {
	if (!slideshowPause && slideshowRunning){
		slideshowImage.style.opacity = (slideshowImage.style.opacity * 100 + dopacity) / 100;
		if (slideshowImage.style.opacity <= 0 || slideshowImage.style.opacity >= 1){
			window.clearInterval(interval);
		}
	}
}

/*
function opacity(opacStart, opacEnd, millisec) {
	if (slideshowPause)
	{
		return;
	}

	var object = slideshowImage.style;

    //speed for each frame
    var speed = Math.round(millisec / 100);
    var timer = 0;

    //determine the direction for the blending, if start and end are the same nothing happens
    if(opacStart > opacEnd) {
        for(var i = opacStart; i >= opacEnd; i--) {
            setTimeout("changeOpac(" + i +  ")",(timer * speed));
            timer++;
        }			

    } else if(opacStart < opacEnd) {
        for(var i = opacStart; i <= opacEnd; i++)
        {
            setTimeout("changeOpac(" + i +  ")",(timer * speed));
            timer++;

        }
    }
}

function changeOpac(opacity) {
	
	if (!slideshowPause && slideshowRunning)
	{
		var object = slideshowImage.style;
		object.opacity = (opacity / 100);
		object.MozOpacity = (opacity / 100);
	}
	
} 
*/

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// zoom effect
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function zoomEffect(initialWidth, initialHeight, finalWidth, finalHeight, time){
	if (slideshowPause)
		return;

	changeOpac(100);
	var obj = slideshowImage;
	var steptime = 20;

	obj.width = initialWidth;
	obj.height = initialHeight;
	center();

	var stepW = (finalWidth - initialWidth) * steptime / time;
	var stepH = (finalHeight - initialHeight) * steptime / time;
	var counter = 0;

	window.clearInterval(interval);
	interval = window.setInterval("resize(" + stepW + "," + stepH + "," + finalWidth +"," + finalHeight +")", steptime);
}

function resize(dx, dy, finalWidth, finalHeight){
	if (!slideshowPause && slideshowRunning){
	var obj = slideshowImage;

/*	
	obj.width += dx;
    obj.height += dy;
    center();
	
	
	if (dx < 0 && obj.width <= finalWidth)
		window.clearInterval(interval);
	else if (dx > 0 && obj.width >= finalWidth){
		window.clearInterval(interval);
		obj.width = finalWidth;
		center();
	}
*/
	if (dx > 0){
		obj.width = Math.min(finalWidth, obj.width + dx);
	    obj.height = Math.min(finalHeight, obj.height + dy);
/*	    	
	    	
		if (obj.width + dx >= finalWidth){
			window.clearInterval(interval);
			obj.width = finalWidth;
	    	obj.height = finalHeight;
		}
		else{
			obj.width += dx;
	    	obj.height += dy;
		}
		*/
		center();
	}else{
		obj.width = Math.max(finalWidth, obj.width + dx);
	    obj.height = Math.max(finalHeight, obj.height + dy);
	    /*
		if (obj.width + dx <= finalWidth){
			window.clearInterval(interval);
			obj.width = finalWidth;
	    	obj.height = finalHeight;
		}
		else{
			obj.width += dx;
	    	obj.height += dy;
		}
		*/
		center();
	}	   
	if (obj.width == finalWidth)
		window.clearInterval(interval);

	}
}
/*
function zoomEffect(initialWidth, initialHeight, finalWidth, finalHeight, millisec){
	if (slideshowPause)
	{
		return;
	}
	if (false){
		if (initialWidth > finalWidth)
			moveEffect(initialWidth, millisec);
		else
			moveEffect(finalWidth, millisec);
		return;
	}
	var object = slideshowImage;
	object.width = initialWidth;
	object.height = initialHeight;
	changeOpac(100);


	var stepW = (finalWidth - initialWidth) / millisec * 50;
	var stepH = (finalHeight - initialHeight) / millisec * 50;
	var timer = 0;


	var w;
	var h = initialHeight;
	if (finalWidth < initialWidth){
		for (var w = initialWidth; w > finalWidth; w += stepW, h += stepH) {
//			setTimeout("changeSize(" + w + "," + h +  ")", timer*50);
			setTimeout("resize(" + stepW + "," + stepH +  ")", timer*50);
			timer++;
		}	
	} else{
		for (var w = initialWidth; w < finalWidth; w += stepW, h += stepH) {
//			setTimeout("changeSize(" + w + "," + h + ")", timer*50);
			setTimeout("resize(" + stepW + "," + stepH +  ")", timer*50);
			timer++;
		}
	}
	setTimeout("changeSize(" + finalWidth + "," + finalHeight + ")", timer*50);
}

function resize(dw, dh){
	if (!slideshowPause && slideshowRunning){
		slideshowImage.width += dw;
		slideshowImage.height += dh;

		
		var layer = slideshowDocument.getElementById("imagebox");
		layer.style.width = slideshowImage.width;
		layer.style.height = slideshowImage.height;
		layer.style.marginLeft -= (dw);
		layer.style.marginTop -= (dh);
		
	}
}


function changeSize(w, h){
	if (!slideshowPause && slideshowRunning)
	{
		var object = slideshowImage;
		object.width = w;
		object.height = h;
	}
}
*/
