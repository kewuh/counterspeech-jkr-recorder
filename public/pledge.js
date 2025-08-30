// Pledge Page JavaScript - UK Version
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Pledge page loaded');
    
    // Check if Stripe key is available
    if (!window.STRIPE_PUBLISHABLE_KEY) {
        console.error('❌ Stripe publishable key not found');
        showError('Stripe configuration error. Please refresh the page.');
        return;
    }
    
    console.log('✅ Stripe key found:', window.STRIPE_PUBLISHABLE_KEY.substring(0, 20) + '...');
    
    // Initialize Stripe
    const stripe = Stripe(window.STRIPE_PUBLISHABLE_KEY);
    const elements = stripe.elements({
        locale: 'en-GB', // Set to UK locale for postcode instead of zip code
    });
    
    // Create card element
    console.log('🔧 Creating card element...');
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
        // Explicitly request postcode field for UK
        hidePostalCode: false,
    });

    console.log('🔧 Mounting card element...');
    cardElement.mount('#card-element');
    console.log('✅ Card element mounted');
    
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
            email: document.getElementById('email').value,
            monthlyLimit: document.getElementById('monthlyLimit').value,
            perPostAmount: document.getElementById('perPostAmount').value
        };
        
        try {
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
                showSuccess('Pledge created successfully! You will be notified when transphobic content is detected.');
                form.reset();
                cardElement.clear();
            } else {
                throw new Error(result.error || 'Failed to create pledge');
            }
            
        } catch (error) {
            showError(error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Start Pledge';
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
