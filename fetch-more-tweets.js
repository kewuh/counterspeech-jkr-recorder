const JunkipediaAPI = require('./junkipedia-api');
const SupabaseClient = require('./supabase-client');

class TweetFetcher {
    constructor() {
        this.junkipedia = new JunkipediaAPI();
        this.supabase = new SupabaseClient();
    }

    async fetchMultiplePages(totalTweets = 100) {
        console.log(`🚀 Fetching ${totalTweets} tweets from Junkipedia...`);
        
        let allTweets = [];
        const limit = 10; // Junkipedia returns 10 per page
        const pages = Math.ceil(totalTweets / limit);
        
        for (let page = 1; page <= pages; page++) {
            console.log(`📄 Fetching page ${page}/${pages}...`);
            
            try {
                const response = await this.junkipedia.getChannelPosts({
                    limit: limit,
                    page: page
                });
                
                const tweets = response.data || [];
                
                if (tweets.length === 0) {
                    console.log('📭 No more tweets available');
                    break;
                }
                
                allTweets = allTweets.concat(tweets);
                console.log(`✅ Fetched ${tweets.length} tweets (total: ${allTweets.length})`);
                
                // If we got fewer tweets than requested, we've reached the end
                if (tweets.length < limit) {
                    console.log('📭 Reached end of available tweets');
                    break;
                }
                
                // Add a small delay to be respectful to the API
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`❌ Error fetching page ${page}:`, error.message);
                break;
            }
        }
        
        console.log(`📊 Total tweets fetched: ${allTweets.length}`);
        
        if (allTweets.length > 0) {
            console.log('📥 Inserting tweets into Supabase...');
            const result = await this.supabase.insertPosts(allTweets);
            console.log(`✅ Insertion complete: ${result.insertedCount} new tweets inserted, ${result.skippedCount} duplicates skipped`);
        }
        
        return allTweets.length;
    }
}

// Run the script
async function main() {
    const fetcher = new TweetFetcher();
    
    // Check current stats
    console.log('📊 Current database stats:');
    const currentPosts = await fetcher.supabase.getAllPosts();
    console.log(`📝 Current posts: ${currentPosts.length}`);
    
    // Fetch more tweets
    const tweetsToFetch = 100; // Fetch 100 tweets
    const fetchedCount = await fetcher.fetchMultiplePages(tweetsToFetch);
    
    // Show final stats
    console.log('\n📊 Final database stats:');
    const finalPosts = await fetcher.supabase.getAllPosts();
    console.log(`📝 Total posts: ${finalPosts.length}`);
    
    if (finalPosts.length > 0) {
        const latestPost = finalPosts[0];
        const oldestPost = finalPosts[finalPosts.length - 1];
        console.log(`📅 Date range: ${oldestPost.published_at} to ${latestPost.published_at}`);
    }
}

main().catch(console.error);
