/*
	//jquery image loader based on QueryLoader by Gaya Design
	//author: jsaade
	updates & fixes:
	- supports custom arguments no need for external CSS
	- can have several loaders/divs being loaded running not limited to only one
	- if the div itself has a background-image or if it is an image it is now taken into consideration.
	- resize when window is resized.
	
	arguments:
		- the id of the div, if not defined it is set to the body
		- an object defining the options to be used:
				- overlayColor: hex
				- userCallback: function to be called when the loader is done
				- showProgress: true/false
				- showProgressText: true/false
				- progressColor: hex
				- textColor: hex
				- textSize: in px
				- loaderPosition{top%,left%} => repositions the loader according to the overlay
				
	NB:
	- if there is a flash element, its wmode should be set to transparent, else it will be visible ontop of the overlay (might fix it using js soon).
	- make sure the div you are loading is visible else, its dimensions won;t be correct.		

	Usage Example:
	1-
	var loader= new Loader("#content", {userCallback:showContent, showProgress:true, showProgressText:true, textSize:15});
	loader.Start();
	
	2-
	var loader= new Loader("#content", {userCallback:showContent, showProgress:true, showProgressText:true, textSize:15, loaderPosition:{top:20,left:50}});
	loader.Start();
	
	the object has a Start fnction actually start the loading process.
	it will get all the images and background images, add them to a hidden div and after
	they are all loaded, call the doneLoading function
*/

function Loader(divid, options)
{
	if(!divid) divid = "body";
	this.div_id = divid;
	this.overlayColor = "#000000";
	this.userCallback = 0;
	this.showProgress = false;
	this.showProgressText = false;
	this.progressColor = "#ffffff";
	this.textColor = "#ffffff";
	this.textSize = "15";
	this.loaderPosition = {top:"50",left:"50"};
	if(options)//user has specified options?
	{
		this.overlayColor  = (!options.overlayColor)? this.overlayColor:options.overlayColor;
		this.userCallback  = (!options.userCallback)? this.userCallback:options.userCallback;
		this.showProgress  = (!options.showProgress)? this.showProgress:options.showProgress;
		this.showProgressText  = (!options.showProgressText)? this.showProgressText:options.showProgressText;
		this.progressColor  = (!options.progressColor)? this.progressColor:options.progressColor;
		this.textColor  = (!options.textColor)? this.textColor:options.textColor;
		this.textSize  = (!options.textSize)? this.textSize:options.textSize;
		
		if(options.loaderPosition)
		{
			this.loaderPosition.top  = (!options.loaderPosition.top)? this.loaderPosition.top:options.loaderPosition.top;
			this.loaderPosition.left  = (!options.loaderPosition.left)? this.loaderPosition.left:options.loaderPosition.left;
		}
		//debug
		this.debug = (!options.debug)? false:options.debug;
	}
	
	this.Stop = function()
	{
		if(!this.started) return;
	
		//this.userCallback = 0;
		clearTimeout(this.ieTimeout);
		
		if(!this.toLoadImages) return;
		
		
		for(var i = 0; i < this.toLoadImages.length; ++i)
			this.toLoadImages[i].unbind("load");
		this.toLoadImages = 0;	
		this.started = false;
	}
	
	
	this.Start = function()
	{
		if(this.started) return;
		if (navigator.userAgent.match(/MSIE (\d+(?:\.\d+)+(?:b\d*)?)/) == "MSIE 6.0,6.0") {
			//break if IE6	
			if(this.userCallback) this.userCallback();
			return;
		}
		
		this.images = this.getImages();
		
		if(this.images.length == 0)
		{
			if(this.userCallback) this.userCallback();
			return;
		}
		this.started = true;
		//create a box with height/width of the div and on top of it:
		this.width = $(this.div_id).outerWidth();
		this.height = $(this.div_id).outerHeight();
		this.position = $(this.div_id).offset();
		this.overlay = $("<div></div>").appendTo($(this.div_id));
		var overlyDesc = {
			'background-color':this.overlayColor,
			'z-index': '9999',
			'position':'fixed',
			'top': this.position.top,
			'left': this.position.left,
			'width': this.width + "px",
			'height': this.height + "px"
		};
		$(this.overlay).css(overlyDesc);
		//if(this.debug) alert(this.position.top);

		//attach load events:
		//load the images into a hidden div:
		this.preloader = $("<div></div>").appendTo(this.selectorPreload);
		$(this.preloader).css({
			height: 	"0px",
			width:		"0px",
			overflow:	"hidden"
		});
		this.imagesLoaded = 0;
		var parent = this;
		var callback = this.imgLoaded;
		
		if(this.showProgress)
		{
			this.loadBar = $("<div></div>").appendTo($(this.overlay));
			$(this.loadBar).css({
				'background-color': this.progressColor,
				'height': "1px",
				'position': "relative",
				'top': this.loaderPosition.top+"%",
				'width': "0%"
			});
		}
		if(this.showProgressText)
		{
			this.loadAmt = $("<div>0%</div>").appendTo($(this.overlay));
			$(this.loadAmt).css({
				'color':this.textColor,
				'font-family':'"Trebuchet MS",Arial,Helvetica,sans-serif',
				'font-size': this.textSize+'px',
				'font-weight':'bold',
				'line-height':'50px',
				'height':'50px',
				'width':'100px',
				'margin':'-60px 0 0 -50px',
				'position': "relative",
				'top': this.loaderPosition.top+"%",
				'left': this.loaderPosition.left+"%"
			});
		}
		
		
		//on resize
		var scope = this;
		$(window).resize(function() {
			if(!scope.overlay) return;
			scope.width = $(scope.div_id).outerWidth();
			scope.height = $(scope.div_id).outerHeight();
			scope.position = $(scope.div_id).offset();
			var overlyDesc = {
				'top': scope.position.top,
				'left': scope.position.left,
				'width': scope.width + "px",
				'height': scope.height + "px"
			};
		
		  $(scope.overlay).css(overlyDesc);
			
		 });
		
		
		this.toLoadImages = new Array();
		for (var i = 0; i < this.images.length; i++) {
			var imgLoad = $("<img></img>");
			$(imgLoad).attr("src", this.images[i]);
			$(imgLoad).unbind("load");
			
			$(imgLoad).bind("load", function() {
				callback(parent);
			});
			$(imgLoad).appendTo($(this.preloader));
			this.toLoadImages.push($(imgLoad));
		}
		
		
		
		//help IE drown if it is trying to die :)
		var scope = this;
		if($.browser.msie)
			this.ieTimeout = setTimeout(scope.ieLoadFix(scope), 2000);
	};
	
	this.ieLoadFix= function(scope) {
		while ((100 / scope.images.length) * scope.imagesLoaded < 100) {
			scope.imgLoaded(scope);
		}
	};
	
	this.animateLoader= function(scope) {
		var perc = (100 / scope.images.length) * scope.imagesLoaded;
		if (perc > 99) {
			if(scope.loadAmt)
				$(scope.loadAmt).html("100%");
			if(scope.loadBar)
			{
				$(scope.loadBar).stop().animate({
				width: perc + "%"
			}, 500, "linear", function() { 
				scope.doneLoading(scope);
			});
			}
			else
			scope.doneLoading();
		} else {
		
			if(scope.loadBar)
				$(scope.loadBar).stop().animate({
				width: perc + "%"
			}, 500, "linear", function() { });
			if(scope.loadAmt)
				$(scope.loadAmt).html(Math.floor(perc)+"%");
		}
	}
	this.imgLoaded = function(scope)
	{
		scope.imagesLoaded++;
		scope.animateLoader(scope);
	};
	
	this.doneLoading = function(scope){
		
		$(scope.preloader).remove();
		var cbk = scope.userCallback;
		if(this.started)
		{
			scope.overlay.fadeOut("slow",function(){$(this).remove(); if(cbk) cbk();});
		}else
			$(scope.overlay).remove();
		scope.overlay.fadeOut("slow",function(){$(this).remove(); if(cbk) cbk();});
		scope.overlay = 0;
		this.started = false;
		this.toLoadImages = 0;
		
		
	}
	
	//get all images
	this.getImages = function()
	{
		var imgs = new Array();
		
		//add own back image!
		var url = "";
		if ($(this.div_id).css("background-image") != "none") {
			url = $(this.div_id).css("background-image");
		}
		else if (typeof($(this.div_id).attr("src")) != "undefined" && $(this.div_id).attr("tagName").toLowerCase() == "img") {
				url = $(this.div_id).attr("src");
		}
		
		url = url.replace("url(\"", "");
		url = url.replace("url(", "");
		url = url.replace("\")", "");
		url = url.replace(")", "");
		if (url.length > 0) {
			imgs.push(url);
		}
		
		var p = this;
		var everything = $(this.div_id).find("*:not(script)").each(function() {
			var url = "";
			if ($(this).css("background-image") != "none") {
				url = $(this).css("background-image");
			} else if (typeof($(this).attr("src")) != "undefined" && $(this).attr("tagName").toLowerCase() == "img") {
				url = $(this).attr("src");
			}
			
			url = url.replace("url(\"", "");
			url = url.replace("url(", "");
			url = url.replace("\")", "");
			url = url.replace(")", "");
			
			if (url.length > 0) {
				imgs.push(url);
			}
		});
		return imgs;
	};
}

