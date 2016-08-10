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

var consumer_key = "3639977c6b851d8b90c1c15e660c9188"; //SoundCloud API key
var soundcloudPlaylistUrl = "https://soundcloud.com/sulfurhead/sets/official-landing-radio"; //SoundCloud playlist URL
var youtubePlaylist = "PLrvousvE2SUxtpO76PEGaRp1yFspbnbVV"; //Youtube playlist Id

soundManager.url = '/swfs/';
soundManager.flashVersion = 9;
soundManager.useFlashBlock = false;
soundManager.useHighPerformance = true;
soundManager.wmode = 'transparent';
soundManager.useFastPolling = true;
soundManager.debugMode = false;

/* youtube iframe functions */

var vplayer;
var firstLoad = true;

function onYouTubeIframeAPIReady() {
  vplayer = new YT.Player('vplayer', {
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
    'suggestedQuality': 'highres'
  };
  event.target.mute();
  event.target.loadPlaylist(pl);
  setTimeout(function() {
    event.target.setShuffle(true);
    event.target.setLoop(true);
    var playlistArray = vplayer.getPlaylist();
    event.target.playVideoAt(Math.floor(Math.random() * playlistArray.length));
    event.target.playVideo();
    $('li:first').click(); //start audio!
  }, 1200);

}

function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.ENDED) {
    next();
  } else {
    if (firstLoad && event.data == YT.PlayerState.PLAYING) {
      firstLoad = false;
      $("#toolbar").fadeIn(1000);
      $("#vplayer").fadeIn(1000);
    }
  }
}

function onPlayerError(event) {
  console.log(event);
}

/* misc functions */

function shuffle(o) {
  for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
};

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
    $("#vplayer").css("width", calcH);
    $("#vplayer").css("height", height);
    $("#vplayer").css("left", left);
    $("#vplayer").css("top", "");
  } else {
    $("#vplayer").css("width", width);
    $("#vplayer").css("height", calcW);
    $("#vplayer").css("top", top);
    $("#vplayer").css("left", "");
  }
}

/* document ready javascript */

$(document).ready(function() {

  //create container for yt video
  var div = "<div id='front-background' style='position:fixed;width:100%;height:100%;z-index:2;' class='vignette'></div><div id='vplayer' style='position:fixed; width:100%; height:100%; z-index:1;'><div id='vplayer' style='position: absolute;'</div>";
  $("body").prepend(div);
  // init youtube api
  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  // force video resize
  resizevideo();

  //hide stuff
  $("#tracklist").hide();
  $("#toolbar").hide();
  $("#vplayer").hide();
  $("#atitle").hide();

  // attach resize event and ensure resize both while and after window resize
  var timeout;
  $(window).resize(function() {
    resizevideo();
    clearTimeout(timeout);
    timeout = setTimeout(resizevideo, 100);
  });

  //init soundManager
  soundManager.onready(function() {
    //request playlist
    $.getJSON("https://api.soundcloud.com/resolve?url=" + soundcloudPlaylistUrl + "&format=json&consumer_key=" + consumer_key + "&callback=?",
      function(playlist) {
        //shuffle playlist
        shuffle(playlist.tracks);
        //shows first track title
        $("#atitle").html("<b>" + playlist.tracks[0].user.username + "</b> - " + playlist.tracks[0].title);
        //builds tracklist
        $.each(playlist.tracks, function(index, track) {
          // create a list item for each track + data
          $("<li><b>" + track.user.username + "</b> - " + track.title + "</li>").data("track", track).appendTo("#tracks");
          url = track.stream_url;
          url += (url.indexOf("secret_token") == -1) ? "?" : "&";
          url += "consumer_key=" + consumer_key;

          soundManager.createSound({
            id: "track_" + track.id,
            url: url,
            onplay: function() {
              $("#aplayer").addClass("playing");
              $("#atitle").html("<b>" + track.user.username + "</b> - " + track.title);
              $("#atitle").fadeIn(500).delay(5000).fadeOut();
              $("#playpauseico").removeClass("fa fa-play");
              $("#playpauseico").addClass("fa fa-pause");
              vplayer.playVideo();
            },
            onresume: function() {
              $("#aplayer").addClass("playing");
              $("#playpauseico").removeClass("fa fa-play");
              $("#playpauseico").addClass("fa fa-pause");
              vplayer.playVideo();
            },
            onpause: function() {
              $("#aplayer").removeClass("playing");
              $("#playpauseico").removeClass("fa fa-pause");
              $("#playpauseico").addClass("fa fa-play");
              vplayer.pauseVideo();
            }
          });
        });

        // GUI

        // Bind a click event to each list item we created above.
        $("#tracks li").on("click", function() {
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
        $("#playpause").on("click", function() {
          if ($("li").hasClass("active")) {
            // If a track is active, play or pause it depending on current state.
            soundManager.togglePause('track_' + $('li.active').data('track').id);
          } else {
            // If no tracks are active, just play the first one.
            $('li:first').click();
          }
        });

        // Bind a click event to the next button, calling the Next Track function.
        $('#anext').on('click', function() {
          if ($("#playpauseico").is(".fa-pause")) {
            // Stop all sounds
            soundManager.stopAll();
            // Click the next list item after the current active one. 
            // If it does not exist *(there is no next track)*, click the first list item.
            if ($('li.active').next().click().length == 0) {
              $('.tracks li:first').click();
            }
          }
        });

        // Bind a click event to the next video button only 
        $("#vnext").click(function() {
          if ($("#playpauseico").is(".fa-pause")) {
            vplayer.nextVideo();
          }
        });

        // Bind a click event to toggle playlist visibility
        $("#toggleplaylist").click(function() {
          $("#tracklist").fadeToggle("fast", "linear");
        });

      });
  });

});
