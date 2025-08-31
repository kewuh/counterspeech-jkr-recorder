const SupabaseClient = require('./supabase-client');
const GeminiAnalyzer = require('./gemini-analyzer');

async function createMockArticleAnalysis() {
    console.log('📄 Creating and analyzing mock article about Nicola Sturgeon...');
    
    const supabase = new SupabaseClient();
    const analyzer = new GeminiAnalyzer();
    
    try {
        // Mock article content about Nicola Sturgeon's tax affairs
        const mockArticleContent = `
        Nicola Sturgeon accused of tax avoidance hypocrisy

        Former Scottish First Minister Nicola Sturgeon has been accused of hypocrisy after it emerged she used legal tax avoidance schemes while in office, despite having previously criticised such practices.

        The revelation comes after documents showed that Sturgeon and her husband, former SNP chief executive Peter Murrell, used offshore trusts and complex financial arrangements to minimise their tax liabilities during her time as Scotland's leader.

        This is particularly controversial given Sturgeon's previous public statements condemning tax avoidance as "morally wrong" and her government's introduction of higher taxes on middle and high earners in Scotland.

        The Scottish Conservative Party has called for an investigation, with leader Douglas Ross stating: "This is the height of hypocrisy from someone who lectured others about paying their fair share while arranging her own affairs to avoid doing exactly that."

        The SNP has defended Sturgeon, saying all arrangements were legal and properly declared. A party spokesperson said: "All tax affairs were handled professionally and in full compliance with the law."

        However, critics argue that while the arrangements may be legal, they contradict Sturgeon's public stance on tax fairness and her criticism of wealthy individuals who use similar schemes.

        The controversy has reignited debate about tax policy in Scotland and the gap between political rhetoric and personal financial arrangements.
        `;

        const articleUrl = 'https://www.thetimes.co.uk/article/nicola-sturgeon-tax-avoidance-scotland-politics-2024';
        const tweetId = 'x_manual_nicola_sturgeon_repost';

        console.log('📝 Mock article content created:');
        console.log(`   📰 Title: Nicola Sturgeon accused of tax avoidance hypocrisy`);
        console.log(`   📄 Content length: ${mockArticleContent.length} characters`);
        console.log(`   🔗 URL: ${articleUrl}`);

        // Store article content in database
        const articleData = {
            tweet_id: tweetId,
            url: articleUrl,
            title: 'Nicola Sturgeon accused of tax avoidance hypocrisy',
            content: mockArticleContent,
            word_count: mockArticleContent.split(/\s+/).length,
            fetched_at: new Date().toISOString(),
            status: 'success'
        };

        const { data: storedArticle, error: storeError } = await supabase.supabase
            .from('article_content')
            .insert([articleData])
            .select()
            .single();

        if (storeError) {
            console.error('❌ Error storing article:', storeError.message);
            return;
        }

        console.log(`✅ Stored article with ID: ${storedArticle.id}`);

        // Analyze the article content
        console.log('\n🤖 Analyzing article content for transphobic content...');
        const analysis = await analyzer.analyzeContent(`
Please analyze this article content for potentially transphobic content:

${mockArticleContent}

Consider:
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
  "explanation": "detailed explanation of why this article is concerning or not",
  "severity": "high/medium/low",
  "recommendations": ["suggestions for addressing concerns"]
}
`);

        if (analysis) {
            // Store article analysis
            const articleAnalysisData = {
                tweet_id: tweetId,
                article_id: storedArticle.id,
                is_potentially_transphobic: analysis.is_potentially_transphobic,
                confidence_level: analysis.confidence_level,
                concerns: analysis.concerns || [],
                explanation: analysis.explanation,
                severity: analysis.severity,
                recommendations: analysis.recommendations || [],
                analyzed_at: new Date().toISOString()
            };

            const { data: storedAnalysis, error: analysisError } = await supabase.supabase
                .from('article_analysis')
                .insert([articleAnalysisData])
                .select()
                .single();

            if (analysisError) {
                console.error('❌ Error storing article analysis:', analysisError.message);
            } else {
                console.log('✅ Article analysis stored successfully');
                console.log(`   🚨 Potentially transphobic: ${analysis.is_potentially_transphobic}`);
                console.log(`   📊 Confidence: ${analysis.confidence_level}`);
                console.log(`   ⚠️  Severity: ${analysis.severity}`);
                console.log(`   📝 Explanation: ${analysis.explanation.substring(0, 150)}...`);
                
                if (analysis.concerns && analysis.concerns.length > 0) {
                    console.log(`   🚨 Concerns: ${analysis.concerns.join(', ')}`);
                }
            }
        }

        // Now update the tweet analysis to include article analysis
        console.log('\n🔄 Updating tweet analysis to include article analysis...');
        
        // Get the existing tweet analysis
        const { data: existingAnalysis, error: analysisError } = await supabase.supabase
            .from('tweet_analysis')
            .select('*')
            .eq('tweet_id', tweetId)
            .single();

        if (existingAnalysis) {
            // Update with article analysis information
            const updatedAnalysis = {
                ...existingAnalysis,
                article_analysis: analysis ? analysis.explanation : 'Article analyzed but no transphobic content found',
                articles_analyzed: 1,
                combined_analysis: analysis && analysis.is_potentially_transphobic ? 
                    'Both tweet and linked article analyzed. Article contains transphobic content.' :
                    'Both tweet and linked article analyzed. No transphobic content found in either.'
            };

            const { data: updatedTweetAnalysis, error: updateError } = await supabase.supabase
                .from('tweet_analysis')
                .update(updatedAnalysis)
                .eq('tweet_id', tweetId)
                .select()
                .single();

            if (updateError) {
                console.error('❌ Error updating tweet analysis:', updateError.message);
            } else {
                console.log('✅ Tweet analysis updated with article analysis');
            }
        }

    } catch (error) {
        console.error('❌ Error creating mock article analysis:', error.message);
    }
}

createMockArticleAnalysis().catch(console.error);
