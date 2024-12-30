/**
 * Playlist Time Calculator
 * A tool to calculate the total duration of YouTube playlists
 * 
 * @author İbrahim Ünal (Prime)
 * @instagram https://www.instagram.com/ibrahimunalprime/
 * @version 1.0.0
 * @license MIT
 */

// Code to run when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const playlistInput = document.getElementById('playlistUrl');
    const actionButton = document.getElementById('actionButton');
    const resultContainer = document.getElementById('result');
    const loadingContainer = document.getElementById('loading');
    const errorContainer = document.getElementById('error');
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    const videoCountElement = document.getElementById('videoCount');

    // Playback speed elements
    const speedElements = {
        '0.25': document.getElementById('speed025'),
        '0.50': document.getElementById('speed050'),
        '0.75': document.getElementById('speed075'),
        '1.00': document.getElementById('speed100'),
        '1.25': document.getElementById('speed125'),
        '1.50': document.getElementById('speed150'),
        '1.75': document.getElementById('speed175'),
        '2.00': document.getElementById('speed200')
    };

    // Variables for new buttons
    const showSpeedsButton = document.getElementById('showSpeedsButton');
    const playbackSpeedsContainer = document.getElementById('playbackSpeedsContainer');
    const showVideosButton = document.getElementById('showVideosButton');
    const playlistVideosSection = document.getElementById('playlist-videos');
    
    let totalDurationGlobal = 0; // To store global duration

    // Get API key securely
    const getApiKey = () => {
        // Replace this with your YouTube Data API v3 key
        // Get your API key from: https://console.cloud.google.com/apis/credentials
        const apiKey = 'YOUR_YOUTUBE_API_KEY';
        if (!apiKey || apiKey === 'YOUR_YOUTUBE_API_KEY') {
            throw new Error('Please add your YouTube Data API key');
        }
        return apiKey;
    };

    // Load YouTube API
    const loadYouTubeAPI = () => {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    };

    // Extract Playlist ID from URL
    const extractPlaylistId = (url) => {
        const regex = /[?&]list=([^#\&\?]+)/;
        const match = url.match(regex);
        return match && match[1];
    };

    // Format time (HH:MM:SS)
    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Calculate durations at different speeds
    const calculateSpeedTimes = (totalSeconds) => {
        const speeds = [0.25, 0.50, 0.75, 1.00, 1.25, 1.50, 1.75, 2.00];
        
        speeds.forEach(speed => {
            const timeAtSpeed = Math.ceil(totalSeconds / speed);
            const formattedTime = formatTime(timeAtSpeed);
            const elementKey = speed.toFixed(2);
            if (speedElements[elementKey]) {
                speedElements[elementKey].textContent = formattedTime;
            }
        });
    };

    // Format duration for display
    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        return {
            hours,
            minutes,
            seconds: remainingSeconds
        };
    };

    // Display results
    const displayResults = (duration, videoCount) => {
        totalDurationGlobal = duration;
        const { hours, minutes, seconds } = formatDuration(duration);
        
        hoursElement.textContent = hours;
        minutesElement.textContent = minutes;
        secondsElement.textContent = seconds;
        videoCountElement.textContent = videoCount;

        // Initially hide speed container
        playbackSpeedsContainer.classList.add('hidden');
        showSpeedsButton.textContent = 'Show Playback Speed Durations';

        loadingContainer.classList.add('hidden');
        resultContainer.classList.remove('hidden');
    };

    // Show error
    const showError = (message) => {
        errorContainer.querySelector('p').textContent = message;
        errorContainer.classList.remove('hidden');
        loadingContainer.classList.add('hidden');
    };

    // Fetch playlist data
    const fetchPlaylistData = async (playlistId) => {
        const apiKey = getApiKey();
        console.log('Using API Key:', apiKey); // API key kontrolü
        let totalDuration = 0;
        let videoCount = 0;
        let nextPageToken = '';
        let allVideos = [];

        try {
            const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}&pageToken=${nextPageToken}`;
            console.log('Fetching playlist:', playlistUrl); // URL kontrolü

            do {
                const playlistResponse = await fetch(
                    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}&pageToken=${nextPageToken}`
                );
                const playlistData = await playlistResponse.json();
                console.log('Playlist Response:', playlistData); // API yanıtı kontrolü

                if (playlistData.error) {
                    console.error('API Error Details:', playlistData.error); // Detaylı hata bilgisi
                    throw new Error(playlistData.error.message);
                }

                const videoIds = playlistData.items.map(item => item.contentDetails.videoId).join(',');
                
                const videosResponse = await fetch(
                    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${apiKey}`
                );
                const videosData = await videosResponse.json();

                // Collect information for each video
                videosData.items.forEach((video, index) => {
                    const duration = parseDuration(video.contentDetails.duration);
                    totalDuration += duration;

                    // Add video information to array
                    allVideos.push({
                        title: video.snippet.title,
                        duration: duration,
                        thumbnail: video.snippet.thumbnails.medium.url,
                        videoId: video.id
                    });
                });

                videoCount += playlistData.items.length;
                nextPageToken = playlistData.nextPageToken;

            } while (nextPageToken);

            // Show results
            displayResults(totalDuration, videoCount);
            
            // Prepare video list but keep it hidden
            displayVideosList(allVideos);
            document.getElementById('playlist-videos').classList.add('hidden');
            showVideosButton.textContent = 'Show Playlist Videos';

        } catch (error) {
            console.error('Full Error:', error); // Tam hata detayı
            showError(`Error: ${error.message}`); // Kullanıcıya daha detaylı hata göster
        }
    };

    // Convert ISO 8601 duration format to seconds
    const parseDuration = (duration) => {
        const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        const hours = parseInt(matches[1] || 0);
        const minutes = parseInt(matches[2] || 0);
        const seconds = parseInt(matches[3] || 0);
        return hours * 3600 + minutes * 60 + seconds;
    };

    // Calculate button click handler
    actionButton.addEventListener('click', () => {
        const url = playlistInput.value.trim();
        const playlistId = extractPlaylistId(url);

        errorContainer.classList.add('hidden');
        resultContainer.classList.add('hidden');

        if (!playlistId) {
            showError('Please enter a valid YouTube playlist URL.');
            return;
        }

        loadingContainer.classList.remove('hidden');
        fetchPlaylistData(playlistId);
    });

    // Enter key press handler
    playlistInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            actionButton.click();
        }
    });

    // Load YouTube API
    loadYouTubeAPI();

    // Speed button click handler
    showSpeedsButton.addEventListener('click', () => {
        const isHidden = playbackSpeedsContainer.classList.contains('hidden');
        
        if (isHidden) {
            calculatePlaybackSpeeds(totalDurationGlobal);
            playbackSpeedsContainer.classList.remove('hidden');
            showSpeedsButton.textContent = 'Hide Playback Speed Durations';
        } else {
            playbackSpeedsContainer.classList.add('hidden');
            showSpeedsButton.textContent = 'Show Playback Speed Durations';
        }
    });

    // Calculate playback speeds
    const calculatePlaybackSpeeds = (totalSeconds) => {
        const speeds = [0.25, 0.50, 0.75, 1.00, 1.25, 1.50, 1.75, 2.00];
        
        speeds.forEach(speed => {
            const timeAtSpeed = Math.ceil(totalSeconds / speed);
            const formattedTime = formatTime(timeAtSpeed);
            const elementKey = speed.toFixed(2);
            if (speedElements[elementKey]) {
                speedElements[elementKey].textContent = formattedTime;
            }
        });
    };

    // Video list button click handler
    showVideosButton.addEventListener('click', () => {
        playlistVideosSection.classList.toggle('hidden');
        showVideosButton.textContent = playlistVideosSection.classList.contains('hidden') 
            ? 'Show Playlist Videos' 
            : 'Hide Playlist Videos';
    });

    // Display videos list
    function displayVideosList(videos) {
        const videosListElement = document.getElementById('videosList');
        videosListElement.innerHTML = '';
        
        videos.forEach((video, index) => {
            const videoElement = document.createElement('div');
            videoElement.className = 'video-item';
            videoElement.innerHTML = `
                <div class="video-thumbnail-container">
                    <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail">
                    <span class="video-duration-badge">${formatTime(video.duration)}</span>
                </div>
                <div class="video-info">
                    <div class="video-title">${video.title}</div>
                    <div class="video-meta">
                        <span>#${index + 1}</span>
                        <span>${formatTime(video.duration)}</span>
                    </div>
                </div>
            `;
            
            videoElement.addEventListener('click', () => {
                window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank');
            });
            
            videosListElement.appendChild(videoElement);
        });
    }
});

// Helper function to format video duration
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${padZero(minutes)}:${padZero(secs)}`;
    }
    return `${minutes}:${padZero(secs)}`;
}

function padZero(num) {
    return num.toString().padStart(2, '0');
} 