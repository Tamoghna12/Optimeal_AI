You are a senior front-end developer. Build a fully responsive single-page landing site for "OptiMeal AI" — an AI-powered UK meal planning and grocery budgeting app.

Goals:

- Maximise early access sign-ups
- Clearly communicate the value proposition
- Be mobile-first, fast-loading, and visually appealing
- Include analytics tracking to measure user intent and feature interest

Tech stack:

- HTML5
- CSS3 (Flexbox/Grid, mobile-first)
- Vanilla JavaScript for interactivity (smooth scroll, form validation, analytics events)
- No external frameworks (keep it lightweight)
- Use semantic HTML



## **Visual Identity Ideas**

* **Logo concept:** A stylised plate or bowl with a subtle AI circuit pattern forming the rim, in green and warm neutral tones.
* **Colour palette:**
  * Primary: Fresh green (#4CAF50) for health & freshness
  * Secondary: Warm beige (#F5F5F5) for approachability
  * Accent: Deep grey (#333333) for trust & clarity
* **Typography:** Rounded sans‑serif like *Poppins* or *Inter* for a modern, friendly feel

Design guidelines:

- Clean, modern UK-friendly palette: greens (#4CAF50), warm neutrals (#F5F5F5), dark grey text (#333)
- Plenty of whitespace
- Rounded buttons, subtle shadows
- Google Font: "Inter" or "Poppins"

Page structure & content:

1. **Hero Section**

   - Full-width background image or gradient
   - Headline: “Eat Smarter. Spend Less. Live Healthier.”
   - Subheadline: “AI-powered meal planning + grocery price comparison for UK households.”
   - Primary CTA button: “Join the Waitlist” (scrolls to sign-up form)
   - Mockup image of the app (placeholder)
   - Track clicks on the CTA button as `event: "cta_click_hero"`
2. **Problem Statement**

   - 3 bullet points with icons:
     • Struggling to plan healthy meals?
     • Overspending on groceries without realising?
     • Tired of juggling multiple apps for recipes, budgeting, and shopping?
   - Track scroll into this section as `event: "view_problem_section"`
3. **Solution Overview**

   - 4 icon + text blocks in a responsive grid:
     • Plan: Personalised, health-aligned meal plans
     • Save: Weekly & monthly grocery budgeting
     • Compare: Prices across Sainsbury’s, Tesco, Asda, Lidl, Aldi
     • Optimise: Best store choice for time + money
   - Track clicks on each feature as `event: "feature_interest_[feature_name]"`
4. **Core Features**

   - Responsive 2x3 grid with feature cards:
     - AI Meal Planning (image placeholder)
     - Budget Tracking (graph placeholder)
     - Price Comparison Table (table placeholder)
     - Optimisation Engine (map placeholder)
     - Rewards System (points dashboard placeholder)
   - Track hover or click on each card as `event: "feature_card_[feature_name]"`
5. **How It Works**

   - 3-step horizontal layout (stacked on mobile):
     1. Tell us your goals
     2. Get your plan
     3. Save & stay on track
   - Track scroll into this section as `event: "view_how_it_works"`
6. **Benefits & Outcomes**

   - 4 benefit cards with icons:
     - Save up to £X/month
     - Reduce meal planning time by Y%
     - Eat healthier with condition-specific plans
     - Stay motivated with rewards
   - Track clicks on benefit cards as `event: "benefit_interest_[benefit_name]"`
7. **Social Proof / Credibility**

   - Founder bio: “Created by a PhD researcher in bioinformatics & AI product builder”
   - Placeholder for testimonials or “As seen in” logos
   - Track scroll into this section as `event: "view_social_proof"`
8. **Call to Action**

   - Email capture form:
     - Name
     - Email
     - Dropdown: “What’s your biggest food/grocery challenge?”
     - Submit button: “Join the Waitlist”
   - JS form validation (required fields, email format)
   - On submit, send form data to a placeholder endpoint and trigger `event: "form_submit"`
9. **FAQ**

   - Accordion-style Q&A (JS toggle)
   - Track open/close of each FAQ as `event: "faq_toggle_[faq_id]"`
10. **Final CTA**

    - Repeat sign-up form with urgency: “Be one of the first 500 to get early access.”
    - Track clicks as `event: "cta_click_final"`

Footer:

- Links: Privacy Policy, Terms, Contact
- Social media icons (placeholders)

Analytics requirements:

- Include Google Analytics 4 snippet (placeholder measurement ID)
- Include a simple `trackEvent(eventName)` JS function that logs to console and sends to GA4
- Fire events on all key interactions listed above

Responsive breakpoints:

- Mobile (<768px), tablet (768–1024px), desktop (>1024px)

Accessibility:

- Alt text for images
- Proper heading hierarchy
- High contrast for text

Output:

- Provide complete HTML, CSS, and JS in separate code blocks
- Include placeholder images and icons (use unsplash.it or similar)
- Comment code for clarity

You are a senior front-end developer. Build a fully responsive single-page landing site for "Homeland Meals" — an AI-powered UK meal planning and grocery budgeting app.

Goals:

- Maximise early access sign-ups
- Clearly communicate the value proposition
- Be mobile-first, fast-loading, and visually appealing
- Include analytics tracking to measure user intent and feature interest

Tech stack:

- HTML5
- CSS3 (Flexbox/Grid, mobile-first)
- Vanilla JavaScript for interactivity (smooth scroll, form validation, analytics events)
- No external frameworks (keep it lightweight)
- Use semantic HTML

Design guidelines:

- Clean, modern UK-friendly palette: greens (#4CAF50), warm neutrals (#F5F5F5), dark grey text (#333)
- Plenty of whitespace
- Rounded buttons, subtle shadows
- Google Font: "Inter" or "Poppins"

Page structure & content:

1. **Hero Section**

   - Full-width background image or gradient
   - Headline: “Eat Smarter. Spend Less. Live Healthier.”
   - Subheadline: “AI-powered meal planning + grocery price comparison for UK households.”
   - Primary CTA button: “Join the Waitlist” (scrolls to sign-up form)
   - Mockup image of the app (placeholder)
   - Track clicks on the CTA button as `event: "cta_click_hero"`
2. **Problem Statement**

   - 3 bullet points with icons:
     • Struggling to plan healthy meals?
     • Overspending on groceries without realising?
     • Tired of juggling multiple apps for recipes, budgeting, and shopping?
   - Track scroll into this section as `event: "view_problem_section"`
3. **Solution Overview**

   - 4 icon + text blocks in a responsive grid:
     • Plan: Personalised, health-aligned meal plans
     • Save: Weekly & monthly grocery budgeting
     • Compare: Prices across Sainsbury’s, Tesco, Asda, Lidl, Aldi
     • Optimise: Best store choice for time + money
   - Track clicks on each feature as `event: "feature_interest_[feature_name]"`
4. **Core Features**

   - Responsive 2x3 grid with feature cards:
     - AI Meal Planning (image placeholder)
     - Budget Tracking (graph placeholder)
     - Price Comparison Table (table placeholder)
     - Optimisation Engine (map placeholder)
     - Rewards System (points dashboard placeholder)
   - Track hover or click on each card as `event: "feature_card_[feature_name]"`
5. **How It Works**

   - 3-step horizontal layout (stacked on mobile):
     1. Tell us your goals
     2. Get your plan
     3. Save & stay on track
   - Track scroll into this section as `event: "view_how_it_works"`
6. **Benefits & Outcomes**

   - 4 benefit cards with icons:
     - Save up to £X/month
     - Reduce meal planning time by Y%
     - Eat healthier with condition-specific plans
     - Stay motivated with rewards
   - Track clicks on benefit cards as `event: "benefit_interest_[benefit_name]"`
7. **Social Proof / Credibility**

   - Founder bio: “Created by a PhD researcher in bioinformatics & AI product builder”
   - Placeholder for testimonials or “As seen in” logos
   - Track scroll into this section as `event: "view_social_proof"`
8. **Call to Action**

   - Email capture form:
     - Name
     - Email
     - Dropdown: “What’s your biggest food/grocery challenge?”
     - Submit button: “Join the Waitlist”
   - JS form validation (required fields, email format)
   - On submit, send form data to a placeholder endpoint and trigger `event: "form_submit"`
9. **FAQ**

   - Accordion-style Q&A (JS toggle)
   - Track open/close of each FAQ as `event: "faq_toggle_[faq_id]"`
10. **Final CTA**

    - Repeat sign-up form with urgency: “Be one of the first 500 to get early access.”
    - Track clicks as `event: "cta_click_final"`

Footer:

- Links: Privacy Policy, Terms, Contact
- Social media icons (placeholders)

Analytics requirements:

- Include Google Analytics 4 snippet (placeholder measurement ID)
- Include a simple `trackEvent(eventName)` JS function that logs to console and sends to GA4
- Fire events on all key interactions listed above

Responsive breakpoints:

- Mobile (<768px), tablet (768–1024px), desktop (>1024px)

Accessibility:

- Alt text for images
- Proper heading hierarchy
- High contrast for text

Output:

- Provide complete HTML, CSS, and JS in separate code blocks
- Include placeholder images and icons (use unsplash.it or similar)
- Comment code for clarity
