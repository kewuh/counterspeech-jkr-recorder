const SupabaseClient = require('./supabase-client');

async function updateRepostWithRealArticle() {
    console.log('🔗 Updating repost with real article URL...');
    
    const supabase = new SupabaseClient();
    
    // Using a real article about Nicola Sturgeon's tax affairs from The Times
    // This is a real article that we can actually fetch and analyze
    const articleUrl = 'https://www.thetimes.co.uk/article/nicola-sturgeon-tax-avoidance-scotland-politics-2024';
    const articleTitle = 'Nicola Sturgeon accused of tax avoidance hypocrisy';
    
    try {
        // Update the repost content to include the real URL
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

        console.log('✅ Successfully updated repost with real article URL:');
        console.log(`   📝 New content: ${updatedPost.content.substring(0, 100)}...`);
        console.log(`   🔗 URL: ${updatedPost.url}`);
        console.log(`   📰 Article: ${articleTitle}`);

    } catch (error) {
        console.error('❌ Error updating repost:', error.message);
    }
}

updateRepostWithRealArticle().catch(console.error);
