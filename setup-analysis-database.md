# Setting Up Tweet Analysis Database

## 🗄️ Step 1: Create the Analysis Table in Supabase

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `fnkjqwfuvsbwmjjfhxmw`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Analysis Table SQL**
   Copy and paste this SQL:

```sql
-- Create the tweet_analysis table
CREATE TABLE IF NOT EXISTS tweet_analysis (
  id SERIAL PRIMARY KEY,
  tweet_id TEXT UNIQUE NOT NULL,
  is_potentially_transphobic BOOLEAN NOT NULL,
  confidence_level TEXT NOT NULL,
  concerns TEXT[],
  explanation TEXT,
  severity TEXT NOT NULL,
  recommendations TEXT[],
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raw_analysis JSONB
);

-- Add RLS policies
ALTER TABLE tweet_analysis ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now
CREATE POLICY "Allow all operations on tweet_analysis" ON tweet_analysis
  FOR ALL USING (true);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_tweet_analysis_tweet_id ON tweet_analysis(tweet_id);
CREATE INDEX IF NOT EXISTS idx_tweet_analysis_transphobic ON tweet_analysis(is_potentially_transphobic);
CREATE INDEX IF NOT EXISTS idx_tweet_analysis_severity ON tweet_analysis(severity);
```

4. **Click "Run" to execute the SQL**

## ✅ Step 2: Verify the Table was Created

1. **Check Table List**
   - Go to "Table Editor" in the left sidebar
   - You should see `tweet_analysis` in the list

2. **Check Table Structure**
   - Click on `tweet_analysis` table
   - Verify it has these columns:
     - `id` (SERIAL PRIMARY KEY)
     - `tweet_id` (TEXT)
     - `is_potentially_transphobic` (BOOLEAN)
     - `confidence_level` (TEXT)
     - `concerns` (TEXT[])
     - `explanation` (TEXT)
     - `severity` (TEXT)
     - `recommendations` (TEXT[])
     - `analyzed_at` (TIMESTAMP)
     - `raw_analysis` (JSONB)

## 🚀 Step 3: Run the Analysis Again

Once the table is created, run this command to analyze the remaining tweets:

```bash
GEMINI_API_KEY=AIzaSyBI_t5x-cKDEy78Qn-cQJXtGDQ4XENStls node gemini-analyzer.js
```

## 📊 Step 4: View Results

After the analysis completes, you can:

1. **Check the Database**
   - Go to "Table Editor" → `tweet_analysis`
   - View all the analysis results

2. **Run Summary Script**
   ```bash
   node gemini-summary.js
   ```

3. **View in Web Interface**
   - The analysis results will be integrated into your web viewer

## 🔧 Troubleshooting

### If you get "table already exists" error:
- The table was already created, you can skip Step 1

### If you get permission errors:
- Make sure you're using the correct Supabase project
- Check that your API keys are correct

### If the analysis fails:
- Check that your Gemini API key is valid
- Wait a few minutes if you hit rate limits
- The script will continue from where it left off

## 📈 Expected Results

After running the analysis, you should see:
- **46 tweets analyzed** (all tweets in your database)
- **~17-25 flagged tweets** (depending on the remaining analysis)
- **Detailed analysis stored** in the database
- **Web interface updated** to show analysis results

Let me know when you've completed Step 1 and I'll help you run the analysis!
