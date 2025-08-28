#!/bin/bash

echo "🕐 Setting up local cron job for Junkipedia sync..."
echo ""

# Get the current directory
CURRENT_DIR=$(pwd)
echo "📁 Current directory: $CURRENT_DIR"

# Create the cron command
CRON_COMMAND="0 * * * * cd $CURRENT_DIR && node index.js >> logs/sync.log 2>&1"

echo "📝 Cron command to be added:"
echo "$CRON_COMMAND"
echo ""

# Create logs directory
mkdir -p logs

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$CURRENT_DIR"; then
    echo "⚠️  Cron job already exists for this directory"
    echo "Current cron jobs:"
    crontab -l
else
    echo "❓ Do you want to add this cron job? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        # Add to crontab
        (crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -
        echo "✅ Cron job added successfully!"
        echo ""
        echo "📋 Current cron jobs:"
        crontab -l
    else
        echo "❌ Cron job not added"
    fi
fi

echo ""
echo "📖 Manual setup instructions:"
echo "1. Run: crontab -e"
echo "2. Add this line:"
echo "   $CRON_COMMAND"
echo "3. Save and exit"
echo ""
echo "🔍 To check if it's working:"
echo "   tail -f logs/sync.log"
echo ""
echo "🛑 To remove the cron job:"
echo "   crontab -e"
echo "   (delete the line and save)"
