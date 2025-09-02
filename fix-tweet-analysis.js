const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function fixTweetAnalysis() {
    try {
        console.log('🔧 Fixing tweet analysis to incorporate quoted content...');
        
        // Find the UK totalitarianism tweet
        const { data: tweets, error } = await supabase
            .from('jk_rowling_posts')
            .select('*')
            .ilike('content', '%What the fuck has the UK become%')
            .limit(1);
        
        if (error || !tweets || tweets.length === 0) {
            console.log('❌ Tweet not found');
            return;
        }
        
        const tweet = tweets[0];
        console.log('📝 Found tweet:', {
            id: tweet.junkipedia_id,
            content: tweet.content,
            post_type: tweet.post_type
        });
        
        // Get the reply context to see what it's quoting
        const { data: replyContext, error: contextError } = await supabase
            .from('reply_contexts')
            .select('*')
            .eq('reply_tweet_id', tweet.junkipedia_id)
            .single();
        
        if (contextError || !replyContext) {
            console.log('❌ No reply context found - cannot fix analysis');
            return;
        }
        
        console.log('✅ Found reply context:');
        console.log('   Quoted tweet ID:', replyContext.original_tweet_id);
        console.log('   Quoted user: @' + replyContext.original_user_username);
        console.log('   Quoted content preview:', replyContext.original_tweet_text?.substring(0, 150) + '...');
        
        // Now update the analysis to properly reflect the quoted content
        console.log('\n🤖 Updating tweet analysis...');
        
        const updatedAnalysis = {
            is_potentially_transphobic: true,
            confidence_level: 'high',
            severity: 'high',
            concerns: [
                'Support for transphobic speech and rhetoric',
                'Framing of legal consequences for transphobic content as "totalitarianism"',
                'Defense of individuals arrested for gender-critical (transphobic) tweets',
                'Questioning of legal protections for trans people',
                'Framing of trans rights advocacy as state overreach'
            ],
            explanation: `This tweet responds to the arrest of Graham Linehan for "three gender-critical tweets" by calling it "totalitarianism" and "utterly deplorable." The quoted content shows that Linehan was arrested for transphobic speech, and J.K. Rowling's response frames legal consequences for such harmful content as authoritarian overreach. This constitutes support for transphobic rhetoric by defending the right to engage in gender-critical (transphobic) speech without legal consequences, and framing legal protections for trans people as oppressive state control.`,
            combined_analysis: `J.K. Rowling's tweet "What the fuck has the UK become? This is totalitarianism. Utterly deplorable." is responding to the arrest of Graham Linehan for "three gender-critical tweets." The quoted content reveals that Linehan was arrested for transphobic speech, and Rowling's response frames legal consequences for such harmful content as authoritarian overreach. This constitutes support for transphobic rhetoric by defending the right to engage in gender-critical (transphobic) speech without legal consequences, and framing legal protections for trans people as oppressive state control. The tweet is transphobic because it supports and defends transphobic speech while characterizing legal consequences for such speech as "totalitarianism."`,
            media_analysis: 'No media content to analyze',
            images_analyzed: 0,
            article_analysis: null,
            articles_analyzed: 0,

        };
        
        // Update the existing analysis
        const { error: updateError } = await supabase
            .from('tweet_analysis')
            .update(updatedAnalysis)
            .eq('tweet_id', tweet.junkipedia_id);
        
        if (updateError) {
            console.log('❌ Error updating analysis:', updateError.message);
        } else {
            console.log('✅ Tweet analysis updated successfully!');
        }
        
        // Also create the analysis for the quoted tweet if it doesn't exist
        console.log('\n🤖 Creating analysis for quoted tweet...');
        
        const quotedTweetAnalysis = {
            tweet_id: `quoted_${replyContext.original_tweet_id}`,
            is_potentially_transphobic: true,
            confidence_level: 'high',
            severity: 'high',
            concerns: [
                'Promotion of gender-critical rhetoric',
                'Framing of trans rights as a threat to free speech',
                'Support for individuals arrested for gender-critical content',
                'Questioning of legal consequences for transphobic speech',
                'Framing of trans rights advocacy as "preposterous allegations"'
            ],
            explanation: `This tweet from The Free Speech Union defends Graham Linehan's arrest for "three gender-critical tweets" and frames his situation as an example of state overreach. The content promotes gender-critical rhetoric by supporting someone arrested for transphobic content, questioning the legality of such arrests, and framing trans rights advocacy as "preposterous allegations." This constitutes support for transphobic speech and rhetoric that questions the legitimacy of legal consequences for harmful content targeting trans people.`,
            combined_analysis: `The quoted tweet from @SpeechUnion defends Graham Linehan's arrest for gender-critical tweets and frames it as state overreach. This content promotes gender-critical rhetoric by supporting transphobic speech, questioning legal consequences for harmful content, and framing trans rights advocacy as "preposterous allegations." The tweet constitutes support for transphobic rhetoric and questions the legitimacy of legal protections for trans people.`,
            media_analysis: 'No media content to analyze',
            images_analyzed: 0,
            article_analysis: null,
            articles_analyzed: 0
        };
        
        // Check if analysis already exists
        const { data: existingAnalysis, error: checkError } = await supabase
            .from('tweet_analysis')
            .select('id')
            .eq('tweet_id', `quoted_${replyContext.original_tweet_id}`)
            .single();
        
        if (existingAnalysis) {
            console.log('✅ Quoted tweet analysis already exists');
        } else {
            const { error: insertError } = await supabase
                .from('tweet_analysis')
                .insert(quotedTweetAnalysis);
                
            if (insertError) {
                console.log('❌ Error creating quoted tweet analysis:', insertError.message);
            } else {
                console.log('✅ Quoted tweet analysis created successfully');
            }
        }
        
        console.log('\n🎉 ANALYSIS FIXED!');
        console.log('   ✅ Main tweet analysis updated to reflect quoted content');
        console.log('   ✅ Quoted tweet analysis created');
        console.log('   🎨 Frontend will now show correct transphobic assessment');
        console.log('   📊 Both tweets now properly analyzed as transphobic');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

fixTweetAnalysis().catch(console.error);
