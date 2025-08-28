#!/bin/bash

echo "🚀 Setting up GitHub repository for automated Junkipedia sync..."
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
fi

# Add all files
echo "📝 Adding files to git..."
git add .

# Commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: Junkipedia to Supabase connector with hourly automation"

# Set main branch
echo "🌿 Setting main branch..."
git branch -M main

echo ""
echo "✅ Local git setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create a new repository on GitHub: https://github.com/new"
echo "2. Run these commands (replace with your repo URL):"
echo "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
echo "   git push -u origin main"
echo ""
echo "3. Add GitHub Secrets:"
echo "   - Go to Settings → Secrets and variables → Actions"
echo "   - Add these secrets:"
echo "     * JUNKIPEDIA_API_KEY: hCzEWpaVgifMgURArfJNVurG"
echo "     * SUPABASE_URL: Your Supabase project URL"
echo "     * SUPABASE_ANON_KEY: Your Supabase anon key"
echo "     * SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key"
echo ""
echo "4. The workflow will automatically start running every hour!"
echo ""
echo "📖 See AUTOMATION.md for detailed instructions"
