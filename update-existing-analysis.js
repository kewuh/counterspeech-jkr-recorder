const { GoogleGenerativeAI } = require('@google/generative-ai');
const SupabaseClient = require('./supabase-client');
const config = require('./config');

class UpdateExistingAnalysis {
    constructor() {
        this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        this.supabase = new SupabaseClient();
    }

    async updateAnalysis() {
        console.log('🔄 Updating Existing Analysis with Article Integration\n');
        
        try {
            // Get tweets that have analysis but need article integration
            const { data: analyses, error } = await this.supabase.supabase
                .from('tweet_analysis')
                .select('*')
                .or('combined_analysis.eq.Not analyzed,combined_analysis.eq.Tweet only analysis,combined_analysis.is.null')
                .limit(3); // Just update 3 tweets
                
            if (error) throw error;
            
            if (!analyses || analyses.length === 0) {
                console.log('✅ All analysis already includes articles');
                return;
            }
            
            console.log(`📊 Found ${analyses.length} analyses to update\n`);
            
            for (const analysis of analyses) {
                console.log(`🔍 Updating analysis for tweet ${analysis.tweet_id}...`);
                
                // Get the tweet
                const { data: tweets } = await this.supabase.supabase
                    .from('jk_rowling_posts')
                    .select('*')
                    .eq('junkipedia_id', analysis.tweet_id)
                    .single();
                    
                if (!tweets) {
                    console.log(`   ❌ Tweet not found`);
                    continue;
                }
                
                // Get stored articles
                const storedArticles = await this.supabase.getArticleContent(analysis.tweet_id);
                
                if (!storedArticles || storedArticles.length === 0) {
                    console.log(`   📄 No articles found for this tweet`);
                    continue;
                }
                
                // Filter articles with content
                const articlesWithContent = storedArticles.filter(article => 
                    article.content && article.content.trim().length > 0 && article.word_count > 10
                );
                
                if (articlesWithContent.length === 0) {
                    console.log(`   📄 No articles with meaningful content`);
                    continue;
                }
                
                console.log(`   📄 Found ${articlesWithContent.length} article(s) with content`);
                
                // Re-analyze with articles
                const newAnalysis = await this.analyzeWithArticles(tweets, articlesWithContent);
                
                if (newAnalysis) {
                    // Update the analysis in database
                    await this.updateAnalysisInDB(analysis.tweet_id, newAnalysis, articlesWithContent.length);
                    console.log(`   ✅ Updated with article analysis`);
                    console.log(`   🚨 Flagged: ${newAnalysis.is_potentially_transphobic}`);
                    console.log(`   📊 Severity: ${newAnalysis.severity}`);
                    console.log(`   📄 Articles analyzed: ${newAnalysis.articles_analyzed}`);
                }
                
                console.log('');
                
                // Add delay to respect API limits
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
        } catch (error) {
            console.error('❌ Error:', error);
        }
    }

    async analyzeWithArticles(tweet, articles) {
        try {
            const articleContent = articles.map(article => 
                `Article: ${article.title}\nURL: ${article.url}\nContent: ${article.content.substring(0, 1000)}...`
            ).join('\n\n');
            
            const prompt = `
Tweet Content: "${tweet.content}"
Tweet URL: ${tweet.url}
Published: ${tweet.published_at}

Linked Articles (${articles.length}):
${articleContent}

Please analyze this tweet AND the linked articles for potentially transphobic content. Consider:
1. Language that denies trans people's identities
2. Misgendering or deadnaming
3. Harmful stereotypes about trans people
4. Content that could contribute to discrimination or violence
5. Rhetoric that questions trans rights or access to healthcare
6. Language that frames trans people as threats or dangerous
7. How the tweet content relates to the linked articles
8. Whether the articles amplify or contradict the tweet's message
9. The overall narrative being promoted

Provide your analysis in the following JSON format:
{
  "is_potentially_transphobic": true/false,
  "confidence_level": "high/medium/low",
  "concerns": ["list of specific concerns"],
  "explanation": "detailed explanation of why this content is concerning or not",
  "severity": "high/medium/low",
  "recommendations": ["suggestions for addressing concerns"],
  "tweet_analysis": "analysis of the tweet content specifically",
  "article_analysis": "analysis of the linked articles specifically",
  "combined_analysis": "how tweet and articles work together",
  "articles_analyzed": ${articles.length}
}
`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
        } catch (error) {
            console.error(`   ❌ Analysis error:`, error.message);
        }
        
        return null;
    }

    async updateAnalysisInDB(tweetId, analysis, articleCount) {
        try {
            const analysisData = {
                tweet_id: tweetId,
                is_potentially_transphobic: analysis.is_potentially_transphobic,
                confidence_level: analysis.confidence_level,
                concerns: analysis.concerns,
                explanation: analysis.explanation,
                severity: analysis.severity,
                recommendations: analysis.recommendations,
                tweet_analysis: analysis.tweet_analysis || null,
                article_analysis: analysis.article_analysis || null,
                combined_analysis: analysis.combined_analysis || null,
                articles_analyzed: articleCount,
                analyzed_at: new Date().toISOString(),
                raw_analysis: analysis
            };
            
            const { error } = await this.supabase.supabase
                .from('tweet_analysis')
                .upsert([analysisData], { 
                    onConflict: 'tweet_id',
                    ignoreDuplicates: false 
                });
            
            if (error) {
                console.error('   ❌ Error updating analysis:', error);
            }
            
        } catch (error) {
            console.error('   ❌ Error updating analysis:', error);
        }
    }
}

// Run the update
async function main() {
    const updater = new UpdateExistingAnalysis();
    await updater.updateAnalysis();
}

main().catch(console.error);
