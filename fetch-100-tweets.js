const JunkipediaAPI = require('./junkipedia-api');
const SupabaseClient = require('./supabase-client');

class TweetFetcher {
    constructor() {
        this.junkipedia = new JunkipediaAPI();
        this.supabase = new SupabaseClient();
    }

    async fetch100Tweets() {
        console.log(`🚀 Attempting to fetch 100 tweets from Junkipedia...`);
        
        let allTweets = [];
        let page = 1;
        const limit = 10;
        const maxPages = 20; // Try up to 20 pages
        
        while (page <= maxPages && allTweets.length < 100) {
            console.log(`📄 Fetching page ${page}...`);
            
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
                
                // Check if we're getting new tweets or duplicates
                const newTweets = tweets.filter(tweet => 
                    !allTweets.some(existing => existing.id === tweet.id)
                );
                
                if (newTweets.length === 0) {
                    console.log('⚠️  No new tweets found on this page');
                    break;
                }
                
                allTweets = allTweets.concat(newTweets);
                console.log(`✅ Fetched ${tweets.length} tweets (${newTweets.length} new, total: ${allTweets.length})`);
                
                // Show sample of new tweets
                if (newTweets.length > 0) {
                    const firstNew = newTweets[0];
                    const lastNew = newTweets[newTweets.length - 1];
                    console.log(`   📅 New tweets: ${firstNew.attributes?.published_at} to ${lastNew.attributes?.published_at}`);
                }
                
                // If we got fewer tweets than requested, we might be reaching the end
                if (tweets.length < limit) {
                    console.log('📭 Reached end of available tweets');
                    break;
                }
                
                page++;
                
                // Add a small delay to be respectful to the API
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`❌ Error fetching page ${page}:`, error.message);
                break;
            }
        }
        
        console.log(`📊 Total unique tweets fetched: ${allTweets.length}`);
        
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
    const fetchedCount = await fetcher.fetch100Tweets();
    
    // Show final stats
    console.log('\n📊 Final database stats:');
    const finalPosts = await fetcher.supabase.getAllPosts();
    console.log(`📝 Total posts: ${finalPosts.length}`);
    
    if (finalPosts.length > 0) {
        const latestPost = finalPosts[0];
        const oldestPost = finalPosts[finalPosts.length - 1];
        console.log(`📅 Date range: ${oldestPost.published_at} to ${latestPost.published_at}`);
        
        // Calculate how many more we need for 100
        const needed = 100 - finalPosts.length;
        if (needed > 0) {
            console.log(`📈 Need ${needed} more tweets to reach 100`);
        } else {
            console.log(`🎉 Successfully reached ${finalPosts.length} tweets!`);
        }
    }
}

main().catch(console.error);
