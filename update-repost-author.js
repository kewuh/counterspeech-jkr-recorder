const SupabaseClient = require('./supabase-client');

async function updateRepostAuthor() {
    console.log('📝 Updating repost with proper author information...');
    
    const supabase = new SupabaseClient();
    
    try {
        // Update the repost with proper author information
        const updateData = {
            raw_data: {
                id: 'manual_nicola_sturgeon_repost',
                type: 'repost',
                attributes: {
                    id: 'manual_nicola_sturgeon_repost',
                    published_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
                    search_data_fields: {
                        sanitized_text: 'Column on the glorious spectacle of Nicola Sturgeon arranging her tax affairs to avoid taxes she raised on other, less fortunate, Scots. Tax avoidance is always wicked, it seems, until you can do it yourself. Bravo.'
                    },
                    engagement_data: {
                        likes: 0,
                        retweets: 0,
                        replies: 0,
                        quotes: 0
                    },
                    post_data: {
                        referenced_tweets: [
                            {
                                type: 'retweeted',
                                id: 'original_tweet_id_placeholder'
                            }
                        ]
                    }
                },
                original_tweet: {
                    id: 'original_tweet_id_placeholder',
                    text: 'Column on the glorious spectacle of Nicola Sturgeon arranging her tax affairs to avoid taxes she raised on other, less fortunate, Scots. Tax avoidance is always wicked, it seems, until you can do it yourself. Bravo.',
                    author_id: 'alexmassie_user_id',
                    author_username: 'alexmassie',
                    author_name: 'Alex Massie',
                    created_at: new Date(Date.now() - 19 * 60 * 60 * 1000).toISOString(), // 19 hours ago
                    public_metrics: {
                        like_count: 0,
                        retweet_count: 0,
                        reply_count: 0,
                        quote_count: 0
                    }
                }
            }
        };

        const { data: updatedPost, error: updateError } = await supabase.supabase
            .from('jk_rowling_posts')
            .update(updateData)
            .eq('junkipedia_id', 'x_manual_nicola_sturgeon_repost')
            .select()
            .single();

        if (updateError) {
            console.error('❌ Error updating repost:', updateError.message);
            return;
        }

        console.log('✅ Successfully updated repost:');
        console.log(`   🆔 Database ID: ${updatedPost.id}`);
        console.log(`   👤 Original Author: ${updatedPost.raw_data.original_tweet.author_username}`);
        console.log(`   📅 Original Time: ${updatedPost.raw_data.original_tweet.created_at}`);

    } catch (error) {
        console.error('❌ Error updating repost:', error.message);
    }
}

updateRepostAuthor().catch(console.error);
