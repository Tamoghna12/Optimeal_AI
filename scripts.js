// DOM Content Loaded Event Listener
document.addEventListener('DOMContentLoaded', function() {
    // Initialize analytics tracking
    initializeAnalytics();
    
    // Initialize form validation
    initializeFormValidation();
    
    // Initialize FAQ functionality
    initializeFAQ();
    
    // Initialize scroll tracking for sections
    initializeScrollTracking();
    
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Add smooth scrolling to all internal links
    initializeSmoothScrolling();
    
    // Initialize interactive background animations
    initializeInteractiveAnimations();
});

// Analytics and Event Tracking
function initializeAnalytics() {
    console.log('Analytics initialized for Homeland Meals');
    
    // Track page load
    trackEvent('page_load', {
        page: 'landing',
        timestamp: new Date().toISOString()
    });
}

// Global event tracking function (defined in HTML head)
// This function is called by onclick handlers throughout the page

// Smooth Scrolling Functions
function scrollToSignup() {
    const signupSection = document.getElementById('signup');
    if (signupSection) {
        signupSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function scrollToFeatures() {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function scrollToDemo() {
    const demoSection = document.getElementById('demo');
    if (demoSection) {
        demoSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Form Handling
function initializeFormValidation() {
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Initialize mid-page form as well
    const midSignupForm = document.getElementById('midSignupForm');
    if (midSignupForm) {
        midSignupForm.addEventListener('submit', handleMidFormSubmit);
    }
}

function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const formValues = {
        name: formData.get('name'),
        email: formData.get('email'),
        challenge: formData.get('challenge')
    };
    
    // Validate form data
    if (!validateForm(formValues)) {
        return;
    }
    
    // Track form submission
    trackEvent('form_submit', {
        challenge: formValues.challenge,
        timestamp: new Date().toISOString()
    });
    
    // Simulate form submission
    submitFormData(formValues)
        .then(() => {
            showSuccessModal();
            resetForm(event.target);
        })
        .catch((error) => {
            console.error('Form submission error:', error);
            showErrorMessage('Sorry, there was an error submitting your information. Please try again.');
        });
}

function handleMidFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    
    // Validate email
    if (!validateEmail(email)) {
        showMidFormError('Please enter a valid email address.');
        return;
    }
    
    // Track mid-form submission
    trackEvent('mid_form_submit', {
        source: 'mid_page_collector',
        timestamp: new Date().toISOString()
    });
    
    // Set button loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);
    
    // Simulate form submission
    submitMidFormData({ email })
        .then(() => {
            showMidFormSuccess();
            event.target.reset();
        })
        .catch((error) => {
            console.error('Mid-form submission error:', error);
            showMidFormError('Sorry, there was an error. Please try again.');
        })
        .finally(() => {
            setButtonLoading(submitBtn, false);
        });
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email && emailRegex.test(email);
}

function submitMidFormData(formValues) {
    // Simulate API call for mid-page form
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log('Mid-page form submitted successfully:', formValues);
            resolve({ success: true });
        }, 1500);
    });
}

function showMidFormError(message) {
    // Create or update error message element for mid-form
    let errorElement = document.querySelector('.mid-form-error-message');
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'mid-form-error-message';
        errorElement.style.cssText = `
            background: rgba(255, 82, 82, 0.9);
            color: white;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            margin: 1rem auto 0;
            text-align: center;
            font-size: 0.9rem;
            max-width: 500px;
            backdrop-filter: blur(10px);
        `;
        
        const midForm = document.getElementById('midSignupForm');
        midForm.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 4000);
}

function showMidFormSuccess() {
    // Create success message element for mid-form
    const successElement = document.createElement('div');
    successElement.className = 'mid-form-success-message';
    successElement.style.cssText = `
        background: rgba(255, 255, 255, 0.95);
        color: var(--primary-green);
        padding: 1.5rem;
        border-radius: 12px;
        margin: 1rem auto 0;
        text-align: center;
        font-size: 1rem;
        max-width: 500px;
        backdrop-filter: blur(10px);
        font-weight: 500;
        border: 2px solid rgba(255, 255, 255, 0.5);
        animation: slideInUp 0.5s ease-out;
    `;
    
    successElement.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎉</div>
        <div>Awesome! You're on the waitlist!</div>
        <div style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.8;">
            We'll send you early access details soon.
        </div>
    `;
    
    const midForm = document.getElementById('midSignupForm');
    midForm.appendChild(successElement);
    
    // Remove success message after 5 seconds
    setTimeout(() => {
        successElement.style.animation = 'slideOutUp 0.5s ease-out forwards';
        setTimeout(() => {
            if (successElement.parentNode) {
                successElement.parentNode.removeChild(successElement);
            }
        }, 500);
    }, 5000);
}

// Add slideInUp and slideOutUp animations to existing CSS (via JavaScript)
if (!document.querySelector('#dynamic-animations')) {
    const style = document.createElement('style');
    style.id = 'dynamic-animations';
    style.textContent = `
        @keyframes slideInUp {
            0% {
                transform: translateY(30px);
                opacity: 0;
            }
            100% {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutUp {
            0% {
                transform: translateY(0);
                opacity: 1;
            }
            100% {
                transform: translateY(-30px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

function validateForm(formValues) {
    const { name, email, challenge } = formValues;
    
    // Name validation
    if (!name || name.trim().length < 2) {
        showErrorMessage('Please enter a valid name (at least 2 characters).');
        return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showErrorMessage('Please enter a valid email address.');
        return false;
    }
    
    // Challenge selection validation
    if (!challenge) {
        showErrorMessage('Please select your biggest food/grocery challenge.');
        return false;
    }
    
    return true;
}

function submitFormData(formValues) {
    // Simulate API call - replace with actual endpoint
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulate successful submission
            console.log('Form submitted successfully:', formValues);
            resolve({ success: true });
        }, 1000);
    });
}

function resetForm(form) {
    form.reset();
}

function showErrorMessage(message) {
    // Create or update error message element
    let errorElement = document.querySelector('.form-error-message');
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'form-error-message';
        errorElement.style.cssText = `
            background: #ff5252;
            color: white;
            padding: 0.75rem;
            border-radius: 4px;
            margin: 1rem 0;
            text-align: center;
            font-size: 0.9rem;
        `;
        
        const signupForm = document.getElementById('signupForm');
        signupForm.insertBefore(errorElement, signupForm.firstChild);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

// Success Modal Functions
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        // Track modal show
        trackEvent('success_modal_shown', {
            timestamp: new Date().toISOString()
        });
    }
}

function closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
        
        // Track modal close
        trackEvent('success_modal_closed', {
            timestamp: new Date().toISOString()
        });
    }
}

// FAQ Functionality
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                const faqId = item.dataset.faq;
                toggleFAQ(faqId);
            });
        }
    });
}

function toggleFAQ(faqId) {
    const faqItem = document.querySelector(`[data-faq="${faqId}"]`);
    if (!faqItem) return;
    
    const isActive = faqItem.classList.contains('active');
    
    // Close all FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Toggle current item
    if (!isActive) {
        faqItem.classList.add('active');
        
        // Track FAQ interaction
        trackEvent(`faq_toggle_${faqId}`, {
            action: 'open',
            timestamp: new Date().toISOString()
        });
    } else {
        // Track FAQ close
        trackEvent(`faq_toggle_${faqId}`, {
            action: 'close',
            timestamp: new Date().toISOString()
        });
    }
}

// Mobile Menu Functionality
function initializeMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', toggleMobileMenu);
        
        // Close menu when clicking on nav links
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    
    if (navMenu && mobileToggle) {
        const isActive = navMenu.classList.contains('active');
        
        if (!isActive) {
            // Open menu
            navMenu.classList.add('active');
            mobileToggle.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            // Close menu
            navMenu.classList.remove('active');
            mobileToggle.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // Track mobile menu interaction
        trackEvent('mobile_menu_toggle', {
            action: isActive ? 'close' : 'open',
            timestamp: new Date().toISOString()
        });
    }
}

// Scroll Tracking for Analytics
function initializeScrollTracking() {
    const sections = [
        { id: 'problem', event: 'view_problem_section' },
        { id: 'how-it-works', event: 'view_how_it_works' },
        { id: 'social-proof', event: 'view_social_proof' }
    ];
    
    const observerOptions = {
        threshold: 0.5, // Trigger when 50% of section is visible
        rootMargin: '0px 0px -10% 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const section = sections.find(s => s.id === entry.target.id);
                if (section && !entry.target.dataset.tracked) {
                    trackEvent(section.event, {
                        timestamp: new Date().toISOString()
                    });
                    entry.target.dataset.tracked = 'true';
                }
            }
        });
    }, observerOptions);
    
    // Observe sections
    sections.forEach(section => {
        const element = document.getElementById(section.id);
        if (element) {
            observer.observe(element);
        }
    });
}

// Smooth Scrolling for Internal Links
function initializeSmoothScrolling() {
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    
    internalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Track internal navigation
                trackEvent('internal_nav_click', {
                    target: targetId,
                    timestamp: new Date().toISOString()
                });
            }
        });
    });
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add loading states to buttons
function setButtonLoading(button, isLoading = true) {
    if (!button) return;
    
    if (isLoading) {
        button.dataset.originalText = button.textContent;
        button.textContent = 'Loading...';
        button.disabled = true;
        button.style.opacity = '0.7';
        button.style.cursor = 'not-allowed';
    } else {
        button.textContent = button.dataset.originalText || button.textContent;
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
    }
}

// Error handling for global errors
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    
    // Track errors in analytics (but don't send sensitive data)
    trackEvent('javascript_error', {
        message: e.error?.message || 'Unknown error',
        filename: e.filename,
        line: e.lineno,
        timestamp: new Date().toISOString()
    });
});

// Handle clicks outside modal to close it
document.addEventListener('click', (e) => {
    const modal = document.getElementById('successModal');
    if (modal && e.target === modal) {
        closeModal();
    }
});

// Keyboard navigation for accessibility
document.addEventListener('keydown', (e) => {
    // Close modal with Escape key
    if (e.key === 'Escape') {
        const modal = document.getElementById('successModal');
        if (modal && modal.style.display === 'flex') {
            closeModal();
        }
        
        // Close mobile menu with Escape key
        const navMenu = document.querySelector('.nav-menu');
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            if (mobileToggle) {
                mobileToggle.classList.remove('active');
            }
            document.body.style.overflow = '';
        }
    }
});

// Performance optimization: lazy loading for images
function initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading when DOM is ready
document.addEventListener('DOMContentLoaded', initializeLazyLoading);

// Interactive Background Animations
function initializeInteractiveAnimations() {
    // Add click handlers for floating spices (hero section)
    const floatingSpices = document.querySelectorAll('.floating-spice');
    floatingSpices.forEach((spice, index) => {
        spice.addEventListener('click', function() {
            // Add bounce animation
            this.classList.add('clicked');
            
            // Create particles effect
            createParticleEffect(this);
            
            // Track the interaction
            trackEvent('spice_clicked', {
                spice_index: index,
                spice_emoji: this.textContent,
                timestamp: new Date().toISOString()
            });
            
            // Remove clicked class after animation
            setTimeout(() => {
                this.classList.remove('clicked');
            }, 600);
        });
    });
    
    // Add click handlers for floating elements (mid-page section)
    const floatingElements = document.querySelectorAll('.floating-element');
    floatingElements.forEach((element, index) => {
        element.addEventListener('click', function() {
            // Add bounce animation
            this.classList.add('clicked');
            
            // Create particles effect
            createParticleEffect(this);
            
            // Track the interaction
            trackEvent('veggie_clicked', {
                element_index: index,
                element_emoji: this.textContent,
                timestamp: new Date().toISOString()
            });
            
            // Remove clicked class after animation
            setTimeout(() => {
                this.classList.remove('clicked');
            }, 800);
        });
    });
}

// Create particle effect when clicking animated elements
function createParticleEffect(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Create 8 particles
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            top: ${centerY}px;
            left: ${centerX}px;
            width: 8px;
            height: 8px;
            background: #4CAF50;
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            animation: particle-explode-${i} 1s ease-out forwards;
        `;
        
        // Add particle-specific animation
        const angle = (360 / 8) * i;
        const distance = 60 + Math.random() * 40;
        const keyframes = `
            @keyframes particle-explode-${i} {
                0% { 
                    transform: translate(0, 0) scale(1); 
                    opacity: 1; 
                }
                100% { 
                    transform: translate(${Math.cos(angle * Math.PI / 180) * distance}px, ${Math.sin(angle * Math.PI / 180) * distance}px) scale(0); 
                    opacity: 0; 
                }
            }
        `;
        
        // Add keyframes to head
        const style = document.createElement('style');
        style.textContent = keyframes;
        document.head.appendChild(style);
        
        document.body.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            particle.remove();
            style.remove();
        }, 1000);
    }
}

// Console log for development
console.log('🏠 Homeland Meals landing page loaded successfully!');