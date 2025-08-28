// Supabase Configuration
const SUPABASE_URL = 'https://fnkjqwfuvsbwmjjfhxmw.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZua2pxd2Z1dnNid21qamZoeG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTc3NjMsImV4cCI6MjA3MTk5Mzc2M30.EI38rGygijyxeaZEM5u313mQJA61q5mRips85lVM5_c'; // Replace with your Supabase anon key

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// App state
let allTweets = [];
let filteredTweets = [];
let currentPage = 0;
const tweetsPerPage = 100; // Show 100 tweets per page
let currentFilter = 'all';

// DOM elements
const tweetsContainer = document.getElementById('tweetsContainer');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');
const tweetTemplate = document.getElementById('tweetTemplate');

// Stats elements
const totalPostsEl = document.getElementById('totalPosts');
const totalLikesEl = document.getElementById('totalLikes');
const avgEngagementEl = document.getElementById('avgEngagement');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadTweets();
    setupEventListeners();
    createModal();
});

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            applyFilters();
        });
    });
    
    // Load more button
    loadMoreBtn.addEventListener('click', loadMoreTweets);
}

// Load tweets from Supabase
async function loadTweets() {
    try {
        showLoading(true);
        
        const { data: tweets, error } = await supabase
            .from('jk_rowling_posts')
            .select('*')
            .order('published_at', { ascending: false })
            .limit(1000); // Load up to 1000 tweets for better pagination
        
        if (error) {
            console.error('Error loading tweets:', error);
            showError('Failed to load tweets');
            return;
        }
        
        allTweets = tweets || [];
        filteredTweets = [...allTweets];
        
        updateStats();
        displayTweets();
        showLoading(false);
        
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to load tweets');
        showLoading(false);
    }
}

// Display tweets
function displayTweets() {
    // Show all filtered tweets at once (up to 100)
    const tweetsToShow = filteredTweets.slice(0, 100);
    
    // Clear container
    tweetsContainer.innerHTML = '';
    
    if (tweetsToShow.length === 0) {
        showEmptyState();
        loadMoreBtn.style.display = 'none';
        return;
    }
    
    tweetsToShow.forEach(tweet => {
        const tweetElement = createTweetElement(tweet);
        tweetsContainer.appendChild(tweetElement);
    });
    
    // Hide load more button since we're showing all tweets
    loadMoreBtn.style.display = 'none';
    
    hideEmptyState();
    
    // Load Twitter widgets after adding tweets
    if (window.twttr && window.twttr.widgets) {
        window.twttr.widgets.load();
    }
}

// Create tweet element from template
function createTweetElement(tweet) {
    const template = tweetTemplate.content.cloneNode(true);
    
    // Set tweet content
    template.querySelector('.tweet-text').textContent = tweet.content;
    
    // Set date
    const date = new Date(tweet.published_at);
    template.querySelector('.date-text').textContent = formatDate(date);
    
    // Set engagement metrics
    template.querySelector('.likes-count').textContent = formatNumber(tweet.engagement_metrics?.likes || 0);
    template.querySelector('.retweets-count').textContent = formatNumber(tweet.engagement_metrics?.retweets || 0);
    template.querySelector('.replies-count').textContent = formatNumber(tweet.engagement_metrics?.replies || 0);
    
    // Set Twitter URL
    const twitterLink = template.querySelector('.tweet-action');
    if (tweet.url) {
        twitterLink.href = tweet.url;
    } else {
        twitterLink.style.display = 'none';
    }
    
    // Handle media content
    const mediaContainer = template.querySelector('.tweet-media');
    const mediaGallery = template.querySelector('.media-gallery');
    
    if (tweet.raw_data?.attributes?.post_data?.extended_entities?.media) {
        const media = tweet.raw_data.attributes.post_data.extended_entities.media;
        displayMedia(mediaGallery, media);
        mediaContainer.style.display = 'block';
    }
    
    // Handle reply context
    const replyContext = template.querySelector('.reply-context');
    const replyToUser = template.querySelector('.reply-to-user');
    
    if (tweet.raw_data?.attributes?.post_data?.in_reply_to_screen_name) {
        const replyToScreenName = tweet.raw_data.attributes.post_data.in_reply_to_screen_name;
        const replyToStatusId = tweet.raw_data.attributes.post_data.in_reply_to_status_id_str;
        
        replyToUser.textContent = `@${replyToScreenName}`;
        replyToUser.href = `https://twitter.com/${replyToScreenName}/status/${replyToStatusId}`;
        replyContext.style.display = 'block';
        
        // Show embed button for replies
        const embedBtn = template.querySelector('.embed-btn');
        embedBtn.style.display = 'inline-flex';
        embedBtn.addEventListener('click', () => embedTweet(replyToStatusId, template.querySelector('.embedded-tweet')));
    }
    
    // Handle embedded tweets for replies
    const embeddedTweet = template.querySelector('.embedded-tweet');
    if (tweet.raw_data?.attributes?.post_data?.in_reply_to_status_id_str) {
        const replyToStatusId = tweet.raw_data.attributes.post_data.in_reply_to_status_id_str;
        embedTweet(replyToStatusId, embeddedTweet);
    }
    
    return template;
}

// Display media content
function displayMedia(mediaGallery, mediaArray) {
    const mediaCount = mediaArray.length;
    
    // Set grid class based on media count
    if (mediaCount === 1) {
        mediaGallery.classList.add('single');
    } else if (mediaCount === 2) {
        mediaGallery.classList.add('double');
    } else if (mediaCount === 3) {
        mediaGallery.classList.add('triple');
    } else {
        mediaGallery.classList.add('quad');
    }
    
    mediaArray.forEach((media, index) => {
        const mediaItem = document.createElement('div');
        mediaItem.className = 'media-item';
        
        if (media.type === 'photo') {
            const img = document.createElement('img');
            img.src = media.media_url_https;
            img.alt = 'Tweet media';
            img.loading = 'lazy';
            mediaItem.appendChild(img);
            
            // Add click handler for modal
            mediaItem.addEventListener('click', () => openMediaModal(media.media_url_https, 'image'));
        } else if (media.type === 'video') {
            const video = document.createElement('video');
            video.src = media.video_info?.variants?.[0]?.url || media.media_url_https;
            video.controls = true;
            video.muted = true;
            video.preload = 'metadata';
            mediaItem.appendChild(video);
            
            // Add play overlay
            const overlay = document.createElement('div');
            overlay.className = 'media-overlay';
            overlay.innerHTML = '<i class="fas fa-play"></i>';
            mediaItem.appendChild(overlay);
            
            // Add click handler for modal
            mediaItem.addEventListener('click', () => openMediaModal(video.src, 'video'));
        }
        
        mediaGallery.appendChild(mediaItem);
    });
}

// Embed tweet using Twitter Widgets API
function embedTweet(tweetId, container) {
    if (!window.twttr) {
        console.warn('Twitter Widgets not loaded');
        return;
    }
    
    const embedContainer = container.querySelector('.embedded-tweet-container');
    embedContainer.innerHTML = '';
    
    window.twttr.widgets.createTweet(tweetId, embedContainer, {
        conversation: 'none',
        cards: 'hidden',
        theme: 'light'
    }).then(el => {
        if (el) {
            container.style.display = 'block';
        }
    });
}

// Create modal for media viewing
function createModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'mediaModal';
    
    modal.innerHTML = `
        <span class="close-modal">&times;</span>
        <div class="modal-content" id="modalContent"></div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal on click
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.className === 'close-modal') {
            closeMediaModal();
        }
    });
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMediaModal();
        }
    });
}

// Open media modal
function openMediaModal(src, type) {
    const modal = document.getElementById('mediaModal');
    const modalContent = document.getElementById('modalContent');
    
    modalContent.innerHTML = '';
    
    if (type === 'image') {
        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Full size image';
        modalContent.appendChild(img);
    } else if (type === 'video') {
        const video = document.createElement('video');
        video.src = src;
        video.controls = true;
        video.autoplay = true;
        video.muted = false;
        modalContent.appendChild(video);
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close media modal
function closeMediaModal() {
    const modal = document.getElementById('mediaModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Stop any playing videos
    const video = modal.querySelector('video');
    if (video) {
        video.pause();
    }
}

// Handle search
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    currentPage = 0;
    
    if (searchTerm === '') {
        filteredTweets = [...allTweets];
    } else {
        filteredTweets = allTweets.filter(tweet => 
            tweet.content.toLowerCase().includes(searchTerm)
        );
    }
    
    applyFilters();
}

// Apply filters
function applyFilters() {
    let filtered = [...filteredTweets];
    
    switch (currentFilter) {
        case 'recent':
            // Already sorted by published_at desc
            break;
        case 'popular':
            filtered.sort((a, b) => {
                const aEngagement = (a.engagement_metrics?.likes || 0) + 
                                  (a.engagement_metrics?.retweets || 0) + 
                                  (a.engagement_metrics?.replies || 0);
                const bEngagement = (b.engagement_metrics?.likes || 0) + 
                                  (b.engagement_metrics?.retweets || 0) + 
                                  (b.engagement_metrics?.replies || 0);
                return bEngagement - aEngagement;
            });
            break;
        case 'replies':
            filtered = filtered.filter(tweet => 
                tweet.raw_data?.attributes?.post_data?.in_reply_to_screen_name
            );
            break;
        default:
            // 'all' - no additional filtering
            break;
    }
    
    filteredTweets = filtered;
    currentPage = 0;
    displayTweets();
}

// Load more tweets (now just refreshes the display)
function loadMoreTweets() {
    displayTweets();
}

// Update statistics
function updateStats() {
    totalPostsEl.textContent = allTweets.length;
    
    const totalLikes = allTweets.reduce((sum, tweet) => 
        sum + (tweet.engagement_metrics?.likes || 0), 0
    );
    totalLikesEl.textContent = formatNumber(totalLikes);
    
    const totalEngagement = allTweets.reduce((sum, tweet) => 
        sum + (tweet.engagement_metrics?.likes || 0) + 
        (tweet.engagement_metrics?.retweets || 0) + 
        (tweet.engagement_metrics?.replies || 0), 0
    );
    const avgEngagement = allTweets.length > 0 ? Math.round(totalEngagement / allTweets.length) : 0;
    avgEngagementEl.textContent = formatNumber(avgEngagement);
}

// Utility functions
function formatDate(date) {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
        return 'Just now';
    } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// UI state functions
function showLoading(show) {
    loadingState.style.display = show ? 'block' : 'none';
    if (show) {
        tweetsContainer.style.display = 'none';
        loadMoreBtn.style.display = 'none';
        hideEmptyState();
    } else {
        tweetsContainer.style.display = 'grid';
    }
}

function showEmptyState() {
    emptyState.style.display = 'block';
    tweetsContainer.style.display = 'none';
    loadMoreBtn.style.display = 'none';
}

function hideEmptyState() {
    emptyState.style.display = 'none';
    tweetsContainer.style.display = 'grid';
}

function showError(message) {
    // You can implement a toast notification here
    console.error(message);
}

// Configuration instructions
console.log(`
🚀 Enhanced JK Rowling Tweet Viewer Setup Instructions:

1. ✅ Supabase credentials configured
2. ✅ Twitter Widgets API loaded for embedded tweets
3. ✅ Media gallery support for images and videos
4. ✅ Reply context and embedded original tweets
5. ✅ Modal viewer for full-size media
6. ✅ Enhanced filtering (All, Recent, Popular, Replies)

Features included:
- ✅ Real-time search
- ✅ Filter by popularity/recent/replies
- ✅ Engagement metrics
- ✅ Direct links to Twitter
- ✅ Embedded tweets for replies
- ✅ Media gallery with modal viewer
- ✅ Reply context display
- ✅ Mobile responsive
- ✅ Loading states
- ✅ Error handling
- ✅ Twitter Widgets integration
`);
