// Transphobia Pledge V2 - Modern JavaScript
console.log('🚀 Transphobia Pledge V2 loaded');

let stripe;
let elements;
let card;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Initializing Pledge V2...');
    
    // Load stats
    loadStats();
    
    // Initialize Stripe
    initializeStripe();
    
    // Set up form handling
    setupFormHandling();
    
    // Add smooth scrolling for navigation
    setupSmoothScrolling();
});

// Load statistics from the API
async function loadStats() {
    try {
        const response = await fetch('/api/pledge-stats');
        const stats = await response.json();
        
        if (stats.success) {
            document.getElementById('total-pledges').textContent = stats.totalPledges || 0;
            document.getElementById('total-raised').textContent = `£${stats.totalCharged || 0}`;
            document.getElementById('posts-detected').textContent = stats.totalPosts || 0;
        }
    } catch (error) {
        console.error('❌ Error loading stats:', error);
    }
}

// Initialize Stripe
function initializeStripe() {
    // Wait for Stripe config to load
    if (window.STRIPE_PUBLISHABLE_KEY) {
        console.log('✅ Stripe key found:', window.STRIPE_PUBLISHABLE_KEY.substring(0, 20) + '...');
        setupStripeElements();
    } else {
        console.log('⏳ Waiting for Stripe config...');
        // Poll for Stripe config
        const checkStripeConfig = setInterval(() => {
            if (window.STRIPE_PUBLISHABLE_KEY) {
                console.log('✅ Stripe key loaded');
                clearInterval(checkStripeConfig);
                setupStripeElements();
            }
        }, 100);
    }
}

// Setup Stripe Elements
function setupStripeElements() {
    try {
        stripe = Stripe(window.STRIPE_PUBLISHABLE_KEY, {
            locale: 'en-GB'
        });
        
        elements = stripe.elements({
            locale: 'en-GB'
        });
        
        // Create card element
        card = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#1a202c',
                    '::placeholder': {
                        color: '#a0aec0',
                    },
                },
                invalid: {
                    color: '#f56565',
                },
            },
        });
        
        // Mount card element
        card.mount('#card-element');
        
        // Handle card errors
        card.addEventListener('change', function(event) {
            const displayError = document.getElementById('card-errors');
            if (event.error) {
                displayError.textContent = event.error.message;
                displayError.style.display = 'block';
            } else {
                displayError.textContent = '';
                displayError.style.display = 'none';
            }
        });
        
        console.log('✅ Stripe Elements initialized');
        
    } catch (error) {
        console.error('❌ Error setting up Stripe:', error);
        showError('Payment system temporarily unavailable. Please try again later.');
    }
}

// Setup form handling
function setupFormHandling() {
    const form = document.getElementById('pledge-form');
    const submitBtn = document.getElementById('submit-btn');
    
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        if (!stripe || !card) {
            showError('Payment system not ready. Please refresh the page.');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        
        try {
            // Get form data
            const formData = new FormData(form);
            const email = formData.get('email');
            const monthlyLimit = parseFloat(formData.get('monthlyLimit'));
            const perPostAmount = parseFloat(formData.get('perPostAmount'));
            
            // Validate form data
            if (!email || !monthlyLimit || !perPostAmount) {
                throw new Error('Please fill in all fields');
            }
            
            // Create payment method
            const { paymentMethod, error } = await stripe.createPaymentMethod({
                type: 'card',
                card: card,
                billing_details: {
                    email: email,
                    address: {
                        country: 'GB'
                    }
                },
            });
            
            if (error) {
                throw new Error(error.message);
            }
            
            // Submit pledge
            const response = await fetch('/api/create-pledge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    monthly_limit: monthlyLimit,
                    per_post_amount: perPostAmount,
                    payment_method_id: paymentMethod.id,
                    organization: 'split'
                }),
            });
            
            const result = await response.json();
            
            if (result.success) {
                showSuccess('Pledge created successfully! You will be notified when transphobic content is detected.');
                form.reset();
                card.clear();
                loadStats(); // Refresh stats
            } else {
                throw new Error(result.error || 'Failed to create pledge');
            }
            
        } catch (error) {
            console.error('❌ Error creating pledge:', error);
            showError(error.message);
        } finally {
            setLoadingState(false);
        }
    });
}

// Set loading state
function setLoadingState(loading) {
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    if (loading) {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
    } else {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

// Show success message
function showSuccess(message) {
    showNotification(message, 'success');
}

// Show error message
function showError(message) {
    showNotification(message, 'error');
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Setup smooth scrolling for navigation
function setupSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Add CSS for notifications
const notificationStyles = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }
    
    .notification-close:hover {
        opacity: 0.8;
    }
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

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
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.step, .charity-card, .transparency-item');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
});

// Add form validation
function validateForm() {
    const email = document.getElementById('email').value;
    const monthlyLimit = document.getElementById('monthly-limit').value;
    const perPostAmount = document.getElementById('per-post-amount').value;
    
    const errors = [];
    
    if (!email) {
        errors.push('Email is required');
    } else if (!isValidEmail(email)) {
        errors.push('Please enter a valid email address');
    }
    
    if (!monthlyLimit) {
        errors.push('Please select a monthly limit');
    }
    
    if (!perPostAmount) {
        errors.push('Please select an amount per post');
    }
    
    return errors;
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Add real-time form validation
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('pledge-form');
    const inputs = form.querySelectorAll('input, select');
    
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            validateField(input);
        });
        
        input.addEventListener('input', () => {
            clearFieldError(input);
        });
    });
});

// Validate individual field
function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    switch (field.type) {
        case 'email':
            if (!value) {
                isValid = false;
                errorMessage = 'Email is required';
            } else if (!isValidEmail(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
            break;
            
        case 'select-one':
            if (!value) {
                isValid = false;
                errorMessage = 'This field is required';
            }
            break;
    }
    
    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError(field);
    }
    
    return isValid;
}

// Show field error
function showFieldError(field, message) {
    clearFieldError(field);
    
    field.classList.add('error');
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
        color: #f56565;
        font-size: 0.875rem;
        margin-top: 0.25rem;
    `;
    
    field.parentNode.appendChild(errorElement);
}

// Clear field error
function clearFieldError(field) {
    field.classList.remove('error');
    
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

console.log('✅ Pledge V2 JavaScript loaded successfully');
