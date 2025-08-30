const { GoogleGenerativeAI } = require('@google/generative-ai');
const SupabaseClient = require('./supabase-client');
const config = require('./config');

async function updateSpecificTweet() {
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const supabase = new SupabaseClient();
    
    console.log('🔄 Updating Tweet 603062907 with Article Analysis\n');
    
    try {
        // Get the specific tweet
        const { data: tweets } = await supabase.supabase
            .from('jk_rowling_posts')
            .select('*')
            .eq('junkipedia_id', '603062907')
            .single();
            
        if (!tweets) {
            console.log('❌ Tweet not found');
            return;
        }
        
        console.log(`🔍 Tweet: ${tweets.content}\n`);
        
        // Get stored articles
        const storedArticles = await supabase.getArticleContent('603062907');
        
        if (!storedArticles || storedArticles.length === 0) {
            console.log('❌ No articles found');
            return;
        }
        
        // Filter articles with content
        const articlesWithContent = storedArticles.filter(article => 
            article.content && article.content.trim().length > 0 && article.word_count > 10
        );
        
        if (articlesWithContent.length === 0) {
            console.log('❌ No articles with meaningful content');
            return;
        }
        
        console.log(`✅ Found ${articlesWithContent.length} article(s) with content`);
        
        // Test with the NY Post article
        const article = articlesWithContent[0];
        console.log(`📄 Article: "${article.title}"`);
        console.log(`📏 Word count: ${article.word_count}\n`);
        
        // Analyze with articles
        const articleContent = articlesWithContent.map(article => 
            `Article: ${article.title}\nURL: ${article.url}\nContent: ${article.content.substring(0, 1000)}...`
        ).join('\n\n');
        
        const prompt = `
Tweet Content: "${tweets.content}"
Tweet URL: ${tweets.url}
Published: ${tweets.published_at}

Linked Articles (${articlesWithContent.length}):
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
  "articles_analyzed": ${articlesWithContent.length}
}
`;

        console.log('🤖 Running AI analysis with article content...\n');
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            
            console.log('📊 Analysis Results:');
            console.log(`   🚨 Potentially transphobic: ${analysis.is_potentially_transphobic}`);
            console.log(`   📊 Confidence: ${analysis.confidence_level}`);
            console.log(`   ⚠️  Severity: ${analysis.severity}`);
            console.log(`   📄 Articles analyzed: ${analysis.articles_analyzed}`);
            console.log(`   🔗 Combined analysis: ${analysis.combined_analysis ? 'Yes' : 'No'}\n`);
            
            // Update the analysis in database
            const analysisData = {
                tweet_id: '603062907',
                is_potentially_transphobic: analysis.is_potentially_transphobic,
                confidence_level: analysis.confidence_level,
                concerns: analysis.concerns,
                explanation: analysis.explanation,
                severity: analysis.severity,
                recommendations: analysis.recommendations,
                text_analysis: analysis.tweet_analysis || null,
                article_analysis: analysis.article_analysis || null,
                combined_analysis: analysis.combined_analysis || null,
                articles_analyzed: articlesWithContent.length,
                analyzed_at: new Date().toISOString(),
                raw_analysis: analysis
            };
            
            const { error } = await supabase.supabase
                .from('tweet_analysis')
                .upsert([analysisData], { 
                    onConflict: 'tweet_id',
                    ignoreDuplicates: false 
                });
            
            if (error) {
                console.error('❌ Error updating analysis:', error);
            } else {
                console.log('✅ Successfully updated analysis in database!');
                console.log('🔄 Refresh your browser to see the updated analysis');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

updateSpecificTweet().catch(console.error);
