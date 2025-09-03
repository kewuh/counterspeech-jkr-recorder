// Pledge Page JavaScript - UK Version
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Pledge page loaded');
    
    // Test Stripe key availability
    console.log('🔍 Checking Stripe key...');
    console.log('Stripe key available:', !!window.STRIPE_PUBLISHABLE_KEY);
    if (window.STRIPE_PUBLISHABLE_KEY) {
        console.log('Stripe key starts with:', window.STRIPE_PUBLISHABLE_KEY.substring(0, 20));
    }
    
    // Initialize button groups
    initializeButtonGroups();
    
    // Load recent public pledgers
    loadRecentPublicPledgers();
    
    // Load recent public pledgers
    async function loadRecentPublicPledgers() {
        const pledgersList = document.getElementById('recentPledgersList');
        if (!pledgersList) return;
        pledgersList.innerHTML = '<p style="text-align: center; color: #666;">Loading recent pledgers...</p>';
    
        try {
            const response = await fetch('/api/recent-public-pledgers');
            const result = await response.json();
    
            if (result.success && result.pledgers.length > 0) {
                pledgersList.innerHTML = ''; // Clear loading message
                result.pledgers.forEach(pledger => {
                    const pledgerItem = document.createElement('div');
                    pledgerItem.className = 'pledger-item';
                    const firstName = pledger.name ? pledger.name.split(' ')[0] : 'Anonymous';
                    const avatarInitial = firstName.charAt(0).toUpperCase();
                    const perPostText = pledger.perPostAmount === 1 ? '£1' : `${(pledger.perPostAmount * 100).toFixed(0)}p`;
                    const timeAgo = formatTimeAgo(pledger.createdAt);
    
                    pledgerItem.innerHTML = `
                        <div class="pledger-avatar">${avatarInitial}</div>
                        <div class="pledger-info">
                            <div class="pledger-name">${firstName}</div>
                            <div class="pledger-amount">£${pledger.monthlyLimit} cap • ${perPostText} per post</div>
                        </div>
                        <div class="pledger-time">${timeAgo}</div>
                    `;
                    pledgersList.appendChild(pledgerItem);
                });
            } else {
                pledgersList.innerHTML = '<p style="text-align: center; color: #666;">No public pledges yet.</p>';
            }
        } catch (error) {
            console.error('Error loading recent public pledgers:', error);
            pledgersList.innerHTML = '<p style="color: red; text-align: center;">Failed to load pledgers.</p>';
        }
    }
    
    function formatTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const seconds = Math.floor((now - date) / 1000);
    
        if (seconds < 60) return `${seconds} sec ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} min ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString('en-GB');
    }
    
    // Check if Stripe key is available
    if (!window.STRIPE_PUBLISHABLE_KEY) {
        console.error('❌ Stripe publishable key not found');
        showError('Stripe configuration error. Please refresh the page.');
        return;
    }
    
    console.log('✅ Stripe key found:', window.STRIPE_PUBLISHABLE_KEY.substring(0, 20) + '...');
    
    // Check if Stripe object is available
    if (typeof Stripe === 'undefined') {
        console.error('❌ Stripe object not available');
        showError('Stripe library failed to load. Please refresh the page.');
        return;
    }
    
    // Initialize Stripe
    const stripe = Stripe(window.STRIPE_PUBLISHABLE_KEY);
    const elements = stripe.elements({
        locale: 'en-GB', // Set to UK locale for postcode instead of zip code
    });
    
    // Create card element immediately
    console.log('🔧 Creating card element...');
    try {
        const cardElementDiv = document.getElementById('card-element');
        console.log('Card element div found:', !!cardElementDiv);
        
        if (!cardElementDiv) {
            throw new Error('Card element div not found');
        }
        
        // Create the card element
        const cardElement = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                        color: '#aab7c4',
                    },
                },
                invalid: {
                    color: '#9e2146',
                },
            },
        });

        console.log('🔧 Mounting card element...');
        cardElement.mount('#card-element');
        console.log('✅ Card element mounted successfully');
        
        // Add error handling for card element
        cardElement.on('change', (event) => {
            const displayError = document.getElementById('card-errors');
            if (displayError) {
                if (event.error) {
                    displayError.textContent = event.error.message;
                } else {
                    displayError.textContent = '';
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Error creating/mounting card element:', error);
        const cardElementDiv = document.getElementById('card-element');
        if (cardElementDiv) {
            cardElementDiv.innerHTML = '<div style="color: red; padding: 10px; border: 1px solid red; border-radius: 4px; background: #fef2f2;">Payment form failed to load: ' + error.message + '</div>';
        }
    }
    
    // Form submission
    const form = document.getElementById('pledgeForm');
    const submitBtn = form.querySelector('.submit-btn');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
        
        // Get form data
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            monthlyLimit: document.getElementById('monthlyLimit').value,
            perPostAmount: document.getElementById('perPostAmount').value,
            publicPledge: document.getElementById('publicPledge').checked
        };
        
        try {
            // Get the card element
            const cardElement = elements.getElement('card');
            if (!cardElement) {
                throw new Error('Payment form not loaded. Please refresh the page.');
            }
            
            // Create payment method
            const { paymentMethod, error } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
                billing_details: {
                    email: formData.email,
                    address: {
                        country: 'GB', // Set to UK
                    },
                },
            });
            
            if (error) {
                throw new Error(error.message);
            }
            
            // Send to your server
            const response = await fetch('/api/create-pledge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentMethodId: paymentMethod.id,
                    ...formData
                }),
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Show thank you modal instead of success message
                showThankYouModal();
                form.reset();
                const cardElement = elements.getElement('card');
                if (cardElement) {
                    cardElement.clear();
                }
            } else {
                throw new Error(result.error || 'Failed to create pledge');
            }
            
        } catch (error) {
            showError(error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Pledge your support';
        }
    });
    
    // Error handling for card element
    cardElement.on('change', ({error}) => {
        const displayError = document.getElementById('card-errors');
        if (error) {
            displayError.textContent = error.message;
        } else {
            displayError.textContent = '';
        }
    });
    
    // Success/Error notifications
    function showSuccess(message) {
        showNotification(message, 'success');
    }
    
    function showError(message) {
        showNotification(message, 'error');
    }
    
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            ${type === 'success' ? 'background: #10b981;' : 'background: #ef4444;'}
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add hover effects to organisation cards
    document.querySelectorAll('.org-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Add intersection observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.step, .org-card, .faq-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Initialize button groups for amount selection
function initializeButtonGroups() {
    // Monthly limit buttons
    const monthlyLimitButtons = document.querySelectorAll('#monthlyLimitButtons .amount-btn');
    const monthlyLimitInput = document.getElementById('monthlyLimit');
    const monthlyLimitDisplay = document.querySelector('#monthlyLimitButtons').previousElementSibling.querySelector('.selected-amount');
    const changeMonthlyBtn = document.getElementById('changeMonthlyBtn');
    const monthlyLimitGroup = document.getElementById('monthlyLimitButtons');
    
    // Handle change button for monthly limit
    changeMonthlyBtn.addEventListener('click', function() {
        monthlyLimitGroup.classList.toggle('hidden');
    });
    
    monthlyLimitButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove selected class from all buttons
            monthlyLimitButtons.forEach(b => b.classList.remove('selected'));
            // Add selected class to clicked button
            this.classList.add('selected');
            // Update hidden input value
            monthlyLimitInput.value = this.dataset.value;
            // Update display
            monthlyLimitDisplay.textContent = '£' + this.dataset.value;
            // Hide button group
            monthlyLimitGroup.classList.add('hidden');
        });
    });
    
    // Per post amount buttons
    const perPostAmountButtons = document.querySelectorAll('#perPostAmountButtons .amount-btn');
    const perPostAmountInput = document.getElementById('perPostAmount');
    const perPostAmountDisplay = document.querySelector('#perPostAmountButtons').previousElementSibling.querySelector('.selected-amount');
    const changePerPostBtn = document.getElementById('changePerPostBtn');
    const perPostAmountGroup = document.getElementById('perPostAmountButtons');
    
    // Handle change button for per post amount
    changePerPostBtn.addEventListener('click', function() {
        perPostAmountGroup.classList.toggle('hidden');
    });
    
    perPostAmountButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove selected class from all buttons
            perPostAmountButtons.forEach(b => b.classList.remove('selected'));
            // Add selected class to clicked button
            this.classList.add('selected');
            // Update hidden input value
            perPostAmountInput.value = this.dataset.value;
            // Update display
            const value = this.dataset.value;
            if (value === '1.00') {
                perPostAmountDisplay.textContent = '£1';
            } else {
                perPostAmountDisplay.textContent = value.replace('0.', '') + 'p';
            }
            // Hide button group
            perPostAmountGroup.classList.add('hidden');
        });
    });
}

// Mock API endpoint (replace with your actual backend)
async function mockCreatePledge(data) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate success/failure
    if (Math.random() > 0.1) { // 90% success rate
        return { success: true, pledgeId: 'pledge_' + Math.random().toString(36).substr(2, 9) };
    } else {
        throw new Error('Payment failed. Please try again.');
    }
}

// Modal functions
function showThankYouModal() {
    const modal = document.getElementById('thankYouModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function hideThankYouModal() {
    const modal = document.getElementById('thankYouModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// WhatsApp share function
function shareViaWhatsApp() {
    const url = encodeURIComponent('https://www.thanksjk.org');
    const text = encodeURIComponent('I just pledged to donate when JK Rowling tweets transphobic content. Join me in turning hate into hope: ');
    const whatsappUrl = `https://wa.me/?text=${text}${url}`;
    window.open(whatsappUrl, '_blank');
}

// Modal event listeners
document.addEventListener('DOMContentLoaded', function() {
    const closeModalBtn = document.getElementById('closeModalBtn');
    const whatsappShareBtn = document.getElementById('whatsappShareBtn');
    const modal = document.getElementById('thankYouModal');
    
    // Close modal button
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideThankYouModal);
    }
    
    // WhatsApp share button
    if (whatsappShareBtn) {
        whatsappShareBtn.addEventListener('click', shareViaWhatsApp);
    }
    
    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideThankYouModal();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            hideThankYouModal();
        }
    });
});
