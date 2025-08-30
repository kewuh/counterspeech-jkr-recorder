// Admin Dashboard JavaScript

// Global state
let pledgesData = [];
let statsData = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
});

// Load all dashboard data
async function loadDashboard() {
    try {
        await Promise.all([
            loadStats(),
            loadPledges(),
            loadRecentPosts()
        ]);
    } catch (error) {
        showError('Failed to load dashboard data: ' + error.message);
    }
}

// Load pledge statistics
async function loadStats() {
    try {
        const response = await fetch('/api/pledge-stats');
        const stats = await response.json();
        statsData = stats;
        
        // Update stats cards
        document.getElementById('total-pledges').textContent = stats.totalPledges;
        document.getElementById('total-monthly-limit').textContent = `£${stats.totalMonthlyLimit}`;
        document.getElementById('total-charged').textContent = `£${stats.totalCharged}`;
        document.getElementById('potential-charge').textContent = `£${stats.availableForCharging}`;
        
    } catch (error) {
        console.error('Error loading stats:', error);
        showError('Failed to load statistics');
    }
}

// Load active pledges
async function loadPledges() {
    try {
        const response = await fetch('/api/admin/pledges');
        const data = await response.json();
        
        if (data.success) {
            pledgesData = data.pledges;
            displayPledges(data.pledges);
        } else {
            throw new Error(data.error || 'Failed to load pledges');
        }
        
    } catch (error) {
        console.error('Error loading pledges:', error);
        showError('Failed to load pledges: ' + error.message);
    }
}

// Display pledges in table
function displayPledges(pledges) {
    const tbody = document.getElementById('pledges-tbody');
    const loading = document.getElementById('pledges-loading');
    const table = document.getElementById('pledges-table');
    
    if (pledges.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #64748b;">No active pledges found</td></tr>';
    } else {
        tbody.innerHTML = pledges.map(pledge => {
            const potentialCharge = pledge.transphobic_posts_count * pledge.per_post_amount;
            const chargeClass = potentialCharge > 0 ? 'charge-amount' : 'no-charge';
            const chargeText = potentialCharge > 0 ? `£${potentialCharge.toFixed(2)}` : '£0.00';
            
            return `
                <tr>
                    <td>${pledge.email}</td>
                    <td>£${pledge.monthly_limit}</td>
                    <td>£${pledge.per_post_amount}</td>
                    <td>${pledge.transphobic_posts_count || 0}</td>
                    <td class="${chargeClass}">${chargeText}</td>
                    <td><span class="status-${pledge.status}">${pledge.status}</span></td>
                    <td>${new Date(pledge.created_at).toLocaleDateString()}</td>
                </tr>
            `;
        }).join('');
    }
    
    loading.style.display = 'none';
    table.style.display = 'table';
}

// Load recent transphobic posts
async function loadRecentPosts() {
    try {
        const response = await fetch('/api/admin/recent-posts');
        const data = await response.json();
        
        if (data.success) {
            displayRecentPosts(data.posts);
        } else {
            throw new Error(data.error || 'Failed to load recent posts');
        }
        
    } catch (error) {
        console.error('Error loading recent posts:', error);
        showError('Failed to load recent posts: ' + error.message);
    }
}

// Display recent posts
function displayRecentPosts(posts) {
    const loading = document.getElementById('posts-loading');
    const content = document.getElementById('posts-content');
    const list = document.getElementById('posts-list');
    
    if (posts.length === 0) {
        list.innerHTML = '<p style="color: #64748b; text-align: center;">No transphobic posts tracked yet</p>';
    } else {
        list.innerHTML = posts.map(post => `
            <div style="padding: 15px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${post.pledges?.email || 'Unknown'}</strong>
                    <br>
                    <small style="color: #64748b;">Tweet: ${post.tweet_id}</small>
                </div>
                <div style="text-align: right;">
                    <span style="background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem;">
                        Post #${post.post_number}
                    </span>
                    <br>
                    <small style="color: #64748b;">${new Date(post.created_at).toLocaleDateString()}</small>
                </div>
            </div>
        `).join('');
    }
    
    loading.style.display = 'none';
    content.style.display = 'block';
}

// Run monthly billing
async function runMonthlyBilling() {
    if (!confirm('Are you sure you want to run monthly billing? This will charge all pledges with transphobic posts.')) {
        return;
    }
    
    try {
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Processing...';
        button.disabled = true;
        
        const response = await fetch('/api/admin/run-monthly-billing', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(`Monthly billing completed! Processed ${result.results.length} pledges.`);
            loadDashboard(); // Refresh data
        } else {
            throw new Error(result.error || 'Monthly billing failed');
        }
        
    } catch (error) {
        console.error('Error running monthly billing:', error);
        showError('Failed to run monthly billing: ' + error.message);
    } finally {
        const button = event.target;
        button.textContent = originalText;
        button.disabled = false;
    }
}

// Test post tracking
async function testTracking() {
    try {
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Testing...';
        button.disabled = true;
        
        const response = await fetch('/api/admin/test-tracking', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('Test tracking completed! Check the recent posts section.');
            loadDashboard(); // Refresh data
        } else {
            throw new Error(result.error || 'Test tracking failed');
        }
        
    } catch (error) {
        console.error('Error testing tracking:', error);
        showError('Failed to test tracking: ' + error.message);
    } finally {
        const button = event.target;
        button.textContent = originalText;
        button.disabled = false;
    }
}

// Refresh all data
async function refreshData() {
    showSuccess('Refreshing data...');
    await loadDashboard();
    showSuccess('Data refreshed successfully!');
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Show success message
function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 5000);
}

// Auto-refresh every 30 seconds
setInterval(() => {
    loadStats(); // Only refresh stats to avoid disrupting user
}, 30000);
