const SupabaseClient = require('./supabase-client');

async function checkRepostInDB() {
    console.log('🔍 Checking if repost is in database...');
    
    const supabase = new SupabaseClient();
    
    try {
        // Check for the specific repost we added
        const { data: specificRepost, error: specificError } = await supabase.supabase
            .from('jk_rowling_posts')
            .select('*')
            .eq('junkipedia_id', 'x_manual_nicola_sturgeon_repost')
            .single();

        if (specificError) {
            console.error('❌ Error fetching specific repost:', specificError.message);
        } else if (specificRepost) {
            console.log('✅ Specific repost found:');
            console.log(`   🆔 ID: ${specificRepost.id}`);
            console.log(`   📝 Content: ${specificRepost.content.substring(0, 100)}...`);
            console.log(`   🏷️  Post Type: ${specificRepost.post_type}`);
            console.log(`   📅 Published: ${specificRepost.published_at}`);
        }

        // Check for all reposts
        const { data: allReposts, error: repostsError } = await supabase.supabase
            .from('jk_rowling_posts')
            .select('*')
            .eq('post_type', 'repost')
            .order('published_at', { ascending: false });

        if (repostsError) {
            console.error('❌ Error fetching reposts:', repostsError.message);
        } else {
            console.log(`\n📊 Found ${allReposts.length} reposts in database:`);
            allReposts.forEach((repost, index) => {
                console.log(`\n   Repost ${index + 1}:`);
                console.log(`   🆔 ID: ${repost.id}`);
                console.log(`   📝 Content: ${repost.content.substring(0, 80)}...`);
                console.log(`   📅 Published: ${repost.published_at}`);
                console.log(`   🏷️  Post Type: ${repost.post_type}`);
            });
        }

        // Check recent posts (last 10)
        const { data: recentPosts, error: recentError } = await supabase.supabase
            .from('jk_rowling_posts')
            .select('*')
            .order('published_at', { ascending: false })
            .limit(10);

        if (recentError) {
            console.error('❌ Error fetching recent posts:', recentError.message);
        } else {
            console.log(`\n📊 Recent 10 posts in database:`);
            recentPosts.forEach((post, index) => {
                console.log(`\n   Post ${index + 1}:`);
                console.log(`   🆔 ID: ${post.id}`);
                console.log(`   📝 Content: ${post.content.substring(0, 80)}...`);
                console.log(`   📅 Published: ${post.published_at}`);
                console.log(`   🏷️  Post Type: ${post.post_type}`);
            });
        }

    } catch (error) {
        console.error('❌ Error checking database:', error.message);
    }
}

checkRepostInDB().catch(console.error);
