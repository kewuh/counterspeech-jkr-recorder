require('dotenv').config();

const config = {
  junkipedia: {
    apiKey: process.env.JUNKIPEDIA_API_KEY || 'hCzEWpaVgifMgURArfJNVurG',
    baseUrl: process.env.JUNKIPEDIA_BASE_URL || 'https://www.junkipedia.org/api/v1',
    channelId: process.env.JUNKIPEDIA_CHANNEL_ID || '10595539',
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    tableName: process.env.SUPABASE_TABLE_NAME || 'jk_rowling_posts',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },
  twitter: {
    bearerToken: process.env.TWITTER_BEARER_TOKEN,
  },
};

// Validate required configuration
if (!config.supabase.url || !config.supabase.anonKey) {
  console.error('❌ Missing required Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.');
  process.exit(1);
}

module.exports = config;
