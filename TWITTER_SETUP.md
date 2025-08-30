# Twitter API Setup Guide

This guide will help you set up the Twitter API integration to fetch reply tweets and their context.

## 🚀 Quick Start

### 1. Get Twitter API Access

1. **Create a Twitter Developer Account:**
   - Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
   - Sign up for a developer account
   - Apply for API access (Free tier is sufficient to start)

2. **Create a Project and App:**
   - Create a new project in the developer portal
   - Create a new app within the project
   - Note your **Bearer Token** (you'll need this)

### 2. Configure Your Environment

Add your Twitter Bearer Token to your `.env` file:

```bash
# Add this line to your .env file
TWITTER_BEARER_TOKEN=your_bearer_token_here
```

### 3. Set Up the Database

Run this SQL in your Supabase SQL editor:

```sql
-- Copy and paste the contents of create-reply-contexts-table.sql
```

### 4. Test the Setup

```bash
# Test the Twitter API connection
node test-twitter-api.js

# Fetch and store reply contexts
node fetch-twitter-replies.js fetch 10

# Check statistics
node fetch-twitter-replies.js stats
```

## 📊 API Access Levels

| Tier | Posts/Month | Reads/Month | Cost | Coverage |
|------|-------------|-------------|------|----------|
| Free | 500 | 100 | $0 | ~2.6 months of JK Rowling's posts |
| Basic | 10,000 | - | $200/month | ~4+ years of posts |
| Pro | 1,000,000 | - | $5,000/month | Extensive historical data |

## 🔧 Usage Examples

### Fetch Recent Reply Contexts

```bash
# Fetch 25 reply contexts
node fetch-twitter-replies.js fetch 25

# Fetch 100 reply contexts (uses more API quota)
node fetch-twitter-replies.js fetch 100
```

### Check Statistics

```bash
# View stored reply context statistics
node fetch-twitter-replies.js stats
```

### Programmatic Usage

```javascript
const TwitterReplyFetcher = require('./fetch-twitter-replies');

const fetcher = new TwitterReplyFetcher();

// Fetch and store reply contexts
await fetcher.fetchAndStoreReplies(50);

// Get statistics
await fetcher.getReplyStats();
```

## 📝 What You'll Get

For each reply tweet, you'll have access to:

### Reply Tweet Data:
- Tweet ID and text
- Creation date
- Engagement metrics (likes, retweets, replies)
- Conversation ID

### Original Tweet Data:
- Tweet ID and text (if accessible)
- Creation date
- Engagement metrics
- Author username and name

### Context Data:
- Conversation threading
- Complete raw API response
- Platform information

## 🎯 Example Output

```
🚀 Starting Twitter Reply Data Collection...

🔍 Testing connections...
✅ Twitter API connection successful!
👤 User: J.K. Rowling (@jk_rowling)
🆔 User ID: 62513246

📡 Fetching up to 25 reply contexts...
✅ Retrieved context for 15 reply tweets

📊 Processing 15 reply contexts...
   ✅ Stored reply context: @hyperstiti0n I'm so sorry for all you went through...
   ✅ Stored reply context: @1ConfusedThinkr Mopping my eyes on bank notes...
   ⏭️  Reply context twitter_reply_123456 already exists, skipping

✅ Processing complete!
   📥 Stored: 12 reply contexts
   ⏭️  Skipped: 3 (already exists or errors)
   📊 Total processed: 15
```

## 🔍 Troubleshooting

### Common Issues:

1. **"Twitter API connection failed"**
   - Check your Bearer Token is correct
   - Verify your API access level
   - Check rate limits in developer portal

2. **"No reply tweets found"**
   - JK Rowling might not have recent replies
   - Try increasing the maxResults parameter
   - Check if tweets are accessible with your API level

3. **"Original tweet not accessible"**
   - Some tweets may be private or deleted
   - Higher API tiers have better access
   - This is normal - we store what we can access

### Rate Limits:

- **Free tier:** 500 posts/month, 100 reads/month
- **Monitor usage** in the [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
- **Reset monthly** based on your account approval date

## 🎉 Next Steps

Once set up, you can:

1. **Analyze reply patterns** with complete context
2. **Build conversation threads** using conversation IDs
3. **Track engagement metrics** for both replies and original tweets
4. **Integrate with existing analysis** using the stored data

## 📚 API Documentation

- [Twitter API v2 Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [Rate Limits](https://developer.twitter.com/en/docs/twitter-api/rate-limits)
- [Tweet Fields](https://developer.twitter.com/en/docs/twitter-api/data-dictionary/object-model/tweet)
