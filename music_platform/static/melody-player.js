
// MelodyPlayer - Global audio player controller
const MelodyPlayer = (function() {
    // Private variables
    let audioElement;
    let playButton;
    let prevButton;
    let nextButton;
    let muteButton;
    let progressBar;
    let volumeSlider;
    let currentTimeDisplay;
    let durationDisplay;
    let progressContainer;
    let volumeContainer;
    let cover_imageElement;
    let titleElement;
    let artistElement;
    
    // Current playlist and state
    let currentPlaylist = [];
    let currentIndex = -1;
    let isPlaying = false;
    let volume = 0.7;
    let isMuted = false;
    
    // Initialize the player
    function init() {
      // Get DOM elements
      audioElement = document.getElementById('audio-player');
      playButton = document.getElementById('play-button');
      prevButton = document.getElementById('prev-button');
      nextButton = document.getElementById('next-button');
      muteButton = document.getElementById('mute-button');
      progressBar = document.getElementById('progress-slider');
      volumeSlider = document.getElementById('volume-slider');
      currentTimeDisplay = document.getElementById('current-time');
      durationDisplay = document.getElementById('duration');
      progressContainer = document.querySelector('.progress-bar-container');
      volumeContainer = document.querySelector('.volume-slider-container');
      cover_imageElement = document.getElementById('current-song-cover');
      titleElement = document.getElementById('current-song-title');
      artistElement = document.getElementById('current-song-artist');
      
      // Set initial volume
      audioElement.volume = volume;
      volumeSlider.style.width = (volume * 100) + '%';
      
      // Add event listeners
      setupEventListeners();
      
      // Find play buttons on the page and add click handlers
      setupPlayButtons();
      
      console.log('MelodyPlayer initialized');
    }
    
    function setupEventListeners() {
      // Player control buttons
      playButton.addEventListener('click', togglePlay);
      prevButton.addEventListener('click', playPrevious);
      nextButton.addEventListener('click', playNext);
      muteButton.addEventListener('click', toggleMute);
      
      
      // Audio element events
      audioElement.addEventListener('timeupdate', updateProgress);
      audioElement.addEventListener('ended', handleSongEnd);
      audioElement.addEventListener('loadedmetadata', updateDuration);
      
      // Progress bar events
      if (progressContainer) {
      progressContainer.addEventListener('click', seek);
      }

      // Volume slider events
      if (volumeContainer) {
      volumeContainer.addEventListener('click', setVolume);
      }
    }
    
    function setupPlayButtons() {
      // Find all play buttons on the page
      const playButtons = document.querySelectorAll('.play-song');
      
      playButtons.forEach(button => {
        button.addEventListener('click', function() {
          const songId = this.getAttribute('data-song-id');
          const songTitle = this.getAttribute('data-song-title');
          const songArtist = this.getAttribute('data-song-artist');
          const songUrl = this.getAttribute('data-song-url');
          const songCover = this.getAttribute('data-song-cover');
          console.log("hello")
          // Create a temporary playlist with just this song if it's not part of a playlist
          if (!this.hasAttribute('data-playlist-id')) {
            currentPlaylist = [{
              id: songId,
              title: songTitle,
              artist: songArtist,
              url: songUrl,
              cover_image: songCover
            }];
            currentIndex = 0;
          } else {
            // Handle playlist logic here if needed
            // This is simplified for the example
            const playlistId = this.getAttribute('data-playlist-id');
            const playlistIndex = parseInt(this.getAttribute('data-playlist-index'));
            
            // If it's a different playlist, load the new playlist
            if (currentPlaylistId !== playlistId) {
              // In a real implementation, you might fetch the playlist from your backend
              // For now, we'll assume the playlist buttons have the necessary data
            }
            
            currentIndex = playlistIndex;
          }
          
          // Play the selected song
          playSong(currentPlaylist[currentIndex]);
        });
      });
    }
    
    // Player control functions
    function togglePlay() {
        console.log('Play button clicked');
        if (currentIndex === -1 && currentPlaylist.length > 0) {
        // If no song is playing but we have a playlist, start with the first song
        currentIndex = 0;
        playSong(currentPlaylist[currentIndex]);
        return;
      }
      
      if (audioElement.paused) {
        audioElement.play()
          .then(() => {
            isPlaying = true;
            updatePlayButton();
          })
          .catch(error => {
            console.error('Playback failed:', error);
          });
      } else {
        audioElement.pause();
        isPlaying = false;
        updatePlayButton();
      }
    }
    
    function playPrevious() {
      if (currentPlaylist.length === 0) return;
      
      // If current time is more than 3 seconds, restart the song instead
      if (audioElement.currentTime > 3) {
        audioElement.currentTime = 0;
        return;
      }
      
      currentIndex = (currentIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
      playSong(currentPlaylist[currentIndex]);
    }
    
    function playNext() {
      if (currentPlaylist.length === 0) return;
      
      currentIndex = (currentIndex + 1) % currentPlaylist.length;
      playSong(currentPlaylist[currentIndex]);
    }
    
    function toggleMute() {
      isMuted = !isMuted;
      audioElement.muted = isMuted;
      updateMuteButton();
    }
    
    function seek(e) {
      const percent = e.offsetX / progressContainer.offsetWidth;
      audioElement.currentTime = percent * audioElement.duration;
      updateProgress();
    }
    
    function setVolume(e) {
      const newVolume = e.offsetX / volumeContainer.offsetWidth;
      volume = Math.max(0, Math.min(1, newVolume));
      audioElement.volume = volume;
      volumeSlider.style.width = (volume * 100) + '%';
      
      // If setting volume from 0, unmute
      if (volume > 0 && isMuted) {
        toggleMute();
      }
    }
    
    function handleSongEnd() {
      // Auto play next song when current song ends
      playNext();
    }
    
    // UI update functions
    function updatePlayButton() {
      if (isPlaying) {
        playButton.innerHTML = '<i class="fas fa-pause"></i>';
        playButton.classList.add('playing');
      } else {
        playButton.innerHTML = '<i class="fas fa-play"></i>';
        playButton.classList.remove('playing');
      }
    }
    
    function updateMuteButton() {
      if (isMuted) {
        muteButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
      } else {
        muteButton.innerHTML = '<i class="fas fa-volume-up"></i>';
      }
    }
    
    function updateProgress() {
      const percent = (audioElement.currentTime / audioElement.duration) * 100 || 0;
      progressBar.style.width = percent + '%';
      
      // Update time display
      currentTimeDisplay.textContent = formatTime(audioElement.currentTime);
    }
    
    function updateDuration() {
      durationDisplay.textContent = formatTime(audioElement.duration);
    }
    
    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60) || 0;
      const secs = Math.floor(seconds % 60) || 0;
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    // Main playback function
    function playSong(song) {
      if (!song || !song.url) {
        console.error('Invalid song data');
        return;
      }
      
      // Update audio source
      audioElement.src = song.url;
      audioElement.load();
      
      // Update player UI
      cover_imageElement.src = song.cover_image || '/static/images/default-cover.jpg';
      titleElement.textContent = song.title || 'Unknown Song';
      artistElement.textContent = song.artist || 'Unknown Artist';
      
      // Start playback
      audioElement.play()
        .then(() => {
          isPlaying = true;
          updatePlayButton();
        })
        .catch(error => {
          console.error('Playback failed:', error);
          isPlaying = false;
          updatePlayButton();
        });
        
      // Update active song in the UI
      highlightActiveSong(song.id);
    }
    
    function highlightActiveSong(songId) {
      // Remove active class from all song items
      document.querySelectorAll('.song-item').forEach(item => {
        item.classList.remove('active-song');
      });
      
      // Add active class to current song
      const activeSongElements = document.querySelectorAll(`[data-song-id="${songId}"]`);
      activeSongElements.forEach(el => {
        // Find parent song-item if exists
        const songItem = el.closest('.song-item');
        if (songItem) {
          songItem.classList.add('active-song');
        }
      });
    }
    
    // Public API
    return {
      init: init,
      play: function(songData) {
        // Create a single song playlist and play it
        currentPlaylist = [songData];
        currentIndex = 0;
        playSong(songData);
      },
      playPlaylist: function(playlist, startIndex = 0) {
        if (!playlist || !playlist.length) return;
        
        currentPlaylist = playlist;
        currentIndex = startIndex;
        playSong(currentPlaylist[currentIndex]);
      },
      togglePlayPause: togglePlay,
      next: playNext,
      previous: playPrevious,
      seek: function(time) {
        if (!audioElement) return;
        audioElement.currentTime = time;
      },
      setVolume: function(newVolume) {
        volume = Math.max(0, Math.min(1, newVolume));
        audioElement.volume = volume;
        volumeSlider.style.width = (volume * 100) + '%';
      },
      getCurrentSong: function() {
        return currentPlaylist[currentIndex] || null;
      },
      isPlaying: function() {
        return isPlaying;
      }
    };
  })();
  
  // Initialize player when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.play-song')) {
        MelodyPlayer.init();
    }
  });