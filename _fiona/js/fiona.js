
	//defaults
	var collapseAllOnDirectLink = false;
	var uplink = true;
	var searchable = true;
	var shownotes = true;
	var showtitlebar = true;
	var default_expanded = true;
	var default_expandable = true;

	var config = {};

	var exception_state_list = [];
	var exception_ability_list = [];

	var IMG = 0;
	var TXT = 1;
	var DIR = 2;
	var AUD = 3;
	var VID = 4;
	var DOC = 5;
	var MD  = 6;
	
	var listing;
	var dynLoadedFiles = "";
	var videocount = 0;
	var audio = [];

	

//================================================================================================


	//DOM is ready for JavaScript code to execute
    $( document ).ready(function() {
    	console.log("================== DOCREADY =====================");
    	checkURL();
    	loadRules();

		$('.button').click(function () {
			if(expanded) {
				resetListing();
			} else { 
				processListing();
			}
		});


	});

    //completely loaded all content
	window.onload = function() {
		console.log("================== ONLOAD =====================");
		if(directLink && directLinkFound) {
			scrollToDiv(document.getElementById(directLinkFile));
    	}
	}

//================================================================================================

	var url;
	var directLink = false;
	var directLinkFile;
	var directLinkFound = false;

	function checkURL() {
		url = document.URL;
		var i = url.lastIndexOf("/")+1;
		if(url.charAt(i) == '#') {
			if(url.length > (i+1)) {
				directLink = true;
				directLinkFile = url.substring(i+1, url.length);
				console.log(directLinkFile);
			}
			url = url.substring(0, i);
		} 
	}


	function loadRules() {
		jQuery.get("fiona.config" , parseConfig).fail(parseConfig);
	}

	function rulesFinished() {

		processListing();

    	if(searchable) {
    		initSearch();
    	}

		marked.setOptions({ renderer: new marked.Renderer(), gfm: false });
	}


//================================================================================================
/*function initAudio() {
     audiojs.events.ready(function() {
     	//if(as == undefined) {
	    	audio = audiojs.createAll();
		//}
  	});
 }*/

	function parseConfig(data) {
		if(typeof data == "string") {
		    var regex = {
		        section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
		        param: /.*\S.*/,
		        keyval: /^\s*([\w\.\-\_]+)\s*=\s*(.*?)\s*$/,
		        comment: /^\s*;.*$/
		    };

		    var lines = data.split(/\r\n|\r|\n/);
		    var section = null;
		    lines.forEach(function(line){
		        //comment
		        if(regex.comment.test(line)) {
		            return;
		        } 
				//section
		        else if(regex.section.test(line)) {
		            var match = line.match(regex.section);
		            config[match[1]] = {};
		            section = match[1];
		        } 
		        //keyvalue
		        else if(regex.keyval.test(line)) {
		            var match = line.match(regex.keyval);
		            if(section){
			        	config[section][match[1]] = match[2];
		            }else{
		                config[match[1]] = match[2];
		            }
		        } 
		        //listitem
		        else if(regex.param.test(line)) {
		            var match = line.match(regex.param);
					if(section === "exception_state") {
						exception_state_list.push(match[0]);
					} else if(section === "exception_ability") {
						exception_ability_list.push(match[0]);
					}
		        } 
		    });


		    if(typeof config.general.default_state !== "undefined") {
		    	if(config.general.default_state === "expanded") {
		    		default_expanded = true;
		    	} else if(config.general.default_state === "collapsed") {
					default_expanded = false;
		    	}
		    }
		    if(typeof config.general.default_ability !== "undefined") {
		    	if(config.general.default_ability === "expandable") {
		    		default_ability = true;
		    	} else if(config.general.default_ability === "nonexpandable") {
					default_ability = false;
		    	}
		    }

			assignConfigBool(config.general.showParentLink, "uplink");
			assignConfigBool(config.general.showSearch, "searchable");
		    assignConfigBool(config.general.showItemBar, "showtitlebar");
		    assignConfigBool(config.general.showItemNotes, "shownotes");
		    assignConfigBool(config.general.collapseOthersOnDirectLink, "collapseAllOnDirectLink");

		} else {
			console.log("NO CONFIG...using defaults");
		}
	    
		//console.log(">>>: " +JSON.stringify(config, null, 4));
		rulesFinished();
	}


//================================================================================================


	function checkRuleState($link) {
		if(directLink) {
			if(!directLinkFound) {
				if(directLinkFile == decodeURIComponent($link)) {
					directLinkFound = true;
					return true;
				} else {
					if(collapseAllOnDirectLink) {
						return false;
					}
				}
			} else {
				if(collapseAllOnDirectLink) {
					return false;
				}
			}
		} 			

		var state = jQuery.inArray(decodeURIComponent($link), exception_state_list);
//		var state = exception_state_list.indexOf(decodeURIComponent($link));
		if(default_expanded == true) {
			if(state == -1)	return true;
			else return false;
		} else {
			if(state == -1)	return false;
			else return true;
		}
	}

	function checkRuleAbility($link) {
		var ability = jQuery.inArray(decodeURIComponent($link), exception_ability_list);
		if(default_expandable == true) {
			if(ability == -1)	return true;
			else return false;
		} else {
			if(ability == -1)	return false;
			else return true;
		}
	}


//================================================================================================

	function resetListing() {
		$('pre').html(listing);
		$('input').remove();
		$('.navigation').remove();
		$('hr.nav').remove();
		$('pre').removeAttr("id");
		$('pre').removeAttr("class");
		expanded = false;
	}


    function processListing() {
    	listing = $('pre').html();

		//$('pre').attr('id', 'sortable');
	 	$('pre').attr('id', 'search-list');

		//insert navigation-div
		$('pre').before('<div class="navigation"></div><hr class="nav" />');

	 	if(searchable) {
	 		$('.navigation').prepend('<input class="search" id="search-input" type="text" value="" placeholder="search">');
	 	}

		//remove "ParentDirectory"-Link
		if(!uplink) {
			$('pre img[alt="[PARENTDIR]"] + a').remove();
			$('pre img[alt="[PARENTDIR]"]').remove();
		} else {
			$('pre img[alt="[PARENTDIR]"] + a').attr("class", "backlink");
		}

		//wrap all textnodes inside pre
		$('pre').contents().filter(function() {
		  return this.nodeType == 3;
		}).wrap('<div class="metainfo"></div>');

		//trim and remove "empty" text-nodes
		$('pre div.metainfo').each(function() {
			if( $(this).html().trim() == '') {
				$(this).remove();
			}
		});

		//remove sorting-table-headers
		$('pre a:lt(3)').each(function() {
   			$(this).remove();
		});

		//wrap listentries (icon, a and metatext)
		$('img + a + div.metainfo').each(function() {
			var $u = $(this).prev().andSelf().prev();
			if(showtitlebar) {
				$u.wrapAll('<div class="listentry"><div class="entrytitle"></div></div>');
			} else {
				$u.wrapAll('<div class="listentry"><div class="entrytitle hidden"></div></div>');
			}
			$(this).prev().children().first().append($(this));
		});

	 	expanded = true;
	 	handleContent();
	}


//================================================================================================

    function handleContent() {

		//determine file-type and handle it
		$('pre div.listentry').each(function() {

			$linknode = $(this).children('.entrytitle').children('a');
			$link = $linknode.attr('href');
		
			$(this).attr("id", $link);

			var re_image = /.jpg|.gif|.png|.jpeg/;
			var re_text = /.txt|.html|.css|.js|.sh/;
			var re_folder = '/';
			var re_audio = /.mp3|.wav|.aif|.ogg/;
			var re_video = /.mp4|.ogv|.webm|.avi/;
			var re_doc = /.pdf|.odt|.odp|.ods/;
			var re_md = /.md/;

			var type = null;

			if($link.match(re_image)) {
				type = IMG;
			} 
			else if($link.match(re_text)) {
				type = TXT;			
			}
			else if($link.match(re_folder)) {
				type = DIR;			
			}
			else if($link.match(re_audio)) {
				type = AUD;			
			}
			else if($link.match(re_video)) {
				type = VID;			
			}
			else if($link.match(re_doc)) {
				type = DOC;			
			}
			else if($link.match(re_md)) {
				type = MD;			
			}

			if(type == DIR) {
				handleTypeFolder($linknode, $link);
			} else if(type != null) {
				var state = checkRuleState($link);
				var ability = checkRuleAbility($link);

				if(state) state = "expanded";
				else state = "collapsed";

				if(state != null && ability != false ) {
	 				registerClickHandler($linknode, $link, state, type);
	 				if(state == "expanded") {
	 					handleTypes($linknode, $link, state, type);
					}
				}
			}
		});
    } //end handleContent

    function handleTypes($linknode, $link, state, type) {
		if(type == IMG) {
			handleTypeImage($linknode, $link, state);
		} 
		else if(type == TXT) {
			handleTypeText($linknode, $link, state);			
		}
		else if(type == AUD) {
			handleTypeAudio($linknode, $link, state);			
		}
		else if(type == VID) {
			handleTypeVideo($linknode, $link, state);			
		}
		else if(type == DOC) {
			handleTypeDocument($linknode, $link, state);			
		}
		else if(type == MD) {
			handleTypeMarkdown($linknode, $link, state);			
		}

		$linknode.parent().parent().attr("alt", "loaded");

		if(shownotes) {
			checkForAnnotation($linknode, $link);
		}
    }

	function handleTypeImage($linknode, $link, state) {
	  $linknode.parent().parent().append('<a href="' +$link +'"><img src="' +$link +'" class="image" /></a>');
	}

	function handleTypeText($linknode, $link, state) {
		jQuery.get($link, function(data) {
				  var $text = data;
				  $node = $('<div class="text"></div>');
				  //$node.html($text);
				  $node.text($text);
				  $linknode.parent().parent().append($node);
		});	
	}

	function handleTypeFolder($linknode, $link) {
	  removeMetainfo($linknode);
	  if($linknode.html() == "Parent Directory") {
	  	$linknode.html("..");
	  }
	  $('div.navigation').append($linknode.parent().parent());

	}


	function handleTypeAudio($linknode, $link, state) {
	  	//dynLoadJs("js/audiojs/audio.js", "js");
	  	if(state) {
	  		$node = $('<audio preload="auto"><source src="./' +$link +'"  /></audio>');
		  	$linknode.parent().parent().append($node);
		  	var au = audiojs.create($node, {});
		  	audio.push(au[0]);
		} else {
 			for (var i in audio) {
 				var s = audio[i].source.src;
 				s = s.substring(s.lastIndexOf("/")+1 ,s.length);
 				if(s == $link) {
 					audio[i].pause();
 					break;
 				}
 			}
 		}
	}
	
	function handleTypeVideo($linknode, $link, state) {
		if(state) {
		  	$linknode.parent().parent().removeAttr("id");
	  		$node = $('<video id="dirlistvideo_' +videocount +'" class="video-js vjs-default-skin" width="640" height="264">\
	  						   <source src="' +$link +'" type="video/mp4"></video>');
	  		$linknode.parent().parent().append($node);
	  		_V_(("dirlistvideo_" +videocount), {"controls": true, "autoplay": false, "preload": "auto"}, function(){});
	  		videocount++;
	  	} else {
		 	for (var i = videocount-1; i >= 0; i--) {
				var v = _V_(("dirlistvideo_" +i));//  .pause();	 
				var s = v.currentSrc();
				s = s.substring(s.lastIndexOf("/")+1 ,s.length);
				if(s == $link) {
					v.pause();
				}
			}
		}
	}
	
	function handleTypeDocument($linknode, $link, state) {
		//$node = $('<iframe src = "' +baseurl +'_fiona/js/ViewerJS/#' +url +$link  +'"  width="99%" height="400" allowfullscreen webkitallowfullscreen></iframe>');
		$node = $('<iframe src = "/_fiona/js/ViewerJS/#' +url +$link  +'"  width="99%" height="400" allowfullscreen webkitallowfullscreen></iframe>');
		$linknode.parent().parent().append($node);
	}

	function handleTypeMarkdown($linknode, $link, state) {
		jQuery.get($link, function(data) {
				  var $text = data;
				  $node = $('<div class="markdown-body"></div>');
				  $node.html(marked($text));
				  $linknode.parent().parent().append($node);
		});	
	}


	function removeMetainfo($siblingnode) {
		  $siblingnode.next().remove();
	}

	function removeIcon($siblingnode) {
		  $siblingnode.prev().remove();
	}


//util================================================================================================

	function assignConfigBool(value, assgnvarname) {
		window[assgnvarname] = (value === 'true' ? true : false);
	}

	function initSearch() {
		$('#search-list').liveFilter('#search-input', 'div', {
		  filterChildSelector: 'a:first()',  
		  	filter: function(el, val){
		             return $(el).text().toUpperCase().indexOf(val.toUpperCase()) >= 0;
		      },
		});
	}

	function scrollToDiv(elem){
		var scroll = elem.offsetTop;
		$('body,html').animate({ scrollTop: scroll }, 400);
	}


	function registerClickHandler($linknode, $link, state, type) {
	  	$linknode.parent().parent().attr("class", ("listentry " +state));
	  	$linknode.parent().click(function(e){
	  		if(!$(e.target).is("a")) {
	  			toggleCollapse($linknode, $link, state, type);
	  		}
  		});
    }

    function checkForAnnotation($linknode, $link) {
		$link = $link +".note";
		jQuery.get($link, function(data) {
				  var $text = data;
				  $node = $('<div class="note"></div>');
				  $node.html($text);
				  // $node.text($text);
				  $linknode.parent().parent().append($node);
		}).fail(function(){});	
    }

    function toggleCollapse($linknode, $link, state, type) {
    	$elem = $linknode.parent().parent();
    	if($elem.attr("class") ==  "listentry collapsed") {
    		expandElem($linknode, $link, state, type);
    	} else if ($elem.attr("class") ==  "listentry expanded") {
    		collapseElem($linknode, $link, state, type);
    	}
    }

 	function collapseElem($linknode, $link, state, type) {
    	$elem.attr("class", "listentry collapsed");

 		if(type == AUD) {
 			handleTypeAudio($linknode, $link, false);
 		} else if(type == VID) {
 			handleTypeVideo($linknode, $link, false);
 		}
    }

    function expandElem($linknode, $link, state, type) {
    	$elem = $linknode.parent().parent();
    	$elem.attr("class", "listentry expanded");
    	if($elem.attr("alt") != "loaded") {
	    	handleTypes($linknode, $link, state, type);
	    }
    }


	function dynLoadJs(filename, filetype, callback) {
		$.getScript(filename)
			.done(function(script, textStatus) {
				if(callback != undefined) {
					callback();
			  	}
			})
			.fail(function(jqxhr, settings, exception) {
		  		console.log("Triggered ajaxError handler.");
		});
	}


	function dynLoadJsCss(filename, filetype) {
		if (dynLoadedFiles.indexOf("["+filename+"]") == -1){
			if (filetype == "js") {
				var fileref=document.createElement('script');
				fileref.setAttribute("type","text/javascript");
				fileref.setAttribute("src", filename);
				//fileref.onreadystatechange = callback;
    			//fileref.onload = callback;
			}
			else if (filetype == "css") {
				var fileref=document.createElement("link");
				fileref.setAttribute("rel", "stylesheet");
				fileref.setAttribute("type", "text/css");
				fileref.setAttribute("href", filename);
			}
			if (typeof fileref != "undefined") {
				document.getElementsByTagName("head")[0].appendChild(fileref);
			}
			dynLoadedFiles+="["+filename+"]";
		} else {
	  		//alert("file already added!");
	  	} 	
	}


//================================================================================================


