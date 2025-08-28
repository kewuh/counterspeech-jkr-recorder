# Junkipedia to Supabase Connector

A Node.js script that queries Junkipedia for JK Rowling's tweets and stores them in a Supabase database.

## Features

- 🔍 Query Junkipedia API for posts from JK Rowling's channel (ID: 10595539)
- 💾 Store posts in Supabase with comprehensive metadata
- 📅 Filter posts by date range
- 🔎 Search posts by content
- 📊 Get database statistics
- 🚫 Handle duplicate posts gracefully
- 📝 Comprehensive logging and error handling

## Prerequisites

- Node.js (v16 or higher)
- A Supabase project with database access
- Junkipedia API access

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `env.example`:
   ```bash
   cp env.example .env
   ```

4. Configure your environment variables in `.env`:
   ```env
   # Junkipedia API Configuration
   JUNKIPEDIA_API_KEY=zT3mTjBMeAZZLSMu13DhH8bY
   JUNKIPEDIA_BASE_URL=https://api.junkipedia.org
   JUNKIPEDIA_CHANNEL_ID=10595539

   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Optional: Database table name
   SUPABASE_TABLE_NAME=jk_rowling_posts
   ```

## Database Setup

Before running the script, you need to create the database table in Supabase. Run this SQL in your Supabase SQL editor:

```sql
CREATE TABLE jk_rowling_posts (
  id SERIAL PRIMARY KEY,
  junkipedia_id VARCHAR UNIQUE NOT NULL,
  content TEXT,
  author VARCHAR,
  platform VARCHAR,
  post_type VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  url VARCHAR,
  engagement_metrics JSONB,
  tags TEXT[],
  issues JSONB,
  raw_data JSONB,
  inserted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Usage

### Basic Usage

Fetch all available posts from JK Rowling's channel:
```bash
npm start
# or
node index.js
```

### Command Line Options

#### Fetch Recent Posts
Get posts from the last N days:
```bash
node index.js recent 7    # Last 7 days
node index.js recent 30   # Last 30 days
```

#### Fetch Posts by Date Range
```bash
node index.js range 2024-01-01 2024-01-31
```

#### Search Posts
Search for posts containing specific text:
```bash
node index.js search "trans rights"
node index.js search "Harry Potter"
```

#### Get Database Statistics
```bash
node index.js stats
```

### Programmatic Usage

You can also use the connector programmatically:

```javascript
const JunkipediaSupabaseConnector = require('./index');

const connector = new JunkipediaSupabaseConnector();

// Fetch all posts
await connector.run();

// Fetch recent posts
await connector.fetchRecentPosts(7);

// Fetch by date range
await connector.fetchPostsByDateRange('2024-01-01', '2024-01-31');

// Search posts
await connector.searchAndStorePosts('trans rights');

// Get statistics
await connector.getStats();
```

## API Endpoints Used

Based on the [Junkipedia API documentation](https://docs.junkipedia.org/reference-material/api), this script uses:

- `GET /posts` - Fetch posts from a specific channel
- `GET /posts/search` - Search posts by content
- `GET /channels/{id}` - Get channel information

## Data Structure

Each post stored in Supabase contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | SERIAL | Primary key |
| `junkipedia_id` | VARCHAR | Unique Junkipedia post ID |
| `content` | TEXT | Post content/text |
| `author` | VARCHAR | Author name |
| `platform` | VARCHAR | Platform (e.g., 'twitter') |
| `post_type` | VARCHAR | Type of post |
| `created_at` | TIMESTAMP | When post was created |
| `published_at` | TIMESTAMP | When post was published |
| `url` | VARCHAR | Post URL |
| `engagement_metrics` | JSONB | Likes, retweets, replies, etc. |
| `tags` | TEXT[] | Associated tags |
| `issues` | JSONB | Related issues |
| `raw_data` | JSONB | Complete original data |
| `inserted_at` | TIMESTAMP | When record was inserted |

## Error Handling

The script includes comprehensive error handling:

- **API Errors**: Logs detailed error information from Junkipedia API
- **Database Errors**: Handles connection issues and constraint violations
- **Duplicate Posts**: Skips posts that already exist in the database
- **Missing Configuration**: Validates required environment variables

## Logging

The script provides detailed logging with emojis for easy reading:

- 🚀 Process start
- 🔍 API queries
- 📊 Data statistics
- ✅ Success messages
- ❌ Error messages
- ⚠️ Warnings

## Rate Limiting

The script processes posts sequentially to avoid overwhelming the APIs. Consider implementing additional rate limiting if needed for your use case.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues related to:
- **Junkipedia API**: Check the [official documentation](https://docs.junkipedia.org/reference-material/api)
- **Supabase**: Check the [Supabase documentation](https://supabase.com/docs)
- **This script**: Open an issue in this repository

## Author

Created by [kewuh](https://github.com/kewuh)
