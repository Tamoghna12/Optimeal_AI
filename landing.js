// Nutrichef AI Landing Page JavaScript
// Interactive elements and analytics

(function() {
    'use strict';
    
    // Global state management
    const state = {
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
    window.scrollToFeatures = function() {
        smoothScrollTo('features', 80);
        trackEvent('cta_scroll_to_features');
    };
    
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
        console.log('🤖 NutriChef AI Landing Page Loaded');
        
        // Initialize all modules
        initMobileMenu();
        initNavbarScroll();
        initScrollAnimations();
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
    
    // Recipe Analyzer Functions
    window.analyzeRecipe = function() {
        const recipeInput = document.getElementById('recipeInput');
        const recipe = recipeInput.value.trim();
        
        if (!recipe) {
            alert('Please enter a recipe to analyze!');
            return;
        }
        
        trackEvent('recipe_analysis_started', { 
            recipe_length: recipe.length,
            has_ingredients: recipe.toLowerCase().includes('ingredients'),
            has_instructions: recipe.toLowerCase().includes('instructions')
        });
        
        showAnalyzerLoading();
        
        // Call secure backend API endpoint (no API keys exposed to frontend)
        callBackendRecipeAnalyzer(recipe)
            .then(analysis => {
                showAnalyzerResults(analysis);
            })
            .catch(error => {
                console.error('Recipe analysis failed:', error);
                alert('Recipe analysis temporarily unavailable. Please try again later.');
                hideAnalyzerLoading();
            });
    };
    
    window.loadSampleRecipe = function(type) {
        const recipes = {
            biryani: `Chicken Biryani
            
Ingredients:
- 2 cups basmati rice
- 1 lb chicken, cut into pieces
- 1 large onion, sliced
- 2 tbsp ghee
- 1 cup yogurt
- 2 tsp garam masala
- 1 tsp turmeric
- Salt to taste
- Saffron soaked in warm milk

Instructions:
1. Soak rice for 30 minutes
2. Marinate chicken with yogurt and spices for 1 hour
3. Fry onions until golden brown
4. Cook chicken until tender
5. Layer rice and chicken, cook for 45 minutes`,
            
            dal: `Yellow Dal Curry
            
Ingredients:
- 1 cup yellow lentils (moong dal)
- 2 cups water
- 1 onion, chopped
- 2 tomatoes, chopped
- 2 cloves garlic
- 1 inch ginger
- 1 tsp turmeric
- 1 tsp cumin seeds
- 2 tbsp oil
- Salt to taste
- Cilantro for garnish

Instructions:
1. Wash and boil lentils with turmeric
2. Heat oil, add cumin seeds
3. Add onions, cook until soft
4. Add garlic, ginger, tomatoes
5. Mix with cooked dal
6. Simmer for 15 minutes`,
            
            curry: `Chicken Curry
            
Ingredients:
- 1.5 lbs chicken, cut into pieces
- 2 onions, sliced
- 3 tomatoes, chopped
- 1 can coconut milk
- 2 tbsp curry powder
- 1 tbsp garam masala
- 1 tsp turmeric
- 2 tbsp vegetable oil
- 4 cloves garlic, minced
- 1 inch ginger, minced
- Salt and pepper to taste
- Fresh cilantro

Instructions:
1. Heat oil in large pot
2. Brown chicken pieces, remove and set aside
3. Sauté onions until golden
4. Add garlic, ginger, and spices
5. Add tomatoes and coconut milk
6. Return chicken to pot, simmer 25 minutes
7. Garnish with cilantro`
        };
        
        const recipeInput = document.getElementById('recipeInput');
        recipeInput.value = recipes[type] || '';
        
        trackEvent('sample_recipe_loaded', { type: type });
        
        // Auto-scroll to recipe input
        recipeInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    
    window.clearAnalysis = function() {
        const resultsSection = document.getElementById('analyzerResults');
        const inputSection = document.querySelector('.demo-input-section');
        const recipeInput = document.getElementById('recipeInput');
        
        resultsSection.style.display = 'none';
        inputSection.style.display = 'block';
        recipeInput.value = '';
        
        trackEvent('analysis_cleared');
    };
    
    window.showTab = function(tabName) {
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab content
        const selectedTab = document.getElementById(tabName + '-tab');
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Mark selected tab button as active
        const selectedBtn = document.querySelector(`[onclick="showTab('${tabName}')"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }
        
        trackEvent('analysis_tab_viewed', { tab: tabName });
    };
    
    function showAnalyzerLoading() {
        const inputSection = document.querySelector('.demo-input-section');
        const resultsSection = document.getElementById('analyzerResults');
        const loadingSection = document.getElementById('analyzerLoading');
        
        inputSection.style.display = 'none';
        resultsSection.style.display = 'none';
        loadingSection.style.display = 'block';
        
        // Animated loading steps
        const steps = [
            'Breaking down ingredients...',
            'Calculating nutritional values...',
            'Analyzing health impact...',
            'Generating modifications...',
            'Preparing cost analysis...',
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
        }, 500);
    }
    
    function showAnalyzerResults(analysis) {
        const loadingSection = document.getElementById('analyzerLoading');
        const resultsSection = document.getElementById('analyzerResults');
        
        loadingSection.style.display = 'none';
        resultsSection.style.display = 'block';
        
        // Populate nutrition facts
        document.getElementById('nutritionFacts').innerHTML = `
            <div class="nutrition-item">
                <span>Calories:</span>
                <span>${analysis.nutrition.calories} kcal</span>
            </div>
            <div class="nutrition-item">
                <span>Protein:</span>
                <span>${analysis.nutrition.protein}g</span>
            </div>
            <div class="nutrition-item">
                <span>Carbs:</span>
                <span>${analysis.nutrition.carbs}g</span>
            </div>
            <div class="nutrition-item">
                <span>Fat:</span>
                <span>${analysis.nutrition.fat}g</span>
            </div>
            <div class="nutrition-item">
                <span>Fiber:</span>
                <span>${analysis.nutrition.fiber}g</span>
            </div>
        `;
        
        // Populate macro breakdown
        document.getElementById('macroBreakdown').innerHTML = `
            <div class="macro-chart">
                <div class="macro-item">
                    <span class="macro-label">Protein</span>
                    <div class="macro-bar">
                        <div class="macro-fill" style="width: ${analysis.macros.protein}%; background-color: #FF6B35;"></div>
                    </div>
                    <span>${analysis.macros.protein}%</span>
                </div>
                <div class="macro-item">
                    <span class="macro-label">Carbs</span>
                    <div class="macro-bar">
                        <div class="macro-fill" style="width: ${analysis.macros.carbs}%; background-color: #F7931E;"></div>
                    </div>
                    <span>${analysis.macros.carbs}%</span>
                </div>
                <div class="macro-item">
                    <span class="macro-label">Fat</span>
                    <div class="macro-bar">
                        <div class="macro-fill" style="width: ${analysis.macros.fat}%; background-color: #FFD23F;"></div>
                    </div>
                    <span>${analysis.macros.fat}%</span>
                </div>
            </div>
        `;
        
        // Populate health impact
        document.getElementById('healthImpact').innerHTML = `
            <div class="health-conditions">
                ${analysis.health.conditions.map(condition => `
                    <div class="condition-item">
                        <span class="condition-icon">${condition.safe ? '✅' : '⚠️'}</span>
                        <div>
                            <strong>${condition.name}</strong>
                            <p>${condition.note}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Populate dietary warnings
        document.getElementById('dietaryWarnings').innerHTML = `
            <div class="warnings-list">
                ${analysis.health.warnings.map(warning => `
                    <div class="warning-item">
                        <span class="warning-icon">⚠️</span>
                        <span>${warning}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Populate modifications
        document.getElementById('modifications').innerHTML = `
            <div class="mod-list">
                ${analysis.modifications.map(mod => `
                    <div class="modification-item">
                        <h5>${mod.category}</h5>
                        <p>${mod.suggestion}</p>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Populate cost analysis
        document.getElementById('costAnalysis').innerHTML = `
            <div class="cost-items">
                <div class="cost-item">
                    <span>Total Cost:</span>
                    <span class="cost-value">$${analysis.budget.total}</span>
                </div>
                <div class="cost-item">
                    <span>Cost Per Serving:</span>
                    <span class="cost-value">$${analysis.budget.perServing}</span>
                </div>
                <div class="cost-item">
                    <span>Budget Category:</span>
                    <span class="budget-category ${analysis.budget.category.toLowerCase()}">${analysis.budget.category}</span>
                </div>
            </div>
        `;
        
        // Populate shopping list
        document.getElementById('shoppingList').innerHTML = `
            <div class="shopping-items">
                ${analysis.budget.ingredients.map(item => `
                    <div class="shopping-item">
                        <span>${item.name}</span>
                        <span class="item-cost">$${item.cost}</span>
                    </div>
                `).join('')}
            </div>
            <div class="delivery-note">
                <p>🚚 Available for delivery in 25-30 minutes</p>
            </div>
        `;
        
        // Smooth scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        trackEvent('recipe_analysis_completed', {
            calories: analysis.nutrition.calories,
            health_safe: analysis.health.conditions.filter(c => c.safe).length,
            total_cost: analysis.budget.total
        });
    }
    
    // Secure API call to your backend (keeps Groq API key private)
    async function callBackendRecipeAnalyzer(recipe) {
        try {
            const response = await fetch('/api/recipe-analyzer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ recipe: recipe })
            });
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Return the analysis object from the backend response
            if (data.success && data.analysis) {
                return data.analysis;
            } else {
                throw new Error('Invalid response format from backend');
            }
        } catch (error) {
            console.error('Backend API call failed, using demo data:', error);
            // Fallback to demo data for development/testing
            return generateMockAnalysis(recipe);
        }
    }
    
    function hideAnalyzerLoading() {
        const loadingSection = document.getElementById('analyzerLoading');
        const inputSection = document.querySelector('.demo-input-section');
        
        loadingSection.style.display = 'none';
        inputSection.style.display = 'block';
    }
    
    function generateMockAnalysis(recipe) {
        // Demo data for development - replace with real backend integration
        const analyses = [
            {
                nutrition: { calories: 420, protein: 25, carbs: 45, fat: 18, fiber: 8 },
                macros: { protein: 24, carbs: 43, fat: 33 },
                health: {
                    conditions: [
                        { name: 'PCOS', safe: false, note: 'High carb content may spike insulin' },
                        { name: 'Diabetes', safe: false, note: 'Monitor portion size due to rice content' },
                        { name: 'High Blood Pressure', safe: true, note: 'Low sodium, heart-healthy spices' }
                    ],
                    warnings: [
                        'High glycemic index from white rice',
                        'Contains dairy (yogurt) - may cause inflammation',
                        'High calorie density - watch portion sizes'
                    ]
                },
                modifications: [
                    { category: 'PCOS-Friendly', suggestion: 'Replace white rice with cauliflower rice, add more vegetables' },
                    { category: 'Diabetes-Friendly', suggestion: 'Use brown rice, reduce portion size, add fiber-rich vegetables' },
                    { category: 'Heart-Healthy', suggestion: 'Reduce ghee, use lean chicken breast, add turmeric' }
                ],
                budget: {
                    total: 18.50,
                    perServing: 4.63,
                    category: 'Moderate',
                    ingredients: [
                        { name: 'Basmati Rice (2 cups)', cost: 3.50 },
                        { name: 'Chicken (1 lb)', cost: 6.99 },
                        { name: 'Yogurt', cost: 2.49 },
                        { name: 'Spices & Aromatics', cost: 5.52 }
                    ]
                }
            },
            {
                nutrition: { calories: 280, protein: 18, carbs: 35, fat: 8, fiber: 12 },
                macros: { protein: 26, carbs: 50, fat: 24 },
                health: {
                    conditions: [
                        { name: 'PCOS', safe: true, note: 'High fiber and protein help stabilize blood sugar' },
                        { name: 'Diabetes', safe: true, note: 'Low glycemic index, good protein content' },
                        { name: 'High Blood Pressure', safe: true, note: 'Low sodium, potassium-rich lentils' }
                    ],
                    warnings: [
                        'May cause bloating in some people due to fiber content'
                    ]
                },
                modifications: [
                    { category: 'PCOS-Friendly', suggestion: 'Perfect as is! Add more turmeric for anti-inflammatory benefits' },
                    { category: 'Weight Loss', suggestion: 'Add vegetables like spinach or bottle gourd for volume' },
                    { category: 'Protein Boost', suggestion: 'Serve with a side of Greek yogurt or paneer' }
                ],
                budget: {
                    total: 8.75,
                    perServing: 2.19,
                    category: 'Budget',
                    ingredients: [
                        { name: 'Yellow Lentils (1 cup)', cost: 1.99 },
                        { name: 'Vegetables & Aromatics', cost: 4.26 },
                        { name: 'Spices & Oil', cost: 2.50 }
                    ]
                }
            }
        ];
        
        return analyses[Math.floor(Math.random() * analyses.length)];
    }
    
    // Export state for debugging (development only)
    if (typeof window !== 'undefined') {
        window.NutriChefAI = {
            state: state,
            trackEvent: trackEvent,
            scrollToFeatures: scrollToFeatures,
            scrollToDemo: scrollToDemo,
            analyzeRecipe: analyzeRecipe,
            loadSampleRecipe: loadSampleRecipe
        };
    }
    
})();