// audio-player-complete.js - Comprehensive audio player solution
document.addEventListener('DOMContentLoaded', function() {
    // ========== 1. PLAYER ELEMENT REFERENCES ==========
    const audioPlayer = document.getElementById('audio-player');
    const audioSource = document.getElementById('audio-source');
    const playButton = document.getElementById('play-button');
    const pauseButton = document.getElementById('pause-button');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const progressBar = document.getElementById('progress-bar');
    const currentTimeDisplay = document.getElementById('current-time');
    const durationDisplay = document.getElementById('duration');
    const volumeControl = document.getElementById('volume-control');
    const currentSongTitle = document.getElementById('current-song-title');
    const currentSongArtist = document.getElementById('current-song-artist');
    const currentSongCover = document.getElementById('current-song-cover');

    // ========== 2. PLAYLIST MANAGEMENT ==========
    let playlist = [];
    let currentTrackIndex = 0;

    // Load saved state from localStorage
    const savedState = JSON.parse(localStorage.getItem('audioPlayerState')) || {};
    if (savedState.src) {
        audioSource.src = savedState.src;
        audioPlayer.load();
        audioPlayer.currentTime = savedState.currentTime || 0;
        currentSongTitle.textContent = savedState.title || 'No song playing';
        currentSongArtist.textContent = savedState.artist || 'Unknown Artist';
        if (savedState.coverUrl) {
            currentSongCover.src = savedState.coverUrl;
        }
        if (savedState.isPlaying) {
            audioPlayer.play()
                .then(() => {
                    playButton.style.display = 'none';
                    pauseButton.style.display = 'inline-block';
                })
                .catch(error => {
                    console.error('Error playing audio:', error);
                });
        }
    }

    // Load saved playlist
    const savedPlaylist = JSON.parse(localStorage.getItem('audioPlayerPlaylist')) || [];
    if (savedPlaylist.length > 0) {
        playlist = savedPlaylist;
        currentTrackIndex = parseInt(localStorage.getItem('currentTrackIndex') || 0);
    }

    // Save state to localStorage
    function saveState() {
        const state = {
            src: audioSource.src,
            currentTime: audioPlayer.currentTime,
            title: currentSongTitle.textContent,
            artist: currentSongArtist.textContent,
            coverUrl: currentSongCover.src,
            isPlaying: !audioPlayer.paused,
            volume: volumeControl.value
        };
        localStorage.setItem('audioPlayerState', JSON.stringify(state));
        localStorage.setItem('audioPlayerPlaylist', JSON.stringify(playlist));
        localStorage.setItem('currentTrackIndex', currentTrackIndex);
    }

    // ========== 3. CORE PLAYER FUNCTIONS ==========
    // Load a track into the player
    function loadTrack(track) {
        audioSource.src = track.audioUrl;
        audioPlayer.load();
        
        audioPlayer.play()
            .then(() => {
                playButton.style.display = 'none';
                pauseButton.style.display = 'inline-block';
            })
            .catch(error => {
                console.error('Error playing audio:', error);
            });
            
        currentSongTitle.textContent = track.title;
        currentSongArtist.textContent = track.artist;
        currentSongCover.src = track.coverUrl;
        saveState();
    }

    // Add a track to the playlist
    function addToPlaylist(track) {
        // Check if track is already in playlist
        const exists = playlist.some(item => item.id === track.id);
        if (!exists) {
            playlist.push(track);
            saveState();
            return true;
        }
        return false;
    }

    // Play a specific track and add it to playlist
    function playTrack(track) {
        addToPlaylist(track);
        currentTrackIndex = playlist.findIndex(item => item.id === track.id);
        if (currentTrackIndex === -1) {
            currentTrackIndex = playlist.length - 1; // If not found, it must be the last one added
        }
        loadTrack(track);
    }

    // ========== 4. PLAYER CONTROLS EVENT LISTENERS ==========
    // Play/Pause functionality
    playButton.addEventListener('click', () => {
        if (audioSource.src) {
            audioPlayer.play()
                .then(() => {
                    playButton.style.display = 'none';
                    pauseButton.style.display = 'inline-block';
                    saveState();
                })
                .catch(error => {
                    console.error('Error playing audio:', error);
                });
        } else if (playlist.length > 0) {
            loadTrack(playlist[currentTrackIndex]);
        }
    });

    pauseButton.addEventListener('click', () => {
        audioPlayer.pause();
        pauseButton.style.display = 'none';
        playButton.style.display = 'inline-block';
        saveState();
    });

    // Next track functionality
    nextButton.addEventListener('click', () => {
        if (playlist.length === 0) return;
        
        let newIndex = currentTrackIndex + 1;
        if (newIndex >= playlist.length) {
            newIndex = 0;
        }
        currentTrackIndex = newIndex;
        loadTrack(playlist[currentTrackIndex]);
    });

    // Previous track functionality
    prevButton.addEventListener('click', () => {
        if (playlist.length === 0) return;
        
        if (audioPlayer.currentTime > 3) {
            audioPlayer.currentTime = 0;
            return;
        }
        let newIndex = currentTrackIndex - 1;
        if (newIndex < 0) {
            newIndex = playlist.length - 1;
        }
        currentTrackIndex = newIndex;
        loadTrack(playlist[currentTrackIndex]);
    });

    // Update progress bar
    audioPlayer.addEventListener('timeupdate', () => {
        const duration = audioPlayer.duration;
        const currentTime = audioPlayer.currentTime;

        if (isNaN(duration)) return;

        progressBar.value = (currentTime / duration) * 100;
        currentTimeDisplay.textContent = formatTime(currentTime);
        durationDisplay.textContent = formatTime(duration);
        saveState();
    });

    // Seek functionality
    progressBar.addEventListener('input', () => {
        const seekTime = audioPlayer.duration * (progressBar.value / 100);
        audioPlayer.currentTime = seekTime;
    });

    // Volume control
    volumeControl.addEventListener('input', () => {
        audioPlayer.volume = volumeControl.value / 100;
        saveState();
    });

    // Handle track ending
    audioPlayer.addEventListener('ended', () => {
        if (playlist.length > 1) {
            nextButton.click(); // Automatically play the next track
        } else {
            pauseButton.style.display = 'none';
            playButton.style.display = 'inline-block';
        }
    });

    // ========== 5. HELPER FUNCTIONS ==========
    // Format time in MM:SS
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }

    // ========== 6. SONG DETECTION AND AUTO-BINDING ==========
    // Function to find and auto-bind all song elements on the page
    function bindSongElements() {
        // Look for various potential song elements
        const songElements = document.querySelectorAll('.song-item, .track-item, tr.song, .song-row, .card');
        
        songElements.forEach(element => {
            // Skip if already bound
            if (element.dataset.playerBound === 'true') return;
            
            // Try to extract song information from the element
            const songData = extractSongData(element);
            if (!songData) return; // Skip if we couldn't extract data
            
            // Mark as bound to avoid repeated binding
            element.dataset.playerBound = 'true';
            
            // Find or create play button
            let playBtn = element.querySelector('.play-btn, .play-song-btn, [data-action="play"]');
            if (!playBtn) {
                // Look for any button or clickable element that might be a play button
                playBtn = element.querySelector('button, .btn, a[href="#play"]');
            }
            
            // Add click handler to element or play button if found
            if (playBtn) {
                playBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    playTrack(songData);
                });
            } else {
                // If no play button, make the whole element clickable
                element.addEventListener('click', (e) => {
                    // Don't trigger if clicking on a link or button
                    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
                    playTrack(songData);
                });
            }
            
            // Find or create add-to-playlist button
            let addBtn = element.querySelector('.add-to-playlist-btn, [data-action="add"]');
            if (addBtn) {
                addBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const added = addToPlaylist(songData);
                    if (added) {
                        alert(`"${songData.title}" added to playlist!`);
                    } else {
                        alert(`"${songData.title}" is already in your playlist.`);
                    }
                });
            }
        });
    }
    
    // Extract song data from an element
    function extractSongData(element) {
        // First, try to get data from data attributes
        if (element.dataset.songId && element.dataset.songUrl) {
            return {
                id: element.dataset.songId,
                audioUrl: element.dataset.songUrl,
                title: element.dataset.songTitle || 'Unknown Title',
                artist: element.dataset.songArtist || 'Unknown Artist',
                coverUrl: element.dataset.songCover || '/static/images/default-cover.jpg'
            };
        }
        
        // Next, try to find child elements with these attributes
        const dataElements = element.querySelectorAll('[data-song-id], [data-song-url]');
        if (dataElements.length > 0) {
            const dataEl = dataElements[0];
            return {
                id: dataEl.dataset.songId,
                audioUrl: dataEl.dataset.songUrl,
                title: dataEl.dataset.songTitle || 'Unknown Title',
                artist: dataEl.dataset.songArtist || 'Unknown Artist',
                coverUrl: dataEl.dataset.songCover || '/static/images/default-cover.jpg'
            };
        }
        
        // Try to infer from element content
        const title = element.querySelector('.song-title, .track-title')?.textContent?.trim();
        const artist = element.querySelector('.song-artist, .track-artist')?.textContent?.trim();
        const audioUrl = element.querySelector('audio')?.src || 
                        element.querySelector('a[href$=".mp3"]')?.href;
        
        if (title && audioUrl) {
            // Generate an ID if none available
            const id = element.id || `song-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            
            // Look for cover image
            let coverUrl = '/static/images/default-cover.jpg';
            const img = element.querySelector('img');
            if (img && img.src) {
                coverUrl = img.src;
            }
            
            return {
                id,
                audioUrl,
                title,
                artist: artist || 'Unknown Artist',
                coverUrl
            };
        }
        
        // Couldn't extract necessary data
        return null;
    }
    
    // Initialize volume
    volumeControl.value = savedState.volume || 70;
    audioPlayer.volume = (savedState.volume || 70) / 100;

    // Make player functions available globally
    window.audioPlayerAPI = {
        loadTrack,
        addToPlaylist,
        playTrack
    };
    
    // Run the auto-binding 
    bindSongElements();
    
    // Also bind after any potential AJAX content loads
    document.addEventListener('DOMNodeInserted', function(e) {
        // Wait a short period to ensure the DOM is stable
        setTimeout(bindSongElements, 200);
    });
    
    // ========== 7. CUSTOM STYLING FIXES ==========
    // Apply custom CSS to ensure the player works with your layout
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        body {
            padding-bottom: 80px; /* Make sure content isn't hidden behind the player */
        }
        
        .form-range {
            height: 8px;
        }
        
        #current-song-cover {
            object-fit: cover;
        }
        
        /* Fix for Bootstrap 4 specific classes */
        .me-2 {
            margin-right: 0.5rem !important;
        }
        
        .ms-2 {
            margin-left: 0.5rem !important;
        }
        
        .flex-grow-1 {
            flex-grow: 1 !important;
        }
    `;
    document.head.appendChild(styleElement);
});
document.addEventListener('DOMContentLoaded', function() {
    function bindSongButtons() {
        document.querySelectorAll('.play-song-btn').forEach(button => {
            button.addEventListener('click', function () {
                const track = {
                    id: this.dataset.songId,
                    audioUrl: this.dataset.songUrl,
                    title: this.dataset.songTitle,
                    artist: this.dataset.songArtist || 'Unknown Artist',
                    coverUrl: this.dataset.songCover || '/static/images/default-cover.jpg'
                };
                window.audioPlayerAPI.playTrack(track);
            });
        });

        document.querySelectorAll('.add-to-playlist-btn').forEach(button => {
            button.addEventListener('click', function () {
                const track = {
                    id: this.dataset.songId,
                    audioUrl: this.dataset.songUrl,
                    title: this.dataset.songTitle,
                    artist: this.dataset.songArtist || 'Unknown Artist',
                    coverUrl: this.dataset.songCover || '/static/images/default-cover.jpg'
                };
                if (window.audioPlayerAPI.addToPlaylist(track)) {
                    alert(`"${track.title}" added to playlist!`);
                } else {
                    alert(`"${track.title}" is already in your playlist.`);
                }
            });
        });
    }

    // Bind all song buttons
    bindSongButtons();

    // Also bind when new content is added dynamically
    document.addEventListener('DOMNodeInserted', function() {
        setTimeout(bindSongButtons, 200);
    });
});