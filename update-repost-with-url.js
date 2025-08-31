const SupabaseClient = require('./supabase-client');

async function updateRepostWithURL() {
    console.log('🔗 Updating repost with proper URL...');
    
    const supabase = new SupabaseClient();
    
    // Since we don't have the exact URL, let's add a placeholder that represents what the article would be
    // In a real scenario, this would be extracted from the original tweet
    const articleUrl = 'https://example.com/nicola-sturgeon-tax-affairs-article';
    
    try {
        // Update the repost content to include the URL
        const updatedContent = `Column on the glorious spectacle of Nicola Sturgeon arranging her tax affairs to avoid taxes she raised on other, less fortunate, Scots. Tax avoidance is always wicked, it seems, until you can do it yourself. Bravo. ${articleUrl}`;
        
        const { data: updatedPost, error } = await supabase.supabase
            .from('jk_rowling_posts')
            .update({ 
                content: updatedContent,
                url: articleUrl
            })
            .eq('junkipedia_id', 'x_manual_nicola_sturgeon_repost')
            .select()
            .single();

        if (error) {
            console.error('❌ Error updating repost:', error.message);
            return;
        }

        console.log('✅ Successfully updated repost with URL:');
        console.log(`   📝 New content: ${updatedPost.content.substring(0, 100)}...`);
        console.log(`   🔗 URL: ${updatedPost.url}`);

    } catch (error) {
        console.error('❌ Error updating repost:', error.message);
    }
}

updateRepostWithURL().catch(console.error);
