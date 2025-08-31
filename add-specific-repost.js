const SupabaseClient = require('./supabase-client');

async function addSpecificRepost() {
    console.log('📝 Adding specific repost about Nicola Sturgeon...');
    
    const supabase = new SupabaseClient();
    
    // The repost you mentioned: J.K. Rowling reposted alexmassie about Nicola Sturgeon
    const repostData = {
        junkipedia_id: 'x_manual_nicola_sturgeon_repost',
        content: 'Column on the glorious spectacle of Nicola Sturgeon arranging her tax affairs to avoid taxes she raised on other, less fortunate, Scots. Tax avoidance is always wicked, it seems, until you can do it yourself. Bravo.',
        author: 'J.K. Rowling',
        platform: 'twitter',
        post_type: 'repost',
        created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
        published_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        url: 'https://twitter.com/jk_rowling/status/manual_nicola_sturgeon_repost',
        engagement_metrics: {
            likes: 0,
            retweets: 0,
            replies: 0,
            quotes: 0
        },
        tags: [],
        issues: [],
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

    try {
        // Check if this repost already exists
        const { data: existingPost, error: checkError } = await supabase.supabase
            .from('jk_rowling_posts')
            .select('id, junkipedia_id, published_at')
            .eq('junkipedia_id', repostData.junkipedia_id)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('❌ Error checking existing post:', checkError.message);
            return;
        }

        if (existingPost) {
            console.log('⚠️  Repost already exists in database:');
            console.log(`   🆔 Database ID: ${existingPost.id}`);
            console.log(`   📅 Published: ${existingPost.published_at}`);
            return;
        }

        // Insert the repost
        console.log('💾 Inserting repost into database...');
        const { data: insertedPost, error: insertError } = await supabase.supabase
            .from('jk_rowling_posts')
            .insert([repostData])
            .select()
            .single();

        if (insertError) {
            console.error('❌ Error inserting repost:', insertError.message);
            return;
        }

        console.log('✅ Successfully added repost to database:');
        console.log(`   🆔 Database ID: ${insertedPost.id}`);
        console.log(`   📅 Published: ${insertedPost.published_at}`);
        console.log(`   📝 Content: ${insertedPost.content.substring(0, 100)}...`);
        console.log(`   🏷️  Post Type: ${insertedPost.post_type}`);

    } catch (error) {
        console.error('❌ Error adding repost:', error.message);
    }
}

addSpecificRepost().catch(console.error);
