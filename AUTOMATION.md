# 🤖 Automated Hourly Sync Setup

This guide shows you how to set up your Junkipedia to Supabase connector to run automatically every hour for free using GitHub Actions.

## 🚀 GitHub Actions Setup (Recommended)

### Step 1: Push to GitHub
1. Create a new GitHub repository
2. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### Step 2: Add GitHub Secrets
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these secrets:

| Secret Name | Value |
|-------------|-------|
| `JUNKIPEDIA_API_KEY` | `hCzEWpaVgifMgURArfJNVurG` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |

### Step 3: Enable GitHub Actions
1. Go to **Actions** tab in your repository
2. The workflow will automatically start running every hour
3. You can also manually trigger it by clicking **Run workflow**

## 📊 Monitoring

- **GitHub Actions**: Check the Actions tab to see run history
- **Supabase**: Monitor your database for new posts
- **Logs**: Each run logs how many posts were inserted/skipped

## ⚙️ Customization

### Change Schedule
Edit `.github/workflows/junkipedia-sync.yml`:

```yaml
# Every 30 minutes
- cron: '*/30 * * * *'

# Every 2 hours  
- cron: '0 */2 * * *'

# Daily at 9 AM
- cron: '0 9 * * *'
```

### Add Notifications
Add this step to get email notifications:

```yaml
- name: Notify on success
  if: success()
  run: |
    echo "Sync completed successfully!"
    # Add your notification logic here
```

## 🔧 Alternative Free Options

### Option 2: Cron Job (Local Machine)
```bash
# Add to crontab (crontab -e)
0 * * * * cd /path/to/your/project && node index.js
```

### Option 3: Heroku Scheduler (Free Tier)
1. Deploy to Heroku
2. Add Heroku Scheduler addon
3. Set command: `node index.js`
4. Schedule for every hour

### Option 4: Railway Cron Jobs
1. Deploy to Railway
2. Use Railway's cron job feature
3. Set to run every hour

## 🛡️ Best Practices

1. **Error Handling**: The script already handles errors gracefully
2. **Duplicate Prevention**: Posts won't be inserted twice
3. **Rate Limiting**: Built-in delays prevent API abuse
4. **Monitoring**: Check logs regularly for issues

## 📈 Scaling Up

When you need more frequent updates:
- **Every 30 minutes**: Change cron to `*/30 * * * *`
- **Every 15 minutes**: Change cron to `*/15 * * * *`
- **Real-time**: Consider webhooks if Junkipedia supports them

## 💰 Cost Analysis

- **GitHub Actions**: Free for public repos, 2000 minutes/month for private
- **Supabase**: Free tier includes 500MB database
- **Junkipedia API**: Check your plan limits

Your setup will run completely free for the foreseeable future! 🎉
