const SupabaseClient = require('./supabase-client');

class GeminiSummary {
    constructor() {
        this.supabase = new SupabaseClient();
    }

    async displaySummary() {
        try {
            console.log('📊 Gemini Analysis Summary\n');
            
            // Get all analysis results
            const analyses = await this.supabase.getAllTweetAnalyses();
            
            if (analyses.length === 0) {
                console.log('❌ No analysis results found. Please run the analysis first.');
                return;
            }
            
            // Calculate statistics
            const totalAnalyzed = analyses.length;
            const flaggedTweets = analyses.filter(a => a.is_potentially_transphobic);
            const highSeverity = flaggedTweets.filter(a => a.severity === 'high');
            const mediumSeverity = flaggedTweets.filter(a => a.severity === 'medium');
            const lowSeverity = flaggedTweets.filter(a => a.severity === 'low');
            
            const highConfidence = flaggedTweets.filter(a => a.confidence_level === 'high');
            const mediumConfidence = flaggedTweets.filter(a => a.confidence_level === 'medium');
            const lowConfidence = flaggedTweets.filter(a => a.confidence_level === 'low');
            
            // Display summary
            console.log(`📈 Analysis Statistics:`);
            console.log(`   📝 Total tweets analyzed: ${totalAnalyzed}`);
            console.log(`   🚨 Flagged tweets: ${flaggedTweets.length}`);
            console.log(`   📊 Flag rate: ${((flaggedTweets.length / totalAnalyzed) * 100).toFixed(1)}%`);
            console.log('');
            
            console.log(`⚠️  Severity Breakdown:`);
            console.log(`   🔴 High severity: ${highSeverity.length}`);
            console.log(`   🟡 Medium severity: ${mediumSeverity.length}`);
            console.log(`   🟢 Low severity: ${lowSeverity.length}`);
            console.log('');
            
            console.log(`📊 Confidence Levels:`);
            console.log(`   🔴 High confidence: ${highConfidence.length}`);
            console.log(`   🟡 Medium confidence: ${mediumConfidence.length}`);
            console.log(`   🟢 Low confidence: ${lowConfidence.length}`);
            console.log('');
            
            // Display flagged tweets
            if (flaggedTweets.length > 0) {
                console.log(`🚨 Flagged Tweets (${flaggedTweets.length}):`);
                console.log('─'.repeat(80));
                
                flaggedTweets.forEach((analysis, index) => {
                    console.log(`\n${index + 1}. Tweet ID: ${analysis.tweet_id}`);
                    console.log(`   ⚠️  Severity: ${analysis.severity.toUpperCase()}`);
                    console.log(`   📊 Confidence: ${analysis.confidence_level.toUpperCase()}`);
                    
                    if (analysis.concerns && analysis.concerns.length > 0) {
                        console.log(`   💬 Concerns: ${analysis.concerns.join(', ')}`);
                    }
                    
                    if (analysis.explanation) {
                        console.log(`   📝 Explanation: ${analysis.explanation.substring(0, 150)}...`);
                    }
                    
                    console.log(`   📅 Analyzed: ${new Date(analysis.analyzed_at).toLocaleString()}`);
                });
            }
            
            // Display most common concerns
            const allConcerns = flaggedTweets
                .flatMap(a => a.concerns || [])
                .filter(c => c && c.trim() !== '');
            
            if (allConcerns.length > 0) {
                const concernCounts = {};
                allConcerns.forEach(concern => {
                    concernCounts[concern] = (concernCounts[concern] || 0) + 1;
                });
                
                const sortedConcerns = Object.entries(concernCounts)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5);
                
                console.log(`\n🔍 Most Common Concerns:`);
                sortedConcerns.forEach(([concern, count]) => {
                    console.log(`   • ${concern}: ${count} occurrences`);
                });
            }
            
            // Display recommendations
            const allRecommendations = flaggedTweets
                .flatMap(a => a.recommendations || [])
                .filter(r => r && r.trim() !== '');
            
            if (allRecommendations.length > 0) {
                console.log(`\n💡 Key Recommendations:`);
                const uniqueRecommendations = [...new Set(allRecommendations)];
                uniqueRecommendations.slice(0, 5).forEach(rec => {
                    console.log(`   • ${rec}`);
                });
            }
            
        } catch (error) {
            console.error('❌ Error displaying summary:', error);
        }
    }

    async exportToCSV() {
        try {
            const analyses = await this.supabase.getAllTweetAnalyses();
            
            if (analyses.length === 0) {
                console.log('❌ No analysis results to export.');
                return;
            }
            
            const csvHeader = 'Tweet ID,Is Transphobic,Severity,Confidence,Concerns,Explanation,Analyzed At\n';
            const csvRows = analyses.map(analysis => {
                const concerns = (analysis.concerns || []).join('; ');
                const explanation = (analysis.explanation || '').replace(/"/g, '""');
                return `"${analysis.tweet_id}","${analysis.is_potentially_transphobic}","${analysis.severity}","${analysis.confidence_level}","${concerns}","${explanation}","${analysis.analyzed_at}"`;
            }).join('\n');
            
            const csvContent = csvHeader + csvRows;
            
            // Write to file
            const fs = require('fs');
            const filename = `gemini-analysis-${new Date().toISOString().split('T')[0]}.csv`;
            fs.writeFileSync(filename, csvContent);
            
            console.log(`✅ Analysis exported to ${filename}`);
            console.log(`📊 ${analyses.length} records exported`);
            
        } catch (error) {
            console.error('❌ Error exporting to CSV:', error);
        }
    }
}

// Run the summary
async function main() {
    const summary = new GeminiSummary();
    
    // Display summary
    await summary.displaySummary();
    
    // Export to CSV
    console.log('\n📤 Exporting to CSV...');
    await summary.exportToCSV();
}

main().catch(console.error);
