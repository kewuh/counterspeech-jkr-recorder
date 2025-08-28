# Complete Setup Guide

## 🚀 Quick Start

This guide will help you set up the Junkipedia to Supabase connector step by step.

## 📋 Prerequisites

- Node.js (v16 or higher)
- A Supabase account and project
- Junkipedia API access (currently using mock data due to API access issues)

## 🔧 Step 1: Install Dependencies

```bash
npm install
```

## 🔧 Step 2: Set Up Supabase

### 2.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Wait for the project to be ready

### 2.2 Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings → API**
2. Copy these values:
   - **Project URL** (looks like: `https://your-project.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 2.3 Create the Database Table

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `database-setup.sql`
3. Click **Run** to execute the SQL

## 🔧 Step 3: Configure Environment Variables

1. Create a `.env` file in the project root (if it doesn't exist)
2. Add your Supabase credentials:

```env
# Junkipedia API Configuration
JUNKIPEDIA_API_KEY=zT3mTjBMeAZZLSMu13DhH8bY
JUNKIPEDIA_BASE_URL=https://api.junkipedia.org
JUNKIPEDIA_CHANNEL_ID=10595539

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional: Database table name
SUPABASE_TABLE_NAME=jk_rowling_posts
```

## 🔧 Step 4: Test the Setup

### 4.1 Test Supabase Connection

```bash
node test-connection.js
```

This will test both the Junkipedia API (currently using mock data) and Supabase connection.

### 4.2 Test with Mock Data

Since the Junkipedia API endpoints are currently not accessible, we can test the full flow using mock data:

```bash
# Test the complete flow with mock data
node mock-connector.js

# Test specific features
node mock-connector.js recent 7
node mock-connector.js search "trans rights"
node mock-connector.js stats
```

## 🎯 Step 5: Run the Main Script

Once everything is set up, you can run the main script:

```bash
# Fetch all posts (will use mock data for now)
npm start

# Or run directly
node index.js
```

## 📊 Available Commands

### Main Script (`index.js` or `mock-connector.js`)

```bash
# Fetch all posts
node index.js

# Fetch recent posts (last N days)
node index.js recent 7
node index.js recent 30

# Fetch posts by date range
node index.js range 2024-01-01 2024-01-31

# Search posts by content
node index.js search "trans rights"
node index.js search "Harry Potter"

# Get database statistics
node index.js stats
```

### Mock Connector (for testing)

```bash
# Same commands but with mock data
node mock-connector.js
node mock-connector.js recent 7
node mock-connector.js search "trans rights"
node mock-connector.js stats
```

## 🔍 Troubleshooting

### Junkipedia API Issues

The Junkipedia API endpoints are currently not accessible. This could be due to:

1. **API Access**: The API might require special access
2. **Endpoint Changes**: The API endpoints might have changed
3. **Authentication**: Different authentication method required

**Solution**: Use the mock connector for now to test the Supabase integration.

### Supabase Connection Issues

If you get "Invalid URL" errors:

1. Check your `SUPABASE_URL` in the `.env` file
2. Make sure it starts with `https://` and ends with `.supabase.co`
3. Verify your project is active in the Supabase dashboard

### Database Table Issues

If you get table-related errors:

1. Make sure you ran the SQL from `database-setup.sql`
2. Check that the table name matches `SUPABASE_TABLE_NAME` in your `.env`
3. Verify your Supabase API key has the necessary permissions

## 📈 What's Next?

### Real Junkipedia API Integration

Once the Junkipedia API becomes accessible:

1. Update the API endpoints in `junkipedia-api.js`
2. Test with real data using `node test-api.js`
3. Switch from mock connector to main connector

### Additional Features

You can extend the script with:

- **Scheduling**: Set up cron jobs to run regularly
- **Web Interface**: Create a simple web dashboard
- **Analytics**: Add more detailed analytics and reporting
- **Notifications**: Set up alerts for new posts

## 🆘 Getting Help

If you encounter issues:

1. Check the console output for error messages
2. Verify your Supabase credentials are correct
3. Make sure the database table exists
4. Check the troubleshooting section above

For additional help, check the main `README.md` file or create an issue in the repository.

## ✅ Success Indicators

You'll know everything is working when you see:

```
✅ Supabase connection successful!
✅ Table access confirmed!
✅ Mock: Successfully generated X posts
✅ Process completed successfully!
📈 Summary: X new posts inserted, Y duplicates skipped
```

## 🎉 Congratulations!

You now have a working Junkipedia to Supabase connector! The script will fetch JK Rowling's posts (currently using mock data) and store them in your Supabase database for analysis and tracking.
