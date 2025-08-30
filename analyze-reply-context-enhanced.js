const GeminiAnalyzer = require('./gemini-analyzer');
const SupabaseClient = require('./supabase-client');

class ReplyContextAnalyzer {
    constructor() {
        this.gemini = new GeminiAnalyzer();
        this.supabase = new SupabaseClient();
    }

    async analyzeReplyWithContext(replyContextId) {
        try {
            console.log(`🔍 Analyzing reply context: ${replyContextId}`);
            
            // Get the reply context from database
            const { data: contexts, error } = await this.supabase.supabase
                .from('reply_contexts')
                .select('*')
                .eq('reply_context_id', replyContextId);

            if (error) {
                console.error('❌ Error fetching reply context:', error.message);
                return;
            }

            if (!contexts || contexts.length === 0) {
                console.error('❌ Reply context not found');
                return;
            }

            const context = contexts[0];
            console.log('📝 Found reply context:');
            console.log(`   Reply: "${context.reply_tweet_text}"`);
            console.log(`   Original: "${context.original_tweet_text}"`);
            console.log(`   Original user: @${context.original_user_username}`);

            // Build enhanced prompt with full context
            const prompt = this.buildAnalysisPrompt(context);
            
            console.log('🤖 Running enhanced AI analysis...');
            const analysis = await this.gemini.analyzeContent(prompt);
            
            if (analysis) {
                console.log('✅ Analysis completed');
                await this.storeAnalysisResult(context, analysis);
                return analysis;
            } else {
                console.error('❌ Analysis failed');
                return null;
            }

        } catch (error) {
            console.error('❌ Error analyzing reply context:', error.message);
            return null;
        }
    }

    buildAnalysisPrompt(context) {
        return `Please analyze this Twitter conversation for transphobic content. Consider the full context of both tweets:

ORIGINAL TWEET by @${context.original_user_username}:
"${context.original_tweet_text}"

REPLY TWEET by JK Rowling:
"${context.reply_tweet_text}"

ANALYSIS TASK:
1. Consider the context of the original tweet - what was the person sharing?
2. Analyze JK Rowling's reply in the context of what she's responding to
3. Assess whether her reply contains transphobic content, dismissive language, or harmful rhetoric
4. Consider if her response is supportive, neutral, or problematic given the original tweet's content

Please provide a detailed analysis including:
- Context understanding
- Transphobia assessment (Yes/No/Unclear)
- Confidence level (High/Medium/Low)
- Detailed reasoning
- Any concerning patterns or language

Format your response as JSON with these fields:
{
  "context_understanding": "Brief summary of what the original tweet was about",
  "transphobia_detected": "Yes/No/Unclear",
  "confidence_level": "High/Medium/Low", 
  "detailed_reasoning": "Detailed analysis of the reply in context",
  "concerning_patterns": "Any problematic language or patterns",
  "overall_assessment": "Summary of the analysis",
  "original_tweet_text": "${context.original_tweet_text}",
  "original_user_username": "${context.original_user_username}"
}`;
    }

    async storeAnalysisResult(context, analysis) {
        try {
            const analysisData = {
                reply_context_id: context.reply_context_id,
                analysis_type: 'reply_context_enhanced',
                analysis_result: analysis,
                reply_tweet_id: context.reply_tweet_id,
                original_tweet_id: context.original_tweet_id
            };

            const { error } = await this.supabase.supabase
                .from('reply_analysis')
                .insert(analysisData);

            if (error) {
                console.error('❌ Error storing analysis:', error.message);
            } else {
                console.log('✅ Analysis stored in database');
            }

        } catch (error) {
            console.error('❌ Error storing analysis result:', error.message);
        }
    }

    async analyzeRecentReplies(limit = 5) {
        try {
            console.log(`🔍 Analyzing ${limit} recent reply contexts...`);
            
            const { data: contexts, error } = await this.supabase.supabase
                .from('reply_contexts')
                .select('*')
                .order('inserted_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('❌ Error fetching recent contexts:', error.message);
                return;
            }

            console.log(`📊 Found ${contexts.length} contexts to analyze`);

            for (const context of contexts) {
                console.log(`\n📝 Analyzing: ${context.reply_context_id}`);
                await this.analyzeReplyWithContext(context.reply_context_id);
                
                // Small delay between analyses
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

        } catch (error) {
            console.error('❌ Error analyzing recent replies:', error.message);
        }
    }

    async getAnalysisStats() {
        try {
            const { count: totalAnalyses } = await this.supabase.supabase
                .from('reply_analysis')
                .select('*', { count: 'exact', head: true });

            const { count: totalContexts } = await this.supabase.supabase
                .from('reply_contexts')
                .select('*', { count: 'exact', head: true });

            console.log('📊 Analysis Statistics:');
            console.log(`   Total reply contexts: ${totalContexts || 0}`);
            console.log(`   Total analyses: ${totalAnalyses || 0}`);
            console.log(`   Analysis coverage: ${totalContexts > 0 ? Math.round((totalAnalyses / totalContexts) * 100) : 0}%`);

        } catch (error) {
            console.error('❌ Error getting analysis stats:', error.message);
        }
    }

    async compareAnalysis(replyContextId) {
        try {
            console.log(`🔍 Comparing analysis for: ${replyContextId}`);
            
            // Get the reply context
            const { data: contexts } = await this.supabase.supabase
                .from('reply_contexts')
                .select('*')
                .eq('reply_context_id', replyContextId);

            if (!contexts || contexts.length === 0) {
                console.error('❌ Reply context not found');
                return;
            }

            const context = contexts[0];

            // Get old analysis (if any) from jk_rowling_posts
            const { data: oldAnalysis } = await this.supabase.supabase
                .from('jk_rowling_posts')
                .select('*')
                .eq('junkipedia_id', context.reply_tweet_id);

            // Get new enhanced analysis
            const { data: newAnalysis } = await this.supabase.supabase
                .from('reply_analysis')
                .select('*')
                .eq('reply_context_id', replyContextId)
                .order('analyzed_at', { ascending: false })
                .limit(1);

            console.log('\n📊 COMPARISON:');
            console.log('==============');
            console.log(`Reply: "${context.reply_tweet_text}"`);
            console.log(`Original: "${context.original_tweet_text}"`);
            
            if (oldAnalysis && oldAnalysis.length > 0) {
                console.log('\n🔴 OLD ANALYSIS (Reply only):');
                console.log(oldAnalysis[0].analysis_result || 'No analysis available');
            }
            
            if (newAnalysis && newAnalysis.length > 0) {
                console.log('\n🟢 NEW ANALYSIS (Full context):');
                console.log(JSON.stringify(newAnalysis[0].analysis_result, null, 2));
            }

        } catch (error) {
            console.error('❌ Error comparing analysis:', error.message);
        }
    }
}

// CLI interface
const command = process.argv[2];
const replyContextId = process.argv[3];

if (command === 'analyze' && replyContextId) {
    const analyzer = new ReplyContextAnalyzer();
    analyzer.analyzeReplyWithContext(replyContextId);
} else if (command === 'recent') {
    const limit = parseInt(process.argv[3]) || 5;
    const analyzer = new ReplyContextAnalyzer();
    analyzer.analyzeRecentReplies(limit);
} else if (command === 'stats') {
    const analyzer = new ReplyContextAnalyzer();
    analyzer.getAnalysisStats();
} else if (command === 'compare' && replyContextId) {
    const analyzer = new ReplyContextAnalyzer();
    analyzer.compareAnalysis(replyContextId);
} else {
    console.log('Usage: node analyze-reply-context-enhanced.js [analyze|recent|stats|compare] [reply_context_id]');
    console.log('  analyze <id> - Analyze specific reply context');
    console.log('  recent [n]  - Analyze recent reply contexts (default: 5)');
    console.log('  stats       - Show analysis statistics');
    console.log('  compare <id> - Compare old vs new analysis');
}
