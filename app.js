/*
   ____  _________      _       __                                   
  / __ \/ __/ __(_)____(_)___ _/ /                                   
 / / / / /_/ /_/ / ___/ / __ `/ /                                    
/ /_/ / __/ __/ / /__/ / /_/ / /                                     
\____/_/ /_/ /_/\___/_/\__,_/_/                                      
    __                    ___                ____            ___     
   / /   ____ _____  ____/ (_)___  ____ _   / __ \____ _____/ (_)___ 
  / /   / __ `/ __ \/ __  / / __ \/ __ `/  / /_/ / __ `/ __  / / __ \
 / /___/ /_/ / / / / /_/ / / / / / /_/ /  / _, _/ /_/ / /_/ / / /_/ /
/_____/\__,_/_/ /_/\__,_/_/_/ /_/\__, /  /_/ |_|\__,_/\__,_/_/\____/ 
                                /____/                               

								
*/



var consumer_key = "3639977c6b851d8b90c1c15e660c9188";
var soundcloudPlaylistUrl = "https://soundcloud.com/sulfurhead/sets/official-landing-radio";
var youtubePlaylist = "PLrvousvE2SUxtpO76PEGaRp1yFspbnbVV";

soundManager.url = '/swfs/';
soundManager.flashVersion = 9;
soundManager.useFlashBlock = false;
soundManager.useHighPerformance = true;
soundManager.wmode = 'transparent';
soundManager.useFastPolling = true;
soundManager.debugMode = false;

var mobile = false;

$(document).ready(function () {
	$("#toolbar").hide();
	$("#tracklist").hide();
	$("#atitle").hide();
	
	if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
		mobile = true;
		$("#vnext").hide();				
	}

	// init youtube api
	var tag = document.createElement('script');
	tag.src = "https://www.youtube.com/iframe_api";
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
	// force video resize
	resizevideo();

	// attach resize event and ensure resize both while and after window resize
	var timeout;
	$(window).resize(function () {
		resizevideo();
		clearTimeout(timeout);
		timeout = setTimeout(resizevideo, 100);
	});

	//init soundManager
	soundManager.onready(function () {
		//request playlist
		$.getJSON("https://api.soundcloud.com/resolve?url=" + soundcloudPlaylistUrl + "&format=json&consumer_key=" + consumer_key + "&callback=?",
		  function (playlist) {
			  //shuffle playlist
			  shuffle(playlist.tracks);
			  //shows first track title
			  $("#atitle").html("<b>" + playlist.tracks[0].user.username + "</b> - " + playlist.tracks[0].title);
			  //builds tracklist
			  $.each(playlist.tracks, function (index, track) {
				  // create a list item for each track + data
				  $("<li><b>" + track.user.username + "</b> - " + track.title + "</li>").data("track", track).appendTo("#tracks");
				  url = track.stream_url;
				  url += (url.indexOf("secret_token") == -1) ? "?" : "&";
				  url += "consumer_key=" + consumer_key;

				  soundManager.createSound({
					  id: "track_" + track.id,
					  url: url,
					  onplay: function () {
						  $("#aplayer").addClass("playing");
						  $("#atitle").html("<b>" + track.user.username + "</b> - " + track.title);
						  $("#atitle").fadeIn(500).delay(5000).fadeOut();
						  $("#playpauseico").removeClass("fa fa-play");
						  $("#playpauseico").addClass("fa fa-pause");
						  vplayer.playVideo();
					  },
					  onresume: function () {
						  $("#aplayer").addClass("playing");
						  $("#playpauseico").removeClass("fa fa-play");
						  $("#playpauseico").addClass("fa fa-pause");
						  vplayer.playVideo();
					  },
					  onpause: function () {
						  $("#aplayer").removeClass("playing");
						  $("#playpauseico").removeClass("fa fa-pause");
						  $("#playpauseico").addClass("fa fa-play");
						  vplayer.pauseVideo();
					  }
				  });
			  });

			  // GUI

			  // Bind a click event to each list item we created above.
			  $("#tracks li").on("click", function () {
				  // Create a track variable, grab the data from it,
				  // and find out if it's already playing *(set to active)*
				  var $track = $(this),
					data = $track.data("track"),
					playing = $track.is(".active");

				  if (playing) {
					  // If it is playing: pause it.
					  soundManager.pause("track_" + data.id);
				  } else {
					  // If it's not playing: stop all other sounds
					  // that might be playing and play the clicked sound.
					  if ($track.siblings("li").hasClass("active")) {
						  soundManager.stopAll();
					  }
					  soundManager.play("track_" + data.id);
				  }
				  // Finally, toggle the *active* state of the clicked li
				  // and remove *active* from and other tracks.
				  $track.toggleClass("active").siblings("li").removeClass("active");
			  });

			  // Bind a click event to the play / pause button.
			  $("#playpause").on("click", function () {
				  if ($("li").hasClass("active")) {
					  // If a track is active, play or pause it depending on current state.
					  soundManager.togglePause('track_' + $('li.active').data('track').id);
				  } else {
					  // If no tracks are active, just play the first one.
					  $('#tracks li:first').click();
				  }
			  });

			  // Bind a click event to the next button, calling the Next Track function.
			  $('#anext').on('click', function () {
				  if ($("#playpauseico").is(".fa-pause")) {
					  // Stop all sounds
					  soundManager.stopAll();
					  // Click the next list item after the current active one.
					  // If it does not exist *(there is no next track)*, click the first list item.
					  if ($('li.active').next().click().length == 0) {
						  $('#tracks li:first').click();
					  }
				  }
			  });

			  // Bind a click event to the next video button only
			  $("#vnext").click(function () {
				  if ($("#playpauseico").is(".fa-pause")) {
					  vplayer.nextVideo();
				  }
			  });

			  // Bind a click event to toggle playlist visibility
			  $("#toggleplaylist").click(function () {
				  $("#tracklist").fadeToggle("fast", "linear");
			  });

		  });
	});

});


/* youtube iframe functions */

var vplayer;
var firstLoad = true;

function onYouTubeIframeAPIReady() {
	vplayer = new YT.Player('container-video', {
		playerVars: {
			'controls': 0,
			'showinfo': 0,
			'modestbranding': 1,
			'autoplay': 1,
			'rel': 0,
			'wmode': "transparent"
		},
		events: {
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange,
			'onError': onPlayerError
		}
	});
}


function onPlayerReady(event) {
	var pl = {
		'list': youtubePlaylist,
		'listType': 'playlist',
		'suggestedQuality': 'small'
	};
	event.target.mute();
	event.target.cuePlaylist(pl);
}

function onPlayerStateChange(event) {
	//ENDED - 1
	if (event.data == YT.PlayerState.ENDED) {
		next();
	}

	// PLAYING - 2
	if (event.data == YT.PlayerState.PLAYING) {
		if (firstLoad)	//playing for the first time...
		{
			firstLoad = false;
			$("#container-static").fadeOut(1000);
			$("#toolbar").fadeIn(1000);
			$('#tracks li:first').click(); //start audio!
		}
	}
	// CUED - 5
	if (event.data == YT.PlayerState.CUED) {
		event.target.setShuffle(true);
		event.target.setLoop(true);
		var playlistArray = vplayer.getPlaylist();
		var randomStart = Math.floor(Math.random() * playlistArray.length);
		event.target.playVideoAt(randomStart);
	}
}

function onPlayerError(event) {
	console.log(event);
}

/* misc functions */

function shuffle(o) {
	for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
}

function resizevideo() {
	// Get viewport informations
	var height = $(window).height();
	var width = $(window).width();
	// Calculate height and width considering 16/9 ratio
	var calcH = height * (16 / 9);
	var calcW = width * (9 / 16);
	// Calculate left and top position to center player
	var left = (width - calcH) / 2;
	var top = (height - calcW) / 2;
	// Responsive player, size and position
	if (width < calcH) {
		$("#container-video").css("width", calcH);
		$("#container-video").css("height", height);
		$("#container-video").css("left", left);
		$("#container-video").css("top", "");
	} else {
		$("#container-video").css("width", width);
		$("#container-video").css("height", calcW);
		$("#container-video").css("top", top);
		$("#container-video").css("left", "");
	}
}
