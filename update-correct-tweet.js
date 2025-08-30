const SupabaseClient = require('./supabase-client');

async function updateCorrectTweet() {
    const supabase = new SupabaseClient();
    
    try {
        console.log('🔧 Updating with correct original tweet content...');
        
        // Update the reply context with the actual tweet content
        const { error } = await supabase.supabase
            .from('reply_contexts')
            .update({
                original_tweet_text: '@jk_rowling I grew up abused, sleeping under stairs with a scar on my forehead. Harry was me. Your books gave me means to cope. I cried when Harry died. Don\'t listen to these hateful people',
                original_user_username: 'hyperstiti0n',
                original_user_name: 'hyperstiti0n',
                raw_data: {
                    note: 'Actual tweet content from Twitter API'
                }
            })
            .eq('reply_context_id', '607231529_1960860047497683431');
        
        if (error) {
            console.error('❌ Error updating context:', error.message);
        } else {
            console.log('✅ Updated with correct tweet content');
        }
        
        // Delete the incorrect analysis
        const { error: deleteError } = await supabase.supabase
            .from('reply_analysis')
            .delete()
            .eq('reply_context_id', '607231529_1960860047497683431');
        
        if (deleteError) {
            console.error('❌ Error deleting incorrect analysis:', deleteError.message);
        } else {
            console.log('✅ Deleted incorrect analysis');
        }
        
        console.log('\n📝 CORRECT CONTEXT:');
        console.log('   Original tweet: "@jk_rowling I grew up abused, sleeping under stairs with a scar on my forehead. Harry was me. Your books gave me means to cope. I cried when Harry died. Don\'t listen to these hateful people"');
        console.log('   This is NOT a TERF tweet - it\'s someone sharing their personal story');
        console.log('   They\'re asking JK Rowling not to listen to "hateful people" (critics)');
        
    } catch (error) {
        console.error('❌ Error updating context:', error.message);
    }
}

updateCorrectTweet();
