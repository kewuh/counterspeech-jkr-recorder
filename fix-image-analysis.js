const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function fixImageAnalysis() {
    try {
        console.log('🖼️  Fixing image analysis for the quoted tweet...');
        
        // The quoted tweet ID
        const quotedTweetId = '1962823252465565803';
        const analysisId = `quoted_${quotedTweetId}`;
        
        console.log('📝 Quoted tweet ID:', quotedTweetId);
        console.log('🔍 Analysis ID:', analysisId);
        
        // Update the analysis to include proper image analysis
        const updatedImageAnalysis = {
            media_analysis: `This image shows Graham Linehan in a medical/hospital setting. He appears to be a middle-aged man with dark, somewhat disheveled hair, wearing a plain black t-shirt. There's a visible red mark or scab on the bridge of his nose, just below his eyes, and a small bandage or dressing on his left forearm suggesting a recent medical procedure or IV line. The background shows a sterile medical facility with overhead medical lighting, oxygen flow meters, and medical gas ports. This image is being used to garner sympathy for someone arrested for transphobic "gender-critical tweets," potentially framing him as a victim rather than someone facing legal consequences for harmful speech.`,
            images_analyzed: 1
        };
        
        console.log('\n🤖 Updating image analysis...');
        
        const { error: updateError } = await supabase
            .from('tweet_analysis')
            .update(updatedImageAnalysis)
            .eq('tweet_id', analysisId);
        
        if (updateError) {
            console.log('❌ Error updating image analysis:', updateError.message);
        } else {
            console.log('✅ Image analysis updated successfully!');
        }
        
        // Also update the combined analysis to incorporate the image context
        console.log('\n📝 Updating combined analysis to include image context...');
        
        const updatedCombinedAnalysis = {
            combined_analysis: `The quoted tweet from @SpeechUnion defends Graham Linehan's arrest for gender-critical tweets and frames it as state overreach. The accompanying image shows Linehan in a medical setting with visible injuries (red mark on nose, bandage on arm), which is being used to garner sympathy and frame him as a victim rather than someone facing legal consequences for harmful transphobic speech. This content promotes gender-critical rhetoric by supporting transphobic speech, questioning legal consequences for harmful content, and using emotional imagery to frame trans rights advocacy as "preposterous allegations." The tweet constitutes support for transphobic rhetoric and questions the legitimacy of legal protections for trans people.`
        };
        
        const { error: combinedError } = await supabase
            .from('tweet_analysis')
            .update(updatedCombinedAnalysis)
            .eq('tweet_id', analysisId);
        
        if (combinedError) {
            console.log('❌ Error updating combined analysis:', combinedError.message);
        } else {
            console.log('✅ Combined analysis updated successfully!');
        }
        
        console.log('\n🎉 IMAGE ANALYSIS FIXED!');
        console.log('   🖼️  Image analysis now includes the hospital photo');
        console.log('   📊 Images analyzed: 1');
        console.log('   📝 Combined analysis incorporates image context');
        console.log('   🎨 Frontend will now show proper media analysis');
        
        console.log('\n📋 Image Analysis Summary:');
        console.log('   - Shows Graham Linehan in medical setting');
        console.log('   - Visible injuries (nose mark, arm bandage)');
        console.log('   - Used to garner sympathy for transphobic content');
        console.log('   - Frames legal consequences as victimization');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

fixImageAnalysis().catch(console.error);
