const GeminiAnalyzer = require('./gemini-analyzer');
const SupabaseClient = require('./supabase-client');

class ReplyContextAnalyzer {
    constructor() {
        this.gemini = new GeminiAnalyzer();
        this.supabase = new SupabaseClient();
    }

    /**
     * Analyze a reply tweet with its original context
     */
    async analyzeReplyWithContext(replyContextId) {
        try {
            console.log(`🔍 Analyzing reply context: ${replyContextId}`);
            
            // Get the reply context from database
            const { data: context, error } = await this.supabase.supabase
                .from('reply_contexts')
                .select('*')
                .eq('reply_context_id', replyContextId)
                .single();
                
            if (error || !context) {
                console.error('❌ Reply context not found:', replyContextId);
                return null;
            }
            
            // Prepare the analysis prompt with full context
            const analysisPrompt = this.buildAnalysisPrompt(context);
            
            // Analyze with Gemini AI
            const analysis = await this.gemini.analyzeContent(analysisPrompt);
            
            // Store the analysis result
            await this.storeAnalysisResult(context, analysis);
            
            return {
                replyContext: context,
                analysis: analysis
            };
            
        } catch (error) {
            console.error('❌ Error analyzing reply context:', error.message);
            return null;
        }
    }

    /**
     * Build analysis prompt with full reply context
     */
    buildAnalysisPrompt(context) {
        const replyText = context.reply_tweet_text;
        const originalText = context.original_tweet_text;
        const originalUser = context.original_user_username;
        
        return `Please analyze this Twitter reply interaction for potential transphobic content:

ORIGINAL TWEET by @${originalUser}:
"${originalText}"

JK ROWLING'S REPLY:
"${replyText}"

CONTEXT:
- This is a reply tweet from JK Rowling to another user
- The original tweet provides important context for understanding her response
- Consider the full conversation, not just the reply in isolation

ANALYSIS REQUIREMENTS:
1. Is JK Rowling's reply potentially transphobic?
2. What is the overall tone and intent of her response?
3. How does the original tweet context affect the interpretation?
4. Are there any concerning patterns in how she responds to different types of content?
5. What is the severity level (low/medium/high) of any transphobic content?

Please provide a detailed analysis considering:
- The complete conversation context
- JK Rowling's response patterns
- Potential harm or impact
- Whether the response is defensive, supportive, or problematic

Format your response as JSON with the following structure:
{
  "is_potentially_transphobic": boolean,
  "confidence_level": "low/medium/high",
  "severity": "low/medium/high",
  "analysis": "detailed explanation",
  "context_importance": "how the original tweet affects interpretation",
  "response_pattern": "defensive/supportive/problematic/neutral",
  "potential_impact": "description of potential harm or positive impact"
}`;
    }

    /**
     * Store analysis result in database
     */
    async storeAnalysisResult(context, analysis) {
        try {
            const analysisData = {
                reply_context_id: context.reply_context_id,
                analysis_type: 'reply_context',
                analysis_result: analysis,
                analyzed_at: new Date().toISOString(),
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

    /**
     * Analyze all recent reply contexts
     */
    async analyzeRecentReplies(limit = 10) {
        try {
            console.log(`🔍 Analyzing ${limit} recent reply contexts...`);
            
            // Get recent reply contexts
            const { data: contexts, error } = await this.supabase.supabase
                .from('reply_contexts')
                .select('*')
                .order('inserted_at', { ascending: false })
                .limit(limit);
                
            if (error) {
                console.error('❌ Error fetching reply contexts:', error.message);
                return [];
            }
            
            console.log(`📊 Found ${contexts.length} reply contexts to analyze`);
            
            const results = [];
            
            for (const context of contexts) {
                try {
                    console.log(`\n📝 Analyzing: ${context.reply_tweet_text?.substring(0, 60)}...`);
                    
                    const result = await this.analyzeReplyWithContext(context.reply_context_id);
                    
                    if (result) {
                        results.push(result);
                        console.log(`   ✅ Analysis complete`);
                    }
                    
                    // Rate limiting for AI API
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                } catch (error) {
                    console.error(`   ❌ Error analyzing context ${context.reply_context_id}:`, error.message);
                }
            }
            
            console.log(`\n✅ Analysis complete! Processed ${results.length} reply contexts`);
            return results;
            
        } catch (error) {
            console.error('❌ Error in analyzeRecentReplies:', error.message);
            return [];
        }
    }

    /**
     * Get analysis statistics
     */
    async getAnalysisStats() {
        try {
            const { data: analyses, error } = await this.supabase.supabase
                .from('reply_analysis')
                .select('*');
                
            if (error) {
                console.error('❌ Error getting analysis stats:', error.message);
                return null;
            }
            
            const stats = {
                total_analyses: analyses.length,
                transphobic_count: analyses.filter(a => a.analysis_result?.is_potentially_transphobic).length,
                non_transphobic_count: analyses.filter(a => !a.analysis_result?.is_potentially_transphobic).length,
                severity_breakdown: {
                    low: analyses.filter(a => a.analysis_result?.severity === 'low').length,
                    medium: analyses.filter(a => a.analysis_result?.severity === 'medium').length,
                    high: analyses.filter(a => a.analysis_result?.severity === 'high').length
                },
                response_patterns: {
                    defensive: analyses.filter(a => a.analysis_result?.response_pattern === 'defensive').length,
                    supportive: analyses.filter(a => a.analysis_result?.response_pattern === 'supportive').length,
                    problematic: analyses.filter(a => a.analysis_result?.response_pattern === 'problematic').length,
                    neutral: analyses.filter(a => a.analysis_result?.response_pattern === 'neutral').length
                }
            };
            
            console.log('📊 Reply Analysis Statistics:');
            console.log(`   📝 Total analyses: ${stats.total_analyses}`);
            console.log(`   🚨 Potentially transphobic: ${stats.transphobic_count}`);
            console.log(`   ✅ Non-transphobic: ${stats.non_transphobic_count}`);
            console.log(`   📊 Severity breakdown: Low=${stats.severity_breakdown.low}, Medium=${stats.severity_breakdown.medium}, High=${stats.severity_breakdown.high}`);
            console.log(`   🎭 Response patterns: Defensive=${stats.response_patterns.defensive}, Supportive=${stats.response_patterns.supportive}, Problematic=${stats.response_patterns.problematic}, Neutral=${stats.response_patterns.neutral}`);
            
            return stats;
            
        } catch (error) {
            console.error('❌ Error getting analysis stats:', error.message);
            return null;
        }
    }
}

// CLI interface
async function main() {
    const analyzer = new ReplyContextAnalyzer();
    
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'analyze':
            const contextId = args[1];
            if (contextId) {
                await analyzer.analyzeReplyWithContext(contextId);
            } else {
                console.log('❌ Please provide a reply context ID');
            }
            break;
            
        case 'recent':
            const limit = parseInt(args[1]) || 10;
            await analyzer.analyzeRecentReplies(limit);
            break;
            
        case 'stats':
            await analyzer.getAnalysisStats();
            break;
            
        default:
            console.log('🔍 Reply Context Analyzer');
            console.log('\nUsage:');
            console.log('  node analyze-reply-context.js analyze <contextId>  - Analyze specific reply context');
            console.log('  node analyze-reply-context.js recent [limit]       - Analyze recent reply contexts');
            console.log('  node analyze-reply-context.js stats                - Show analysis statistics');
            console.log('\nExamples:');
            console.log('  node analyze-reply-context.js analyze junkipedia_123456  - Analyze specific context');
            console.log('  node analyze-reply-context.js recent 5                   - Analyze 5 recent contexts');
            console.log('  node analyze-reply-context.js stats                      - Show statistics');
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = ReplyContextAnalyzer;
