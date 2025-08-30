const fs = require('fs');
const path = require('path');

class TwitterAPITracker {
    constructor() {
        this.logFile = path.join(__dirname, 'twitter-api-usage.log');
        this.statsFile = path.join(__dirname, 'twitter-api-stats.json');
        this.ensureFilesExist();
    }

    ensureFilesExist() {
        // Create log file if it doesn't exist
        if (!fs.existsSync(this.logFile)) {
            fs.writeFileSync(this.logFile, '');
        }

        // Create stats file if it doesn't exist
        if (!fs.existsSync(this.statsFile)) {
            const initialStats = {
                total_calls: 0,
                calls_by_hour: {},
                calls_by_day: {},
                calls_by_week: {},
                calls_by_month: {},
                last_updated: new Date().toISOString()
            };
            fs.writeFileSync(this.statsFile, JSON.stringify(initialStats, null, 2));
        }
    }

    logAPICall(endpoint, method, success = true, error = null) {
        const timestamp = new Date();
        const logEntry = {
            timestamp: timestamp.toISOString(),
            endpoint,
            method,
            success,
            error: error ? error.message : null
        };

        // Append to log file
        const logLine = JSON.stringify(logEntry) + '\n';
        fs.appendFileSync(this.logFile, logLine);

        // Update stats
        this.updateStats(timestamp);
    }

    updateStats(timestamp) {
        const stats = this.getStats();
        
        // Increment total calls
        stats.total_calls++;
        
        // Update hourly stats
        const hourKey = timestamp.toISOString().slice(0, 13); // YYYY-MM-DDTHH
        stats.calls_by_hour[hourKey] = (stats.calls_by_hour[hourKey] || 0) + 1;
        
        // Update daily stats
        const dayKey = timestamp.toISOString().slice(0, 10); // YYYY-MM-DD
        stats.calls_by_day[dayKey] = (stats.calls_by_day[dayKey] || 0) + 1;
        
        // Update weekly stats (ISO week)
        const weekKey = this.getISOWeek(timestamp);
        stats.calls_by_week[weekKey] = (stats.calls_by_week[weekKey] || 0) + 1;
        
        // Update monthly stats
        const monthKey = timestamp.toISOString().slice(0, 7); // YYYY-MM
        stats.calls_by_month[monthKey] = (stats.calls_by_month[monthKey] || 0) + 1;
        
        stats.last_updated = new Date().toISOString();
        
        // Save updated stats
        fs.writeFileSync(this.statsFile, JSON.stringify(stats, null, 2));
    }

    getISOWeek(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `${d.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
    }

    getStats() {
        try {
            const data = fs.readFileSync(this.statsFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return {
                total_calls: 0,
                calls_by_hour: {},
                calls_by_day: {},
                calls_by_week: {},
                calls_by_month: {},
                last_updated: new Date().toISOString()
            };
        }
    }

    getRecentCalls(limit = 10) {
        try {
            const logLines = fs.readFileSync(this.logFile, 'utf8').trim().split('\n');
            const recentCalls = logLines.slice(-limit).map(line => {
                try {
                    return JSON.parse(line);
                } catch (e) {
                    return null;
                }
            }).filter(call => call !== null);
            
            return recentCalls.reverse(); // Most recent first
        } catch (error) {
            return [];
        }
    }

    displayStats() {
        const stats = this.getStats();
        const recentCalls = this.getRecentCalls(5);
        
        console.log('📊 Twitter API Usage Statistics');
        console.log('==============================');
        console.log(`Total API calls: ${stats.total_calls}`);
        console.log(`Last updated: ${stats.last_updated}`);
        
        // Today's calls
        const today = new Date().toISOString().slice(0, 10);
        const todayCalls = stats.calls_by_day[today] || 0;
        console.log(`Today's calls: ${todayCalls}`);
        
        // This week's calls
        const thisWeek = this.getISOWeek(new Date());
        const thisWeekCalls = stats.calls_by_week[thisWeek] || 0;
        console.log(`This week's calls: ${thisWeekCalls}`);
        
        // This month's calls
        const thisMonth = new Date().toISOString().slice(0, 7);
        const thisMonthCalls = stats.calls_by_month[thisMonth] || 0;
        console.log(`This month's calls: ${thisMonthCalls}`);
        
        console.log('\n📝 Recent API Calls:');
        console.log('===================');
        recentCalls.forEach((call, index) => {
            const time = new Date(call.timestamp).toLocaleString();
            const status = call.success ? '✅' : '❌';
            console.log(`${index + 1}. ${time} ${status} ${call.method} ${call.endpoint}`);
            if (call.error) {
                console.log(`   Error: ${call.error}`);
            }
        });
        
        // Rate limit info
        console.log('\n⚠️  Twitter API Rate Limits (Free Tier):');
        console.log('=====================================');
        console.log('• 500 Posts/month');
        console.log('• 100 Reads/month');
        console.log('• ~3.3 reads/day average');
        console.log('• ~16.7 reads/week average');
        
        const remainingReads = 100 - thisMonthCalls;
        console.log(`\n📈 This month: ${thisMonthCalls}/100 reads used (${remainingReads} remaining)`);
        
        if (thisMonthCalls >= 100) {
            console.log('🚨 RATE LIMIT REACHED - Wait for next billing cycle');
        } else if (thisMonthCalls >= 80) {
            console.log('⚠️  WARNING - Approaching rate limit');
        }
    }

    clearLogs() {
        fs.writeFileSync(this.logFile, '');
        const initialStats = {
            total_calls: 0,
            calls_by_hour: {},
            calls_by_day: {},
            calls_by_week: {},
            calls_by_month: {},
            last_updated: new Date().toISOString()
        };
        fs.writeFileSync(this.statsFile, JSON.stringify(initialStats, null, 2));
        console.log('✅ API usage logs cleared');
    }
}

// CLI interface
const command = process.argv[2];
const tracker = new TwitterAPITracker();

if (command === 'stats') {
    tracker.displayStats();
} else if (command === 'recent') {
    const limit = parseInt(process.argv[3]) || 10;
    const recentCalls = tracker.getRecentCalls(limit);
    console.log(`📝 Last ${limit} API calls:`);
    recentCalls.forEach((call, index) => {
        const time = new Date(call.timestamp).toLocaleString();
        const status = call.success ? '✅' : '❌';
        console.log(`${index + 1}. ${time} ${status} ${call.method} ${call.endpoint}`);
    });
} else if (command === 'clear') {
    tracker.clearLogs();
} else {
    console.log('Usage: node twitter-api-tracker.js [stats|recent|clear]');
    console.log('  stats   - Show API usage statistics');
    console.log('  recent  - Show recent API calls (optional: number)');
    console.log('  clear   - Clear all usage logs');
}

module.exports = TwitterAPITracker;
