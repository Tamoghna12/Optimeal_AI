// Nutrichef AI Landing Page JavaScript
// Interactive elements, demo functionality, and analytics

(function() {
    'use strict';
    
    // Global state management
    const state = {
        demoActive: false,
        currentAnalysis: null,
        scrollPosition: 0
    };
    
    // Analytics helper functions
    function trackEvent(eventName, parameters = {}) {
        // Google Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, parameters);
        }
        
        // Console logging for development
        console.log('Event tracked:', eventName, parameters);
        
        // Custom analytics endpoint (optional)
        // You can add your own analytics service here
        // fetch('/api/analytics/track', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ event: eventName, ...parameters })
        // });
    }
    
    // Smooth scrolling utility
    function smoothScrollTo(elementId, offset = 100) {
        const element = document.getElementById(elementId);
        if (element) {
            const top = element.offsetTop - offset;
            window.scrollTo({
                top: top,
                behavior: 'smooth'
            });
            trackEvent('scroll_to_section', { section: elementId });
        }
    }
    
    // Global scroll function for buttons
    window.scrollToDemo = function() {
        smoothScrollTo('demo', 80);
        trackEvent('cta_scroll_to_demo');
    };
    
    // Mobile menu toggle
    function initMobileMenu() {
        const toggle = document.querySelector('.mobile-menu-toggle');
        const menu = document.querySelector('.nav-menu');
        
        if (toggle && menu) {
            toggle.addEventListener('click', function() {
                menu.classList.toggle('active');
                toggle.classList.toggle('active');
                trackEvent('mobile_menu_toggle');
            });
        }
    }
    
    // Navbar scroll effect
    function initNavbarScroll() {
        const navbar = document.querySelector('.navbar');
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', function() {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            lastScrollY = currentScrollY;
        });
    }
    
    // Intersection Observer for animations
    function initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    trackEvent('section_viewed', { 
                        section: entry.target.id || entry.target.className 
                    });
                }
            });
        }, observerOptions);
        
        // Observe sections for animation
        const sections = document.querySelectorAll('section, .feature-card, .testimonial-card');
        sections.forEach(section => observer.observe(section));
    }
    
    // Demo functionality
    function initDemo() {
        const fileInput = document.getElementById('fileInput');
        const uploadZone = document.getElementById('uploadZone');
        const demoUpload = document.getElementById('demoUpload');
        const demoResults = document.getElementById('demoResults');
        const demoLoading = document.getElementById('demoLoading');
        
        if (!fileInput || !uploadZone) return;
        
        // File input change handler
        fileInput.addEventListener('change', handleFileSelect);
        
        // Drag and drop handlers
        uploadZone.addEventListener('dragover', handleDragOver);
        uploadZone.addEventListener('drop', handleFileDrop);
        uploadZone.addEventListener('dragleave', handleDragLeave);
        
        // Click handler for upload zone
        uploadZone.addEventListener('click', function() {
            fileInput.click();
            trackEvent('demo_upload_zone_clicked');
        });
    }
    
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            processFile(file);
            trackEvent('demo_file_selected', { 
                fileType: file.type,
                fileSize: file.size 
            });
        } else {
            showError('Please select a valid image file.');
        }
    }
    
    function handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('drag-over');
    }
    
    function handleDragLeave(event) {
        event.currentTarget.classList.remove('drag-over');
    }
    
    function handleFileDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');
        
        const files = event.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            processFile(files[0]);
            trackEvent('demo_file_dropped', { 
                fileType: files[0].type,
                fileSize: files[0].size 
            });
        } else {
            showError('Please drop a valid image file.');
        }
    }
    
    function processFile(file) {
        if (state.demoActive) return;
        
        state.demoActive = true;
        showLoading();
        
        // Create a FileReader to read the image
        const reader = new FileReader();
        reader.onload = function(event) {
            // Simulate API call with realistic delay
            simulateAnalysis(event.target.result);
        };
        reader.readAsDataURL(file);
    }
    
    function showLoading() {
        const demoUpload = document.getElementById('demoUpload');
        const demoLoading = document.getElementById('demoLoading');
        
        if (demoUpload && demoLoading) {
            demoUpload.style.display = 'none';
            demoLoading.style.display = 'block';
            
            // Animated loading steps
            const steps = [
                'Identifying ingredients...',
                'Analyzing nutritional content...',
                'Detecting cultural context...',
                'Generating insights...',
                'Finalizing results...'
            ];
            
            let stepIndex = 0;
            const stepElement = document.getElementById('loadingSteps');
            
            const stepInterval = setInterval(() => {
                if (stepElement && stepIndex < steps.length) {
                    stepElement.textContent = steps[stepIndex];
                    stepIndex++;
                } else {
                    clearInterval(stepInterval);
                }
            }, 800);
        }
    }
    
    function simulateAnalysis(imageData) {
        // Simulate realistic API delay
        setTimeout(() => {
            const mockAnalysis = generateMockAnalysis();
            showResults(mockAnalysis, imageData);
            state.currentAnalysis = mockAnalysis;
            state.demoActive = false;
            
            trackEvent('demo_analysis_completed', {
                calories: mockAnalysis.nutrition.calories,
                cuisine: mockAnalysis.cultural.cuisine
            });
        }, 4000);
    }
    
    function generateMockAnalysis() {
        const analyses = [
            {
                nutrition: {
                    calories: 285,
                    protein: '12g',
                    carbs: '45g',
                    fat: '8g'
                },
                ingredients: [
                    'Basmati Rice', 'Turmeric', 'Cumin Seeds', 
                    'Onions', 'Garlic', 'Ginger', 'Ghee'
                ],
                cultural: {
                    cuisine: 'North Indian',
                    dish: 'Jeera Rice (Cumin Rice)',
                    region: 'Punjab/Rajasthan',
                    context: 'A simple yet flavorful rice dish, commonly served as a side with dal and vegetables. The aromatic cumin and turmeric give it its distinctive taste and golden color.'
                }
            },
            {
                nutrition: {
                    calories: 340,
                    protein: '18g',
                    carbs: '28g',
                    fat: '15g'
                },
                ingredients: [
                    'Lentils (Dal)', 'Tomatoes', 'Onions', 
                    'Garlic', 'Ginger', 'Coriander', 'Chili Powder'
                ],
                cultural: {
                    cuisine: 'South Indian',
                    dish: 'Sambar',
                    region: 'Tamil Nadu/Karnataka',
                    context: 'A nutritious lentil-based stew that is a staple in South Indian cuisine. Rich in protein and fiber, often served with rice or idli.'
                }
            },
            {
                nutrition: {
                    calories: 420,
                    protein: '22g',
                    carbs: '35g',
                    fat: '18g'
                },
                ingredients: [
                    'Chicken', 'Yogurt', 'Garam Masala', 
                    'Tomatoes', 'Onions', 'Ginger-Garlic Paste', 'Cilantro'
                ],
                cultural: {
                    cuisine: 'Mughlai',
                    dish: 'Chicken Curry',
                    region: 'Northern India',
                    context: 'A rich and creamy chicken curry with Mughlai influences. The yogurt marinade and aromatic spices create a complex, restaurant-quality flavor profile.'
                }
            }
        ];
        
        return analyses[Math.floor(Math.random() * analyses.length)];
    }
    
    function showResults(analysis, imageData) {
        const demoLoading = document.getElementById('demoLoading');
        const demoResults = document.getElementById('demoResults');
        
        if (demoLoading && demoResults) {
            demoLoading.style.display = 'none';
            demoResults.style.display = 'block';
            
            // Populate nutrition data
            document.getElementById('calories').textContent = analysis.nutrition.calories + ' kcal';
            document.getElementById('protein').textContent = analysis.nutrition.protein;
            document.getElementById('carbs').textContent = analysis.nutrition.carbs;
            document.getElementById('fat').textContent = analysis.nutrition.fat;
            
            // Populate ingredients
            const ingredientsList = document.getElementById('ingredientsList');
            ingredientsList.innerHTML = analysis.ingredients.map(ingredient => 
                `<div class="ingredient-tag">${ingredient}</div>`
            ).join('');
            
            // Populate cultural context
            const culturalContext = document.getElementById('culturalContext');
            culturalContext.innerHTML = `
                <div class="cultural-info">
                    <strong>${analysis.cultural.dish}</strong><br>
                    <em>${analysis.cultural.cuisine} • ${analysis.cultural.region}</em><br><br>
                    ${analysis.cultural.context}
                </div>
            `;
            
            // Smooth scroll to results
            setTimeout(() => {
                demoResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500);
        }
    }
    
    function resetDemo() {
        const demoUpload = document.getElementById('demoUpload');
        const demoResults = document.getElementById('demoResults');
        const demoLoading = document.getElementById('demoLoading');
        const fileInput = document.getElementById('fileInput');
        
        if (demoUpload && demoResults && demoLoading) {
            demoResults.style.display = 'none';
            demoLoading.style.display = 'none';
            demoUpload.style.display = 'block';
            
            if (fileInput) {
                fileInput.value = '';
            }
            
            state.demoActive = false;
            state.currentAnalysis = null;
            
            trackEvent('demo_reset');
        }
    }
    
    // Make resetDemo globally available
    window.resetDemo = resetDemo;
    
    // Sample analysis loader
    function loadSampleAnalysis(type) {
        if (state.demoActive) return;
        
        trackEvent('sample_analysis_clicked', { type: type });
        
        const sampleAnalyses = {
            curry: {
                nutrition: { calories: 380, protein: '25g', carbs: '18g', fat: '22g' },
                ingredients: ['Chicken', 'Coconut Milk', 'Curry Leaves', 'Mustard Seeds', 'Chilies', 'Turmeric'],
                cultural: {
                    cuisine: 'Kerala',
                    dish: 'Chicken Curry',
                    region: 'South India',
                    context: 'A traditional Kerala-style chicken curry with coconut milk base. The curry leaves and mustard seeds provide the authentic South Indian flavor profile.'
                }
            },
            biryani: {
                nutrition: { calories: 450, protein: '20g', carbs: '55g', fat: '16g' },
                ingredients: ['Basmati Rice', 'Mutton/Chicken', 'Saffron', 'Biryani Masala', 'Fried Onions', 'Mint'],
                cultural: {
                    cuisine: 'Hyderabadi',
                    dish: 'Chicken Biryani',
                    region: 'Hyderabad',
                    context: 'The crown jewel of Hyderabadi cuisine. This aromatic rice dish combines perfectly cooked meat with fragrant basmati rice, creating layers of flavor.'
                }
            },
            dal: {
                nutrition: { calories: 220, protein: '16g', carbs: '32g', fat: '6g' },
                ingredients: ['Yellow Lentils', 'Turmeric', 'Cumin', 'Mustard Seeds', 'Curry Leaves', 'Chilies'],
                cultural: {
                    cuisine: 'Pan-Indian',
                    dish: 'Dal Tadka',
                    region: 'All India',
                    context: 'A comforting lentil dish that is a staple across India. The tempering (tadka) of spices adds depth and aroma to this protein-rich meal.'
                }
            },
            samosa: {
                nutrition: { calories: 180, protein: '6g', carbs: '24g', fat: '8g' },
                ingredients: ['Wheat Flour', 'Potatoes', 'Peas', 'Cumin Seeds', 'Coriander Seeds', 'Garam Masala'],
                cultural: {
                    cuisine: 'North Indian',
                    dish: 'Aloo Samosa',
                    region: 'North India',
                    context: 'A beloved street food snack with spiced potato filling wrapped in crispy pastry. Perfect with mint chutney and tamarind sauce.'
                }
            }
        };
        
        const analysis = sampleAnalyses[type];
        if (analysis) {
            showLoading();
            setTimeout(() => {
                showResults(analysis);
                state.currentAnalysis = analysis;
                state.demoActive = false;
            }, 2500);
        }
    }
    
    // Make sample loader globally available
    window.loadSampleAnalysis = loadSampleAnalysis;
    
    function showError(message) {
        // Simple error display (you can enhance this)
        alert(message);
        trackEvent('demo_error', { message: message });
    }
    
    // Feature card interactions
    function initFeatureCards() {
        const featureCards = document.querySelectorAll('.feature-card');
        
        featureCards.forEach(card => {
            card.addEventListener('click', function() {
                const feature = this.getAttribute('data-feature');
                trackEvent('feature_card_clicked', { feature: feature });
            });
        });
    }
    
    // Testimonial interactions
    function initTestimonials() {
        const testimonials = document.querySelectorAll('.testimonial-card');
        
        testimonials.forEach(testimonial => {
            testimonial.addEventListener('click', function() {
                trackEvent('testimonial_clicked');
            });
        });
    }
    
    // CTA button tracking
    function initCTATracking() {
        const ctaButtons = document.querySelectorAll('.cta-button');
        
        ctaButtons.forEach(button => {
            button.addEventListener('click', function() {
                const buttonText = this.textContent.trim();
                const buttonClass = this.className;
                
                trackEvent('cta_button_clicked', { 
                    text: buttonText,
                    class: buttonClass,
                    location: getButtonLocation(this)
                });
            });
        });
    }
    
    function getButtonLocation(button) {
        const section = button.closest('section');
        if (section) {
            return section.className.split(' ')[0] || 'unknown';
        }
        return 'navigation';
    }
    
    // Page performance tracking
    function initPerformanceTracking() {
        // Track page load time
        window.addEventListener('load', function() {
            setTimeout(function() {
                const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                trackEvent('page_performance', {
                    load_time: loadTime,
                    dom_content_loaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
                });
            }, 100);
        });
        
        // Track scroll depth
        let maxScrollDepth = 0;
        window.addEventListener('scroll', function() {
            const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            if (scrollDepth > maxScrollDepth) {
                maxScrollDepth = scrollDepth;
                
                // Track at 25%, 50%, 75%, and 100%
                if ([25, 50, 75, 100].includes(scrollDepth)) {
                    trackEvent('scroll_depth', { depth: scrollDepth });
                }
            }
        });
        
        // Track time on page
        let startTime = Date.now();
        window.addEventListener('beforeunload', function() {
            const timeOnPage = Date.now() - startTime;
            trackEvent('time_on_page', { duration: timeOnPage });
        });
    }
    
    // Device and browser detection
    function trackDeviceInfo() {
        trackEvent('device_info', {
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            color_depth: screen.colorDepth,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
    }
    
    // Initialize all functionality when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🤖 Nutrichef AI Landing Page Loaded');
        
        // Initialize all modules
        initMobileMenu();
        initNavbarScroll();
        initScrollAnimations();
        initDemo();
        initFeatureCards();
        initTestimonials();
        initCTATracking();
        initPerformanceTracking();
        
        // Track initial page view
        trackEvent('page_view', {
            page_title: document.title,
            page_location: window.location.href,
            page_path: window.location.pathname
        });
        
        // Track device info
        trackDeviceInfo();
        
        // Add CSS styles for dynamically created elements
        const style = document.createElement('style');
        style.textContent = `
            .ingredient-tag {
                display: inline-block;
                background: var(--primary-orange);
                color: white;
                padding: 0.25rem 0.75rem;
                margin: 0.25rem;
                border-radius: 20px;
                font-size: 0.875rem;
                font-weight: 500;
            }
            
            .cultural-info {
                line-height: 1.6;
                color: var(--neutral-800);
            }
            
            .nav-menu.active {
                display: flex;
                flex-direction: column;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                padding: 1rem;
                gap: 1rem;
            }
            
            .mobile-menu-toggle.active span:nth-child(1) {
                transform: rotate(45deg) translate(5px, 5px);
            }
            
            .mobile-menu-toggle.active span:nth-child(2) {
                opacity: 0;
            }
            
            .mobile-menu-toggle.active span:nth-child(3) {
                transform: rotate(-45deg) translate(7px, -6px);
            }
            
            .navbar.scrolled {
                background: rgba(255, 255, 255, 0.98);
                box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .animate-in {
                animation: slideIn 0.6s ease-out;
            }
        `;
        document.head.appendChild(style);
    });
    
    // Export state for debugging (development only)
    if (typeof window !== 'undefined') {
        window.NutrichefAI = {
            state: state,
            trackEvent: trackEvent,
            resetDemo: resetDemo,
            loadSampleAnalysis: loadSampleAnalysis
        };
    }
    
})();