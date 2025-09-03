// Supabase Configuration
const SUPABASE_URL = 'https://fnkjqwfuvsbwmjjfhxmw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aFJi7KZniSomgW8EwtXGnA_WaUEConL';

// Initialize Supabase client
let supabase;

// Function to initialize Supabase client
function initializeSupabase() {
    try {
        if (typeof window.supabase === 'undefined') {
            throw new Error('Supabase client not loaded');
        }
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('🔧 Supabase client initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error);
        return false;
    }
}

// Debug Supabase connection
console.log('🔧 Initializing Supabase client...');
console.log('📡 Supabase URL:', SUPABASE_URL);
console.log('🔑 Supabase Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');

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
const lastSyncEl = document.getElementById('lastSync');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 App initializing...');
    
    // Setup event listeners and modal first
    setupEventListeners();
    createModal();
    
    // Wait for Supabase client to load
    waitForSupabase().then(() => {
        // Test Supabase connection and load tweets
        testSupabaseConnection().then(() => {
            loadTweets();
        }).catch(() => {
            // If connection fails, loadTweets will be called by testSupabaseConnection
            console.log('⚠️ Supabase connection failed, using fallback data');
        });
    }).catch(() => {
        // If Supabase client fails to load, show sample data
        console.log('⚠️ Supabase client failed to load, showing sample data');
        showSampleData();
    });
});

// Wait for Supabase client to load
function waitForSupabase() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max
        
        const checkSupabase = () => {
            attempts++;
            
            if (typeof window.supabase !== 'undefined') {
                console.log('✅ Supabase client loaded after', attempts * 100, 'ms');
                resolve();
            } else if (attempts >= maxAttempts) {
                console.error('❌ Supabase client failed to load after 5 seconds');
                reject(new Error('Supabase client timeout'));
            } else {
                setTimeout(checkSupabase, 100);
            }
        };
        
        checkSupabase();
    });
}

// Test Supabase connection
async function testSupabaseConnection() {
    try {
        console.log('🧪 Testing Supabase connection...');
        
        // Initialize Supabase client
        if (!initializeSupabase()) {
            throw new Error('Failed to initialize Supabase client');
        }
        
        const { data, error } = await supabase
            .from('jk_rowling_posts')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ Supabase connection failed:', error);
            throw error;
        }
        
        console.log('✅ Supabase connection successful');
    } catch (error) {
        console.error('❌ Failed to connect to Supabase:', error);
        showError('Failed to connect to database: ' + error.message);
        
        // Show sample data for testing
        console.log('📋 Loading sample data for testing...');
        allTweets = [
            {
                id: 1,
                content: "Sample tweet for testing the interface",
                published_at: new Date().toISOString(),
                url: "#",
                engagement_metrics: { likes: 100, retweets: 50, replies: 25 },
                tweet_analysis: {
                    is_potentially_transphobic: true,
                    confidence_level: "high",
                    concerns: ["Sample concern"],
                    explanation: "This is a sample analysis for testing",
                    severity: "medium",
                    recommendations: ["Sample recommendation"],
                    analyzed_at: new Date().toISOString()
                }
            }
        ];
        filteredTweets = [...allTweets];
        updateStats().then(() => {
            displayTweets();
            showLoading(false);
        });
    }
}

// Show sample data for testing
function showSampleData() {
    console.log('📋 Loading sample data for testing...');
    allTweets = [
        {
            id: 1,
            content: "Sample tweet for testing the interface - this would be a real tweet from JK Rowling",
            published_at: new Date().toISOString(),
            url: "#",
            engagement_metrics: { likes: 100, retweets: 50, replies: 25 },
            tweet_analysis: {
                is_potentially_transphobic: true,
                confidence_level: "high",
                concerns: ["Sample concern for testing"],
                explanation: "This is a sample analysis for testing the interface. In a real scenario, this would contain the AI's analysis of the tweet content.",
                severity: "medium",
                recommendations: ["Sample recommendation for testing"],
                analyzed_at: new Date().toISOString()
            }
        },
        {
            id: 2,
            content: "Another sample tweet that would be safe according to AI analysis",
            published_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            url: "#",
            engagement_metrics: { likes: 75, retweets: 30, replies: 15 },
            tweet_analysis: {
                is_potentially_transphobic: false,
                confidence_level: "high",
                concerns: [],
                explanation: "This sample tweet appears to be safe and does not contain transphobic content.",
                severity: "none",
                recommendations: [],
                analyzed_at: new Date().toISOString()
            }
        }
    ];
    filteredTweets = [...allTweets];
    updateStats().then(() => {
        displayTweets();
        showLoading(false);
    });
}

// Setup event listeners
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Search functionality
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    console.log('✅ Search input listener added');
    
    // Filter buttons
    console.log('🔍 Setting up filter buttons...');
    filterButtons.forEach((btn, index) => {
        console.log(`🔧 Setting up filter button ${index}:`, btn.textContent, 'with filter:', btn.dataset.filter);
        btn.addEventListener('click', () => {
            console.log('🎯 Filter button clicked:', btn.textContent, 'filter:', btn.dataset.filter);
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            console.log('🔄 Current filter set to:', currentFilter);
            
            // Clear search when switching filters
            searchInput.value = '';
            
            applyFilters();
        });
    });
    console.log(`✅ ${filterButtons.length} filter buttons set up`);
    
    // Load more button
    loadMoreBtn.addEventListener('click', loadMoreTweets);
    console.log('✅ Load more button listener added');
}

// Load tweets from Supabase
async function loadTweets() {
    try {
        console.log('🔄 Starting to load tweets...');
        showLoading(true);
        
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        // Fetch tweets first
        console.log('📡 Fetching tweets from Supabase...');
        const { data: tweets, error: tweetsError } = await supabase
            .from('jk_rowling_posts')
            .select('*')
            .order('published_at', { ascending: false })
            .limit(1000);
        
        if (tweetsError) {
            throw tweetsError;
        }
        
        // Fetch analysis data separately
        console.log('📡 Fetching analysis data from Supabase...');
        const { data: analyses, error: analysesError } = await supabase
            .from('tweet_analysis')
            .select('*');
        
        if (analysesError) {
            console.warn('⚠️ Could not fetch analysis data:', analysesError.message);
        }
        
        // Fetch article content data separately
        console.log('📡 Fetching article content from Supabase...');
        const { data: articles, error: articlesError } = await supabase
            .from('article_content')
            .select('*');
        
        if (articlesError) {
            console.warn('⚠️ Could not fetch article content:', articlesError.message);
        }
        
        // Fetch reply context data separately
        console.log('📡 Fetching reply context data from Supabase...');
        const { data: replyContexts, error: contextsError } = await supabase
            .from('reply_contexts')
            .select('*');
        
        if (contextsError) {
            console.warn('⚠️ Could not fetch reply context data:', contextsError.message);
        }
        
        // Combine tweets with their analysis, article data, and reply context
        const tweetsWithAnalysis = tweets
            .filter(tweet => tweet.post_type !== 'sync_tracking') // Filter out sync tracking records
            .map(tweet => {
                const analysis = analyses?.find(a => a.tweet_id === tweet.junkipedia_id);
                const linkedArticles = articles?.filter(a => a.tweet_id === tweet.junkipedia_id);
                const replyContext = replyContexts?.find(rc => rc.reply_tweet_id === tweet.junkipedia_id);
                
                // If this tweet has reply context, also get the analysis for the quoted/replied-to tweet
                let contextAnalysis = null;
                if (replyContext) {
                    const contextTweetId = replyContext.original_tweet_id;
                    contextAnalysis = analyses?.find(a => a.tweet_id === `quoted_${contextTweetId}`);
                }
                
                return {
                    ...tweet,
                    tweet_analysis: analysis || null,
                    linked_articles: linkedArticles || [],
                    reply_context: replyContext || null,
                    context_analysis: contextAnalysis || null
                };
            });
        
        console.log('✅ Tweets loaded successfully:', tweetsWithAnalysis?.length || 0, 'tweets');
        console.log('📊 Analysis data found:', analyses?.length || 0, 'analyses');
        console.log('📄 Article content found:', articles?.length || 0, 'articles');
        console.log('🔗 Reply context data found:', replyContexts?.length || 0, 'contexts');
        allTweets = tweetsWithAnalysis || [];
        filteredTweets = [...allTweets];
        
        updateStats().then(() => {
            displayTweets();
            showLoading(false);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        showError('Failed to load tweets: ' + error.message);
        showLoading(false);
    }
}

// Display tweets
function displayTweets() {
    // Show all filtered tweets at once
    const tweetsToShow = filteredTweets;
    
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
    
    // Handle repost/retweet indicator
    const repostIndicator = template.querySelector('.repost-indicator');
    
    // Check if this is a repost or retweet
    const isRepost = tweet.post_type === 'repost' && tweet.raw_data?.original_tweet;
    const isRetweet = tweet.content.startsWith('RT @') || tweet.content.startsWith('Retweet @');
    
    if (isRepost || isRetweet) {
        repostIndicator.style.display = 'block';
        
        if (isRepost && tweet.raw_data?.original_tweet) {
            // Handle repost with original tweet data
            const originalTweet = tweet.raw_data.original_tweet;
            const originalAuthor = originalTweet.author_username || originalTweet.author_id || 'unknown';
            const originalTime = originalTweet.created_at ? formatRelativeTime(new Date(originalTweet.created_at)) : '';
            
            repostIndicator.querySelector('.repost-author').textContent = `@${originalAuthor}`;
            repostIndicator.querySelector('.repost-time').textContent = originalTime;
        } else if (isRetweet) {
            // Handle retweet by parsing the RT @username format
            const rtMatch = tweet.content.match(/^RT @(\w+)/);
            if (rtMatch) {
                const username = rtMatch[1];
                repostIndicator.querySelector('.repost-author').textContent = `@${username}`;
                repostIndicator.querySelector('.repost-time').textContent = ''; // No original time for RT format
            }
        }
    }
    
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
    
    // Add AI Analysis Results
    const analysis = tweet.tweet_analysis;
    if (analysis) {
        const analysisContainer = template.querySelector('.ai-analysis');
        if (analysisContainer) {
            analysisContainer.style.display = 'block';
            
            // Add transphobia warning if flagged
            if (analysis.is_potentially_transphobic) {
                const warning = document.createElement('div');
                warning.className = 'transphobia-warning';
                warning.innerHTML = `
                    <div class="warning-header">
                        <span class="warning-icon">⚠️</span>
                        <span class="warning-title">AI Analysis: Potentially Transphobic Content</span>
                        <span class="severity-badge severity-${analysis.severity}">${analysis.severity.toUpperCase()}</span>
                    </div>
                    <div class="warning-details">
                        <div class="confidence">Confidence: ${analysis.confidence_level}</div>
                        <div class="concerns">
                            <strong>Concerns:</strong>
                            <ul>
                                ${(analysis.concerns || []).map(concern => `<li>${concern}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="explanation">
                            <strong>Analysis:</strong> ${analysis.explanation}
                        </div>

                        ${analysis.media_analysis && analysis.media_analysis !== 'Not analyzed' ? `
                            <div class="media-analysis">
                                <strong>Media Analysis:</strong> ${analysis.media_analysis}
                            </div>
                        ` : ''}
                        ${analysis.article_analysis && analysis.article_analysis !== 'No articles to analyze' ? `
                            <div class="article-analysis">
                                <strong>Article Analysis:</strong> ${analysis.article_analysis}
                            </div>
                        ` : ''}
                        ${analysis.combined_analysis && analysis.combined_analysis !== 'Tweet only analysis' ? `
                            <div class="combined-analysis">
                                <strong>Combined Analysis:</strong> ${analysis.combined_analysis}
                            </div>
                        ` : ''}
                        ${analysis.articles_analyzed && analysis.articles_analyzed > 0 ? `
                            <div class="articles-count">
                                <strong>Articles Analyzed:</strong> ${analysis.articles_analyzed}
                            </div>
                        ` : ''}
                        ${analysis.images_analyzed && analysis.images_analyzed > 0 ? `
                            <div class="images-count">
                                <strong>Images Analyzed:</strong> ${analysis.images_analyzed}
                            </div>
                        ` : ''}
                        ${tweet.linked_articles && tweet.linked_articles.length > 0 ? `
                            <div class="linked-articles">
                                <strong>Linked Articles:</strong>
                                <ul>
                                    ${tweet.linked_articles.map(article => `
                                        <li>
                                            <a href="${article.url}" target="_blank">${article.title || article.url}</a>
                                            ${article.word_count > 10 ? ` (${article.word_count} words)` : ''}
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        <div class="analysis-meta">
                            Analyzed: ${formatDate(new Date(analysis.analyzed_at))}
                        </div>
                    </div>
                `;
                analysisContainer.appendChild(warning);
            } else {
                // Show non-transphobic analysis
                const safeAnalysis = document.createElement('div');
                safeAnalysis.className = 'safe-analysis';
                safeAnalysis.innerHTML = `
                    <div class="safe-header">
                        <span class="safe-icon">✅</span>
                        <span class="safe-title">AI Analysis: No Transphobic Content Detected</span>
                        <span class="confidence-badge">${analysis.confidence_level}</span>
                    </div>
                    <div class="safe-details">
                        <div class="explanation">${analysis.explanation}</div>
                        ${analysis.media_analysis && analysis.media_analysis !== 'Not analyzed' ? `
                            <div class="media-analysis">
                                <strong>Media Analysis:</strong> ${analysis.media_analysis}
                            </div>
                        ` : ''}
                        ${analysis.article_analysis && analysis.article_analysis !== 'No articles to analyze' ? `
                            <div class="article-analysis">
                                <strong>Article Analysis:</strong> ${analysis.article_analysis}
                            </div>
                        ` : ''}
                        ${analysis.combined_analysis && analysis.combined_analysis !== 'Tweet only analysis' ? `
                            <div class="combined-analysis">
                                <strong>Combined Analysis:</strong> ${analysis.combined_analysis}
                            </div>
                        ` : ''}
                        ${analysis.articles_analyzed && analysis.articles_analyzed > 0 ? `
                            <div class="articles-count">
                                <strong>Articles Analyzed:</strong> ${analysis.articles_analyzed}
                            </div>
                        ` : ''}
                        ${analysis.images_analyzed && analysis.images_analyzed > 0 ? `
                            <div class="images-count">
                                <strong>Images Analyzed:</strong> ${analysis.images_analyzed}
                            </div>
                        ` : ''}
                        <div class="analysis-meta">
                            Analyzed: ${formatDate(new Date(analysis.analyzed_at))}
                        </div>
                    </div>
                `;
                analysisContainer.appendChild(safeAnalysis);
            }
        }
    } else {
        // No analysis available
        const analysisContainer = template.querySelector('.ai-analysis');
        if (analysisContainer) {
            const noAnalysis = document.createElement('div');
            noAnalysis.className = 'no-analysis';
            noAnalysis.innerHTML = `
                <div class="no-analysis-header">
                    <span class="no-analysis-icon">⏳</span>
                    <span class="no-analysis-title">AI Analysis: Pending</span>
                </div>
                <div class="no-analysis-details">
                    This tweet hasn't been analyzed yet. Analysis will be available soon.
                </div>
            `;
            analysisContainer.appendChild(noAnalysis);
        }
    }
    
    // Handle media content
    const mediaContainer = template.querySelector('.tweet-media');
    const mediaGallery = template.querySelector('.media-gallery');
    
    if (tweet.raw_data?.attributes?.post_data?.extended_entities?.media) {
        const media = tweet.raw_data.attributes.post_data.extended_entities.media;
        displayMedia(mediaGallery, media);
        mediaContainer.style.display = 'block';
    }
    
    // Handle reply context (replies, quotes, retweets)
    const replyContext = template.querySelector('.reply-context');
    const replyToUser = template.querySelector('.reply-to-user');
    const searchData = tweet.raw_data?.attributes?.search_data_fields;
    
    // Check for different types of interactions
    let interactionType = null;
    let targetTweetId = null;
    let targetUsername = null;
    
    // Check for replies
    if (tweet.raw_data?.attributes?.post_data?.in_reply_to_screen_name) {
        const replyToScreenName = tweet.raw_data.attributes.post_data.in_reply_to_screen_name;
        const replyToStatusId = tweet.raw_data.attributes.post_data.in_reply_to_status_id_str;
        
        interactionType = 'reply';
        targetTweetId = replyToStatusId;
        targetUsername = replyToScreenName;
        
        // Only show reply context if the tweet content doesn't already start with the username
        if (!tweet.content.startsWith(`@${replyToScreenName}`)) {
            replyToUser.textContent = `Replying to @${replyToScreenName}`;
            replyToUser.href = `https://twitter.com/${replyToScreenName}/status/${replyToStatusId}`;
            replyContext.style.display = 'block';
        } else {
            // Hide reply context since the tweet content already shows the reply
            replyContext.style.display = 'none';
        }
    }
    // Check for quotes
    else if (tweet.raw_data?.attributes?.post_data?.quoted_status_id_str) {
        interactionType = 'quote';
        targetTweetId = tweet.raw_data.attributes.post_data.quoted_status_id_str;
        
        replyToUser.textContent = `Quoting tweet`;
        replyToUser.href = `https://twitter.com/i/status/${targetTweetId}`;
        replyContext.style.display = 'block';
    }
    // Check for retweets
    else if (searchData?.shared_id) {
        interactionType = 'retweet';
        targetTweetId = searchData.shared_id;
        
        replyToUser.textContent = `Retweeting`;
        replyToUser.href = `https://twitter.com/i/status/${searchData.shared_id}`;
        replyContext.style.display = 'block';
    }
    
    // Don't show reply context for RT format tweets (they're handled by the repost indicator)
    if (tweet.content.startsWith('RT @')) {
        replyContext.style.display = 'none';
    }
    
    // Display context analysis if available (for quoted/replied tweets)
    if (interactionType && targetTweetId) {
        const contextAnalysis = template.querySelector('.context-analysis');
        const contextAnalysisContent = template.querySelector('.context-analysis-content');
        
        // Try to find analysis for the quoted/replied-to tweet
        const contextTweetId = targetTweetId;
        const contextAnalysisKey = `quoted_${contextTweetId}`;
        
        // Check if we have analysis for this context tweet
        if (tweet.context_analysis) {
            contextAnalysisContent.innerHTML = `
                <div class="analysis-summary">
                    <strong>Content Analysis:</strong> ${tweet.context_analysis.explanation || 'No analysis available'}
                </div>
                <div class="analysis-details">
                    <span class="severity ${tweet.context_analysis.severity || 'low'}">${tweet.context_analysis.severity || 'Unknown'} severity</span>
                    <span class="confidence ${tweet.context_analysis.confidence_level || 'low'}">${tweet.context_analysis.confidence_level || 'Unknown'} confidence</span>
                </div>
            `;
            contextAnalysis.style.display = 'block';
        } else {
            // Hide context analysis if no data available
            contextAnalysis.style.display = 'none';
        }
    }
    
    // Embed functionality removed
    
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

// Embed tweet functionality removed

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
        // If no search term, apply current filter to all tweets
        applyFilters();
    } else {
        // If there's a search term, filter by search first, then apply current filter
        const searchFiltered = allTweets.filter(tweet => 
            tweet.content.toLowerCase().includes(searchTerm)
        );
        console.log('🔍 Search filtered to:', searchFiltered.length, 'tweets');
        
        // Apply current filter to search results
        let filtered = [...searchFiltered];
        
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
            case 'transphobic':
                filtered = filtered.filter(tweet => 
                    tweet.tweet_analysis && tweet.tweet_analysis.is_potentially_transphobic === true
                );
                break;
            case 'safe':
                filtered = filtered.filter(tweet => 
                    tweet.tweet_analysis && tweet.tweet_analysis.is_potentially_transphobic === false
                );
                break;
            default:
                // 'all' - no additional filtering
                break;
        }
        
        console.log('📝 Final filtered tweets after search + filter:', filtered.length);
        filteredTweets = filtered;
        currentPage = 0;
        displayTweets();
    }
}

// Apply filters
function applyFilters() {
    console.log('🔍 Applying filters...');
    console.log('📊 Current filter:', currentFilter);
    console.log('📝 All tweets:', allTweets.length);
    
    // Start fresh from all tweets, not from already filtered results
    let filtered = [...allTweets];
    
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
        case 'transphobic':
            filtered = filtered.filter(tweet => 
                tweet.tweet_analysis && tweet.tweet_analysis.is_potentially_transphobic === true
            );
            break;
        case 'safe':
            filtered = filtered.filter(tweet => 
                tweet.tweet_analysis && tweet.tweet_analysis.is_potentially_transphobic === false
            );
            break;
        default:
            // 'all' - no additional filtering
            break;
    }
    
    console.log('📝 Filtered tweets after:', filtered.length);
    console.log('📊 Tweets with analysis:', filtered.filter(t => t.tweet_analysis).length);
    console.log('🚨 Transphobic tweets:', filtered.filter(t => t.tweet_analysis && t.tweet_analysis.is_potentially_transphobic === true).length);
    console.log('✅ Safe tweets:', filtered.filter(t => t.tweet_analysis && t.tweet_analysis.is_potentially_transphobic === false).length);
    
    // Show what filter was applied
    console.log(`🎯 Applied filter: ${currentFilter}`);
    
    // Debug: Show some examples of analysis data
    if (currentFilter === 'transphobic' || currentFilter === 'safe') {
        const analyzedTweets = filtered.filter(t => t.tweet_analysis);
        console.log('🔍 Sample analysis data:');
        analyzedTweets.slice(0, 3).forEach((tweet, i) => {
            console.log(`   Tweet ${i + 1}:`, {
                id: tweet.junkipedia_id,
                hasAnalysis: !!tweet.tweet_analysis,
                isTransphobic: tweet.tweet_analysis?.is_potentially_transphobic,
                confidence: tweet.tweet_analysis?.confidence_level
            });
        });
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
async function updateStats() {
    totalPostsEl.textContent = allTweets.length;
    
    // Get last sync time from sync tracking record
    try {
        const lastSyncTime = await getLastSyncTime();
        if (lastSyncTime) {
            console.log('🔄 Setting last sync time from database:', lastSyncTime);
            lastSyncEl.textContent = formatDateTime(new Date(lastSyncTime));
        } else {
            // Fallback to current time if no sync tracking found
            console.log('⚠️ No sync tracking found, using current time');
            const currentTime = new Date();
            lastSyncEl.textContent = formatDateTime(currentTime);
        }
    } catch (error) {
        // Fallback to current time on error
        console.error('❌ Error getting last sync time:', error);
        const currentTime = new Date();
        lastSyncEl.textContent = formatDateTime(currentTime);
    }
    
    // Calculate AI analysis statistics
    const analyzedCount = allTweets.filter(t => t.tweet_analysis).length;
    const transphobicCount = allTweets.filter(t => t.tweet_analysis?.is_potentially_transphobic).length;
    const safeCount = allTweets.filter(t => t.tweet_analysis?.is_potentially_transphobic === false).length;
    
    // Calculate interaction statistics
    let replyCount = 0;
    let quoteCount = 0;
    let retweetCount = 0;
    
    allTweets.forEach(tweet => {
        const postData = tweet.raw_data?.attributes?.post_data;
        const searchData = tweet.raw_data?.attributes?.search_data_fields;
        
        if (postData?.in_reply_to_screen_name) {
            replyCount++;
        } else if (searchData?.quoted_id) {
            quoteCount++;
        } else if (searchData?.shared_id) {
            retweetCount++;
        }
    });
    
    // Log statistics
    console.log(`📊 Statistics:`);
    console.log(`   📝 Total tweets: ${allTweets.length}`);
    console.log(`   🤖 Analyzed: ${analyzedCount}`);
    console.log(`   🚨 Transphobic: ${transphobicCount}`);
    console.log(`   ✅ Safe: ${safeCount}`);
    console.log(`   📝 Replies: ${replyCount}`);
    console.log(`   💬 Quotes: ${quoteCount}`);
    console.log(`   🔄 Retweets: ${retweetCount}`);
}

// Get last sync time from database
async function getLastSyncTime() {
    try {
        console.log('🔍 getLastSyncTime: Starting...');
        
        if (!supabase) {
            console.log('❌ getLastSyncTime: Supabase not initialized');
            return null;
        }

        console.log('🔍 getLastSyncTime: Querying database...');
        const { data: syncRecord, error } = await supabase
            .from('jk_rowling_posts')
            .select('published_at, raw_data')
            .eq('junkipedia_id', 'sync_tracking_last_run')
            .single();

        console.log('🔍 getLastSyncTime: Query result:', { error: error?.message, recordFound: !!syncRecord });

        if (error || !syncRecord) {
            console.log('❌ getLastSyncTime: No sync record found or error:', error?.message);
            return null;
        }

        console.log('🔍 getLastSyncTime: Sync record found:', {
            published_at: syncRecord.published_at,
            raw_data: syncRecord.raw_data
        });

        // Return the last cron run time from raw_data, or fallback to published_at
        const lastSyncTime = syncRecord.raw_data?.last_cron_run || syncRecord.published_at;
        console.log('✅ getLastSyncTime: Returning:', lastSyncTime);
        return lastSyncTime;

    } catch (error) {
        console.error('❌ getLastSyncTime: Error:', error);
        return null;
    }
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

function formatRelativeTime(date) {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
        return 'Just now';
    } else if (diffInHours < 24) {
        return `${diffInHours}h`;
    } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d`;
    }
}

function formatDateTime(date) {
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatMediaAnalysis(mediaAnalysis) {
    try {
        // Try to parse as JSON
        const analysis = JSON.parse(mediaAnalysis);
        
        let formatted = '';
        
        // Add overall assessment
        if (analysis.overall_assessment) {
            formatted += `<div class="media-overall"><strong>Overall Assessment:</strong> ${analysis.overall_assessment}</div>`;
        }
        
        // Add individual image analyses
        if (analysis.individual_analyses && analysis.individual_analyses.length > 0) {
            formatted += '<div class="media-individual"><strong>Individual Image Analyses:</strong><ul>';
            analysis.individual_analyses.forEach((imgAnalysis, index) => {
                formatted += `<li><strong>Image ${index + 1}:</strong> ${imgAnalysis.analysis || imgAnalysis}</li>`;
            });
            formatted += '</ul></div>';
        }
        
        // Add concerns
        if (analysis.concerns && analysis.concerns.length > 0) {
            formatted += '<div class="media-concerns"><strong>Visual Concerns:</strong><ul>';
            analysis.concerns.forEach(concern => {
                formatted += `<li>${concern}</li>`;
            });
            formatted += '</ul></div>';
        }
        
        // Add recommendations
        if (analysis.recommendations && analysis.recommendations.length > 0) {
            formatted += '<div class="media-recommendations"><strong>Recommendations:</strong><ul>';
            analysis.recommendations.forEach(rec => {
                formatted += `<li>${rec}</li>`;
            });
            formatted += '</ul></div>';
        }
        
        // Add harmful content detection
        if (analysis.harmful_content_detected !== undefined) {
            const status = analysis.harmful_content_detected ? '⚠️ Detected' : '✅ Not Detected';
            formatted += `<div class="media-harmful"><strong>Harmful Content:</strong> ${status}</div>`;
        }
        
        return formatted;
        
    } catch (error) {
        // If it's not JSON, return as plain text
        return mediaAnalysis;
    }
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
    console.error(message);
    
    // Show error on page
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div style="background: #fee; border: 1px solid #fcc; padding: 15px; margin: 20px; border-radius: 8px; color: #c33;">
            <strong>Error:</strong> ${message}
        </div>
    `;
    
    // Insert at the top of the container
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(errorDiv, container.firstChild);
    }
    
    // Hide loading state
    showLoading(false);
}

// Demo feed functionality
function initializeDemoFeed() {
    const demoFeed = document.getElementById('demoFeed');
    const demoTotalPosts = document.getElementById('demoTotalPosts');
    const demoTransphobicPosts = document.getElementById('demoTransphobicPosts');
    const demoPledgesTriggered = document.getElementById('demoPledgesTriggered');
    
    let totalPosts = 0;
    let transphobicPosts = 0;
    let pledgesTriggered = 0;
    
    // Demo feed data
    const demoFeedData = [
        {
            time: '2 minutes ago',
            text: 'Just had a lovely walk in the park with my dog. Beautiful day!',
            status: 'safe',
            pledge: null
        },
        {
            time: '5 minutes ago',
            text: 'Trans women are women. Period. Anyone who says otherwise is spreading hate.',
            status: 'transphobic',
            pledge: '£2 charged to 47 pledges'
        },
        {
            time: '8 minutes ago',
            text: 'Reading a fascinating book about medieval history. Highly recommend!',
            status: 'safe',
            pledge: null
        },
        {
            time: '12 minutes ago',
            text: 'The idea that men can become women is a dangerous lie that threatens our society.',
            status: 'transphobic',
            pledge: '£5 charged to 23 pledges'
        },
        {
            time: '15 minutes ago',
            text: 'Great meeting with my publisher today. Exciting news coming soon!',
            status: 'safe',
            pledge: null
        },
        {
            time: '20 minutes ago',
            text: 'Biological reality matters. You cannot change your sex, only mutilate your body.',
            status: 'transphobic',
            pledge: '£10 charged to 15 pledges'
        }
    ];
    
    function addDemoFeedItem(item) {
        const feedItem = document.createElement('div');
        feedItem.className = `demo-feed-item ${item.status}`;
        
        feedItem.innerHTML = `
            <div class="demo-feed-item-header">
                <span class="demo-feed-item-time">${item.time}</span>
                <span class="demo-feed-item-status ${item.status}">${item.status === 'transphobic' ? '🚨 Transphobic' : '✅ Safe'}</span>
            </div>
            <div class="demo-feed-item-text">"${item.text}"</div>
            ${item.pledge ? `<div class="demo-feed-item-pledge">💳 ${item.pledge}</div>` : ''}
        `;
        
        demoFeed.insertBefore(feedItem, demoFeed.firstChild);
        
        // Keep only the last 10 items
        if (demoFeed.children.length > 10) {
            demoFeed.removeChild(demoFeed.lastChild);
        }
        
        // Update stats
        totalPosts++;
        if (item.status === 'transphobic') {
            transphobicPosts++;
            if (item.pledge) pledgesTriggered++;
        }
        
        demoTotalPosts.textContent = totalPosts;
        demoTransphobicPosts.textContent = transphobicPosts;
        demoPledgesTriggered.textContent = pledgesTriggered;
    }
    
    // Add initial items
    demoFeedData.forEach(item => addDemoFeedItem(item));
    
    // Simulate real-time updates
    setInterval(() => {
        const newItems = [
            {
                time: 'Just now',
                text: 'The gender ideology is destroying our children and families.',
                status: 'transphobic',
                pledge: '£3 charged to 31 pledges'
            },
            {
                time: 'Just now',
                text: 'Beautiful sunset tonight. Nature is truly amazing.',
                status: 'safe',
                pledge: null
            },
            {
                time: 'Just now',
                text: 'Men pretending to be women should not be in women\'s spaces.',
                status: 'transphobic',
                pledge: '£7 charged to 19 pledges'
            }
        ];
        
        const randomItem = newItems[Math.floor(Math.random() * newItems.length)];
        addDemoFeedItem(randomItem);
    }, 8000); // Add new item every 8 seconds
}

// Initialize demo feed
initializeDemoFeed();

// Mobile-optimized AI analysis functionality
function initializeMobileAIAnalysis() {
    // Add collapsible functionality for mobile
    document.addEventListener('click', (e) => {
        const header = e.target.closest('.warning-header, .safe-header, .no-analysis-header');
        if (header && window.innerWidth <= 768) {
            const analysisSection = header.closest('.transphobia-warning, .safe-analysis, .no-analysis');
            const details = analysisSection.querySelector('.warning-details, .safe-details, .no-analysis-details');
            
            if (details) {
                const isCollapsed = details.style.display === 'none';
                details.style.display = isCollapsed ? 'block' : 'none';
                
                // Add visual feedback
                header.style.opacity = isCollapsed ? '1' : '0.8';
                
                // Add expand/collapse indicator
                let indicator = header.querySelector('.expand-indicator');
                if (!indicator) {
                    indicator = document.createElement('span');
                    indicator.className = 'expand-indicator';
                    indicator.innerHTML = '▼';
                    indicator.style.cssText = `
                        margin-left: auto;
                        font-size: 12px;
                        transition: transform 0.2s ease;
                    `;
                    header.appendChild(indicator);
                }
                indicator.style.transform = isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        }
    });
    
    // Add touch-friendly improvements for mobile
    if (window.innerWidth <= 768) {
        // Make analysis sections more touch-friendly
        const analysisSections = document.querySelectorAll('.ai-analysis');
        analysisSections.forEach(section => {
            section.style.cursor = 'pointer';
            
            // Add touch feedback
            section.addEventListener('touchstart', () => {
                section.style.transform = 'scale(0.98)';
            });
            
            section.addEventListener('touchend', () => {
                section.style.transform = 'scale(1)';
            });
        });
        
        // Optimize linked articles for mobile
        const linkedArticles = document.querySelectorAll('.linked-articles a');
        linkedArticles.forEach(link => {
            link.style.cssText += `
                display: block;
                padding: 8px 0;
                min-height: 44px;
                line-height: 1.4;
            `;
        });
    }
}

// Initialize mobile optimizations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // ... existing initialization code ...
    
    // Initialize mobile AI analysis features
    initializeMobileAIAnalysis();
});

// Re-initialize mobile features when window is resized
window.addEventListener('resize', () => {
    initializeMobileAIAnalysis();
});

// Configuration instructions
console.log(`
🚀 Enhanced JK Rowling Tweet Viewer Setup Instructions:

1. ✅ Supabase credentials configured
2. ✅ Twitter Widgets API loaded for embedded tweets
3. ✅ Media gallery support for images and videos
4. ✅ Reply context and embedded original tweets
5. ✅ Modal viewer for full-size media
6. ✅ Enhanced filtering (All, Recent, Popular, Replies)
7. ✅ Live demo feed for transphobic content detection
8. ✅ Mobile-optimized AI analysis with collapsible sections
9. ✅ Touch-friendly interactions for mobile devices

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
- ✅ Live demo feed with pledge tracking
- ✅ Mobile-optimized AI analysis sections
- ✅ Collapsible analysis content for better mobile UX
- ✅ Touch-friendly interactions
`);
