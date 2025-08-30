# 🚀 Deployment Guide

## Quick Deploy Options

### Option 1: Vercel (Recommended - Free & Easy)

1. **Go to [vercel.com](https://vercel.com)** and sign up/login
2. **Click "New Project"**
3. **Import your GitHub repository**: `kewuh/counterspeech-jkr-recorder`
4. **Configure environment variables**:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `GEMINI_API_KEY` - Your Google Gemini API key
   - `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
   - `STRIPE_SECRET_KEY` - Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret
5. **Click "Deploy"**
6. **Your site will be live at**: `https://your-project-name.vercel.app`

### Option 2: Railway

1. **Go to [railway.app](https://railway.app)** and sign up/login
2. **Click "New Project"** → **"Deploy from GitHub repo"**
3. **Select your repository**: `kewuh/counterspeech-jkr-recorder`
4. **Add environment variables** (same as above)
5. **Deploy automatically**
6. **Your site will be live at**: `https://your-project-name.railway.app`

### Option 3: Render

1. **Go to [render.com](https://render.com)** and sign up/login
2. **Click "New"** → **"Web Service"**
3. **Connect your GitHub repository**
4. **Configure**:
   - **Name**: `counterspeech-jkr-recorder`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. **Add environment variables** (same as above)
6. **Click "Create Web Service"**
7. **Your site will be live at**: `https://your-project-name.onrender.com`

## Environment Variables Required

Make sure to set these in your deployment platform:

```bash
# Supabase (Database)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini (AI Analysis)
GEMINI_API_KEY=your_gemini_api_key

# Stripe (Payments) - Optional for basic functionality
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

## Database Setup

Before deploying, make sure your Supabase database has the required tables:

1. **Run the SQL scripts** in your Supabase dashboard:
   - `add-public-pledge-column.sql`
   - `create-pledge-tables.sql`
   - `create-reply-contexts-table.sql`
   - `create-reply-analysis-table.sql`

## Features Available After Deployment

✅ **Monitoring Dashboard** - View JK Rowling's tweets with AI analysis
✅ **Pledge System** - Accept donations with Stripe integration
✅ **AI Analysis** - Transphobic content detection with Gemini
✅ **Admin Dashboard** - Manage pledges and view statistics
✅ **WhatsApp Sharing** - Social sharing functionality

## Custom Domain (Optional)

After deployment, you can add a custom domain:
1. **Vercel**: Settings → Domains → Add Domain
2. **Railway**: Settings → Domains → Add Custom Domain
3. **Render**: Settings → Custom Domains → Add Domain

## Monitoring & Maintenance

- **Logs**: Check deployment platform logs for errors
- **Database**: Monitor Supabase usage and limits
- **API Limits**: Watch Gemini and Stripe API usage
- **Performance**: Monitor response times and uptime

## Support

If you encounter issues:
1. Check the deployment platform logs
2. Verify all environment variables are set
3. Ensure database tables are created
4. Test locally first with `npm start`
