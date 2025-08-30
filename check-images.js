const SupabaseClient = require('./supabase-client');

async function checkImages() {
    const supabase = new SupabaseClient();
    
    console.log('🖼️ Checking for tweets with images\n');
    
    try {
        const { data: tweets, error } = await supabase.supabase
            .from('jk_rowling_posts')
            .select('*')
            .limit(10);
            
        if (error) throw error;
        
        let imageCount = 0;
        
        tweets.forEach(tweet => {
            const media = tweet.raw_data?.attributes?.post_data?.extended_entities?.media;
            if (media && media.length > 0) {
                imageCount++;
                console.log(`📸 Tweet ${tweet.junkipedia_id}:`);
                console.log(`   Content: ${tweet.content.substring(0, 80)}...`);
                console.log(`   Images: ${media.length}`);
                media.forEach((img, i) => {
                    console.log(`     ${i+1}. ${img.type}: ${img.media_url_https || img.url}`);
                });
                console.log('');
            }
        });
        
        console.log(`📊 Found ${imageCount} tweets with images out of ${tweets.length} tweets`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkImages().catch(console.error);
