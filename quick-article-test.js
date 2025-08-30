const { GoogleGenerativeAI } = require('@google/generative-ai');
const SupabaseClient = require('./supabase-client');
const config = require('./config');

class QuickArticleTest {
    constructor() {
        this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        this.supabase = new SupabaseClient();
    }

    async testArticleIntegration() {
        console.log('🔍 Quick Test: Article Integration Fix\n');
        
        try {
            // Get just 3 recent tweets
            const { data: tweets, error } = await this.supabase.supabase
                .from('jk_rowling_posts')
                .select('*')
                .order('published_at', { ascending: false })
                .limit(3);
                
            if (error) throw error;
            
            console.log(`📊 Testing ${tweets.length} tweets\n`);
            
            for (const tweet of tweets) {
                console.log(`🔍 Tweet ${tweet.junkipedia_id}:`);
                console.log(`📝 Content: ${tweet.content.substring(0, 80)}...`);
                
                // Check for stored articles
                const storedArticles = await this.supabase.getArticleContent(tweet.junkipedia_id);
                
                if (!storedArticles || storedArticles.length === 0) {
                    console.log(`   📄 No articles found`);
                    continue;
                }
                
                // Filter articles with content
                const articlesWithContent = storedArticles.filter(article => 
                    article.content && article.content.trim().length > 0 && article.word_count > 10
                );
                
                if (articlesWithContent.length === 0) {
                    console.log(`   📄 Articles found but no meaningful content`);
                    continue;
                }
                
                console.log(`   📄 Found ${articlesWithContent.length} article(s) with content`);
                
                // Test AI analysis with the first article
                const article = articlesWithContent[0];
                console.log(`   📄 Analyzing: "${article.title}" (${article.word_count} words)`);
                
                const analysis = await this.analyzeWithArticle(tweet, article);
                
                if (analysis) {
                    console.log(`   🚨 Flagged: ${analysis.is_potentially_transphobic}`);
                    console.log(`   📊 Severity: ${analysis.severity}`);
                    console.log(`   📄 Articles analyzed: ${analysis.articles_analyzed}`);
                }
                
                console.log('');
            }
            
        } catch (error) {
            console.error('❌ Error:', error);
        }
    }

    async analyzeWithArticle(tweet, article) {
        try {
            const prompt = `
Tweet Content: "${tweet.content}"

Linked Article: "${article.title}"
Article Content: "${article.content.substring(0, 800)}..."

Please analyze this tweet AND the linked article for potentially transphobic content. Consider:
1. Language that denies trans people's identities
2. Misgendering or deadnaming
3. Harmful stereotypes about trans people
4. Content that could contribute to discrimination or violence
5. Rhetoric that questions trans rights or access to healthcare
6. Language that frames trans people as threats or dangerous

Provide your analysis in the following JSON format:
{
  "is_potentially_transphobic": true/false,
  "confidence_level": "high/medium/low",
  "concerns": ["list of specific concerns"],
  "explanation": "brief explanation",
  "severity": "high/medium/low",
  "recommendations": ["suggestions"],
  "tweet_analysis": "analysis of tweet content",
  "article_analysis": "analysis of article content",
  "combined_analysis": "combined analysis of both",
  "articles_analyzed": 1
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
}

// Run the quick test
async function main() {
    const test = new QuickArticleTest();
    await test.testArticleIntegration();
}

main().catch(console.error);
