const CLIENT_ID = '587b89ac67ac4599898ca1fe563c26af';
const REDIRECT_URI = 'http://localhost:3000';  // Change this to your app's URL

const SCOPES = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'playlist-read-private',
    'user-library-read',
    'user-modify-playback-state',
    'user-read-playback-state'
];

// Mood and genre playlists (sample Spotify playlist IDs - replace with actual ones)
const MOOD_PLAYLISTS = {
    happy: {
        'hip-hop': '37i9dQZF1DX9XIFQuFvzM4',
        'pop': '37i9dQZF1DXdPec7aLTmlC',
        'rock': '37i9dQZF1DX3ZeFHRhhi7Y',
        // Add more genres
    },
    chill: {
        'hip-hop': '37i9dQZF1DX2jGfBE1RGp0',
        'electronic': '37i9dQZF1DX0MuOvXVhN8L',
        'jazz': '37i9dQZF1DX0L0EP7QJJ3B',
        // Add more genres
    },
    // Add more moods
};

let currentMood = null;
let currentGenre = null;
let player = null;
let token = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    loginButton.addEventListener('click', handleLogin);

    // Check if returning from auth
    const hash = window.location.hash;
    if (hash) {
        const tokenMatch = hash.match(/#access_token=([^&]*)/);
        if (tokenMatch) {
            token = tokenMatch[1];
            showPlayer();
        }
    }

    setupMoodAndGenreListeners();
});

function handleLogin() {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES.join(' '))}&response_type=token`;
    window.location.href = authUrl;
}

function showPlayer() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('player-container').classList.remove('hidden');
    initializePlayer();
}

function setupMoodAndGenreListeners() {
    document.querySelectorAll('.mood-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            currentMood = e.target.dataset.mood;
            checkAndPlayPlaylist();
        });
    });

    document.querySelectorAll('.genre-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            currentGenre = e.target.dataset.genre;
            checkAndPlayPlaylist();
        });
    });
}

function checkAndPlayPlaylist() {
    if (currentMood && currentGenre && token) {
        const playlistId = MOOD_PLAYLISTS[currentMood]?.[currentGenre];
        if (playlistId) {
            playPlaylist(playlistId);
        }
    }
}

function playPlaylist(playlistId) {
    fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        displayPlaylistInfo(data);
        // Start playback using Web Playback SDK
        if (player) {
            player.play(`spotify:playlist:${playlistId}`);
        }
    })
    .catch(error => console.error('Error:', error));
}

function displayPlaylistInfo(playlist) {
    const container = document.getElementById('playlist-info');
    container.innerHTML = `
        <h4>${playlist.name}</h4>
        <p>${playlist.description || ''}</p>
        <p>Tracks: ${playlist.tracks.total}</p>
    `;
    document.getElementById('playlist-container').classList.remove('hidden');
}

function initializePlayer() {
    window.onSpotifyWebPlaybackSDKReady = () => {
        player = new Spotify.Player({
            name: 'Mood Player',
            getOAuthToken: cb => { cb(token); }
        });

        player.connect();

        player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
        });

        player.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID has gone offline', device_id);
        });
    };
}