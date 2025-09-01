const SupabaseClient = require('./supabase-client');

async function fixManualTweetURLFinal() {
    console.log('🔧 Fixing manual tweet URL with correct Twitter ID...');
    
    const supabase = new SupabaseClient();
    
    try {
        // The correct Twitter URL from the real tweet
        const correctTwitterURL = 'https://twitter.com/jk_rowling/status/1962069776072593703';
        
        console.log(`🎯 Using Twitter URL: ${correctTwitterURL}`);
        
        // Update the manual tweet with the correct Twitter URL
        const { data: updatedTweet, error: updateError } = await supabase.supabase
            .from('jk_rowling_posts')
            .update({ url: correctTwitterURL })
            .eq('junkipedia_id', 'x_manual_nicola_sturgeon_repost')
            .select()
            .single();

        if (updateError) {
            console.log('❌ Error updating tweet:', updateError.message);
        } else {
            console.log('✅ Successfully updated manual tweet URL');
            console.log(`   New URL: ${updatedTweet.url}`);
            console.log(`   Now the "View on Twitter" button will go to the correct Twitter post!`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

fixManualTweetURLFinal().catch(console.error);
