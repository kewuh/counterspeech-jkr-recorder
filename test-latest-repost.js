const XRepostsAPI = require('./x-reposts-api');
const SupabaseClient = require('./supabase-client');

async function testLatestRepost() {
    console.log('🧪 Testing X API Integration - Latest Repost');
    console.log('============================================\n');

    const xApi = new XRepostsAPI();
    const supabase = new SupabaseClient();

    try {
        // Test 1: Get latest repost
        console.log('🔍 Test 1: Getting latest repost...');
        const latestRepost = await xApi.getLatestRepost();
        
        if (!latestRepost) {
            console.log('❌ No latest repost found');
            return;
        }

        console.log('✅ Latest repost found:');
        console.log(`   🆔 Repost ID: ${latestRepost.id}`);
        console.log(`   📅 Created: ${latestRepost.created_at}`);
        console.log(`   📝 Text: ${latestRepost.text.substring(0, 100)}...`);
        
        if (latestRepost.referenced_tweets) {
            const originalTweetRef = latestRepost.referenced_tweets.find(ref => ref.type === 'retweeted');
            if (originalTweetRef) {
                console.log(`   🔗 Original Tweet ID: ${originalTweetRef.id}`);
            }
        }

        // Test 2: Get detailed repost information
        console.log('\n🔍 Test 2: Getting detailed repost information...');
        const repostDetails = await xApi.getRepostDetails(latestRepost.id);
        
        if (repostDetails) {
            console.log('✅ Repost details retrieved:');
            console.log(`   📊 Engagement: ${JSON.stringify(repostDetails.repost.public_metrics)}`);
            
            if (repostDetails.originalTweet) {
                console.log('   📝 Original tweet found:');
                console.log(`      🆔 ID: ${repostDetails.originalTweet.id}`);
                console.log(`      👤 Author ID: ${repostDetails.originalTweet.author_id}`);
                console.log(`      📅 Created: ${repostDetails.originalTweet.created_at}`);
                console.log(`      📝 Text: ${repostDetails.originalTweet.text.substring(0, 100)}...`);
            }
        }

        // Test 3: Format for storage
        console.log('\n🔍 Test 3: Formatting for storage...');
        const formattedRepost = xApi.formatRepostForStorage(
            latestRepost, 
            repostDetails?.originalTweet || null
        );
        
        console.log('✅ Formatted repost data:');
        console.log(`   🆔 Junkipedia ID: ${formattedRepost.junkipedia_id}`);
        console.log(`   📝 Content: ${formattedRepost.content.substring(0, 100)}...`);
        console.log(`   🏷️  Post Type: ${formattedRepost.post_type}`);
        console.log(`   📊 Engagement: ${JSON.stringify(formattedRepost.engagement_metrics)}`);
        
        if (formattedRepost.original_tweet) {
            console.log(`   🔗 Original Tweet: ${formattedRepost.original_tweet.id}`);
        }

        // Test 4: Check if already exists in database
        console.log('\n🔍 Test 4: Checking if repost already exists in database...');
        const { data: existingPost, error } = await supabase.supabase
            .from('jk_rowling_posts')
            .select('id, junkipedia_id, published_at')
            .eq('junkipedia_id', formattedRepost.junkipedia_id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('❌ Database error:', error.message);
        } else if (existingPost) {
            console.log('⚠️  Repost already exists in database:');
            console.log(`   🆔 Database ID: ${existingPost.id}`);
            console.log(`   📅 Published: ${existingPost.published_at}`);
        } else {
            console.log('✅ Repost not found in database - ready to insert');
            
            // Test 5: Insert into database (optional - uncomment to test)
            /*
            console.log('\n🔍 Test 5: Inserting into database...');
            const { data: insertedPost, error: insertError } = await supabase.supabase
                .from('jk_rowling_posts')
                .insert([formattedRepost])
                .select()
                .single();

            if (insertError) {
                console.error('❌ Insert error:', insertError.message);
            } else {
                console.log('✅ Successfully inserted repost:');
                console.log(`   🆔 Database ID: ${insertedPost.id}`);
                console.log(`   📅 Published: ${insertedPost.published_at}`);
            }
            */
        }

        // Test 6: Check for new reposts since last processed
        console.log('\n🔍 Test 6: Checking for new reposts...');
        const lastProcessedTime = existingPost?.published_at || null;
        const newReposts = await xApi.checkForNewReposts(lastProcessedTime);
        
        console.log(`📊 Found ${newReposts.length} new reposts since last processed time`);
        if (newReposts.length > 0) {
            newReposts.forEach((repost, index) => {
                console.log(`   ${index + 1}. ${repost.id} - ${repost.created_at}`);
            });
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }

    console.log('\n🎯 Test completed!');
}

testLatestRepost().catch(console.error);
