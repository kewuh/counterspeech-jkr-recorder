const SupabaseClient = require('./supabase-client');
const GeminiAnalyzer = require('./gemini-analyzer');
const axios = require('axios');

async function extractRepostArticle() {
    console.log('📄 Extracting and analyzing linked article from repost...');
    
    const supabase = new SupabaseClient();
    const analyzer = new GeminiAnalyzer();
    
    try {
        // Get the repost
        const { data: repost, error } = await supabase.supabase
            .from('jk_rowling_posts')
            .select('*')
            .eq('junkipedia_id', 'x_manual_nicola_sturgeon_repost')
            .single();

        if (error) {
            console.error('❌ Error fetching repost:', error.message);
            return;
        }

        console.log('📝 Repost content:');
        console.log(`   ${repost.content}`);

        // Look for URLs in the content
        const urlRegex = /https?:\/\/[^\s]+/g;
        const urls = repost.content.match(urlRegex);
        
        if (!urls || urls.length === 0) {
            console.log('❌ No URLs found in repost content');
            
            // Check if there's a URL in the original tweet
            if (repost.raw_data?.original_tweet?.text) {
                console.log('🔍 Checking original tweet for URLs...');
                const originalUrls = repost.raw_data.original_tweet.text.match(urlRegex);
                if (originalUrls && originalUrls.length > 0) {
                    console.log(`✅ Found URLs in original tweet: ${originalUrls.join(', ')}`);
                    await analyzeArticle(originalUrls[0], repost.junkipedia_id, analyzer, supabase);
                }
            }
            return;
        }

        console.log(`✅ Found URLs: ${urls.join(', ')}`);
        
        // Analyze the first URL found
        const articleUrl = urls[0];
        await analyzeArticle(articleUrl, repost.junkipedia_id, analyzer, supabase);

    } catch (error) {
        console.error('❌ Error extracting article:', error.message);
    }
}

async function analyzeArticle(url, tweetId, analyzer, supabase) {
    try {
        console.log(`\n📄 Fetching article from: ${url}`);
        
        // Fetch the article content
        const response = await axios.get(url, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const html = response.data;
        
        // Extract text content (basic extraction)
        const textContent = extractTextFromHTML(html);
        
        if (!textContent || textContent.length < 100) {
            console.log('❌ Could not extract meaningful content from article');
            return;
        }

        console.log(`✅ Extracted ${textContent.length} characters of content`);
        console.log(`📝 Preview: ${textContent.substring(0, 200)}...`);

        // Store article content in database
        const articleData = {
            tweet_id: tweetId,
            url: url,
            title: extractTitleFromHTML(html) || 'Unknown Title',
            content: textContent,
            word_count: textContent.split(/\s+/).length,
            extracted_at: new Date().toISOString()
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
        console.log('\n🤖 Analyzing article content...');
        const analysis = await analyzer.analyzeContent(`
Please analyze this article content for potentially transphobic content:

${textContent.substring(0, 3000)}

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
            }
        }

    } catch (error) {
        console.error('❌ Error analyzing article:', error.message);
    }
}

function extractTextFromHTML(html) {
    // Remove script and style elements
    html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Remove HTML tags
    html = html.replace(/<[^>]*>/g, ' ');
    
    // Decode HTML entities
    html = html.replace(/&nbsp;/g, ' ');
    html = html.replace(/&amp;/g, '&');
    html = html.replace(/&lt;/g, '<');
    html = html.replace(/&gt;/g, '>');
    html = html.replace(/&quot;/g, '"');
    html = html.replace(/&#39;/g, "'");
    
    // Clean up whitespace
    html = html.replace(/\s+/g, ' ').trim();
    
    return html;
}

function extractTitleFromHTML(html) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
        return titleMatch[1].trim();
    }
    
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
        return h1Match[1].trim();
    }
    
    return null;
}

extractRepostArticle().catch(console.error);
