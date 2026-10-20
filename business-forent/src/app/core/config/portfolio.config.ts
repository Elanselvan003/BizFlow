import { PortfolioConfig } from '../models/portfolio.models';

/**
 * ==============================================================================
 * PORTFOLIO CONFIGURATION - EDITABLE PLACEHOLDERS
 * ==============================================================================
 * All personal details, contact info, pricing packages, and services are defined
 * here. Update these values to personalize your portfolio.
 */
export const PORTFOLIO_CONFIG: PortfolioConfig = {
  brand: {
    siteTitle: 'Selvan Webworks | Professional Websites for Growing Businesses',
    logoText: 'Selvan Webworks',
    logoSubtext: 'Web Development Studio',
    tagline: 'Professional Websites for Growing Businesses.',
  },

  developer: {
    name: 'Elanselvan',
    title: 'Founder & Lead Web Developer',
    location: 'Bengaluru, Karnataka, India',
    cityArea: 'Koramangala / Indiranagar / Remote across Bengaluru',
    availabilityStatus: 'Available for freelance projects',
    experienceHeadline: 'Experienced frontend developer focused on clean code, fast loading speeds, and responsive design.',
    bioParagraphs: [
      'I am an Angular and TypeScript frontend developer based in Bengaluru with experience building responsive, accessible web interfaces. At Selvan Webworks, I help local business owners, consultants, and service providers establish an authoritative and reliable online presence.',
      'Unlike bloated website builders with slow loading speeds and ongoing plugin failures, I build lightweight, clean web pages that load quickly on mobile devices and make it easy for your customers to enquire via phone, email, or WhatsApp.',
      'I believe in transparent communication, realistic timelines, and honest guidance. All project demonstrations featured here are functional concept builds so you can test how your website will look and work before starting.'
    ],
    technicalSkills: [
      {
        category: 'Frontend & UI',
        skills: ['Angular', 'TypeScript', 'JavaScript (ES6+)', 'HTML5 & Semantic Markup', 'SCSS / CSS3', 'Responsive Web Design']
      },
      {
        category: 'Performance & Usability',
        skills: ['Mobile-First Optimization', 'Web Accessibility (a11y)', 'Core Web Vitals', 'Cross-Browser Compatibility']
      },
      {
        category: 'Integration & Tooling',
        skills: ['WhatsApp Direct Connect', 'REST APIs', 'Git & GitHub', 'Clean Component Architecture']
      }
    ],
    contact: {
      email: 'ktworkselvan@gmail.com',
      phoneFormatted: '+91 86105 85062',
      whatsappNumber: '918610585062',
      whatsappDisplay: '+91 86105 85062',
      officeHours: 'All Days',
    }
  },

  hero: {
    headline: 'Websites That Help Small Businesses Grow Online',
    supportingText: 'I build clean, responsive websites for small businesses, independent professionals, and service providers. Get a professional online presence with a simple way for customers to contact you.',
    primaryCtaText: 'Discuss Your Website',
    secondaryCtaText: 'View My Work',
    availabilityBadge: 'Available for freelance projects'
  },

  services: [
    {
      id: 'business-website',
      title: 'Business Website Development',
      shortDescription: 'Professional pages for local businesses that need credibility and customer enquiries.',
      detailedPoints: [
        'Custom mobile-first layouts designed for local businesses in Bengaluru.',
        'Clear showcase of your services, operating hours, and location.',
        'One-tap WhatsApp enquiry and phone call buttons for mobile visitors.',
        'Fast loading speeds with clean, semantic markup.'
      ],
      icon: 'business',
      badge: 'Most Popular'
    },
    {
      id: 'landing-pages',
      title: 'Landing Pages',
      shortDescription: 'Focused single pages for specific campaigns, events, or product launches.',
      detailedPoints: [
        'Single-minded layout centered on converting visitors into enquiries.',
        'High-contrast call-to-action buttons for WhatsApp or phone contact.',
        'Structured value propositions, package breakdowns, and FAQs.',
        'Optimized for mobile ad traffic and social media promotions.'
      ],
      icon: 'landing',
      badge: 'High Conversion'
    },
    {
      id: 'website-redesign',
      title: 'Website Redesign',
      shortDescription: 'Modernize an outdated, slow, or difficult-to-navigate existing website.',
      detailedPoints: [
        'Fix mobile layout issues, horizontal scrolling, and unreadable text.',
        'Improve page speed and visual hierarchy with clean modern styling.',
        'Streamline enquiry forms so visitors do not bounce.',
        'Retain your existing domain and business branding.'
      ],
      icon: 'refresh'
    },
    {
      id: 'website-maintenance',
      title: 'Website Maintenance',
      shortDescription: 'Routine frontend updates, text changes, UI fixes, and ongoing care.',
      detailedPoints: [
        'Timely updates to prices, service menus, seasonal offers, and contact info.',
        'Frontend bug fixes and browser compatibility testing.',
        'Regular link checking and image optimization.',
        'Clear, agreed scope per month with direct developer support.'
      ],
      icon: 'maintenance'
    }
  ],

  demoProjects: [
    {
      id: 'lifestyle-coach',
      slug: 'lifestyle-coach',
      title: 'Aura Lifestyle & Wellness Coaching',
      category: 'Independent Professional',
      tagline: 'Modern, calm aesthetic designed for coaches, consultants, and therapists.',
      description: 'A concept website tailored for a personal wellness coach in Bengaluru. Features coach introduction, coaching programmes, session breakdown, clear package pricing, and immediate WhatsApp enquiry CTAs.',
      features: [
        'Coach bio & philosophical approach',
        '3 signature 1-on-1 coaching programmes',
        'Weekly routine schedule breakdown',
        'Direct WhatsApp session booking CTA'
      ],
      ctaLabel: 'View Coach Demo',
      previewRoute: '/projects/lifestyle-coach',
      badge: 'Concept Design',
      primaryColor: '#0d9488',
      accentBg: '#f0fdfa'
    },
    {
      id: 'salon',
      slug: 'salon',
      title: 'Luxe Cut & Style Studio',
      category: 'Local Service & Retail',
      tagline: 'Sleek, elegant storefront for beauty salons, spas, and barbers.',
      description: 'A mobile-friendly concept site showcasing salon services, transparent haircut/colour price lists, photo showcase gallery, operating timings, and appointment request buttons.',
      features: [
        'Categorized beauty & haircut menu',
        'Transparent sample price card',
        'Studio gallery & customer experience view',
        'One-tap appointment booking via WhatsApp'
      ],
      ctaLabel: 'View Salon Demo',
      previewRoute: '/projects/salon',
      badge: 'Demo Project',
      primaryColor: '#b45309',
      accentBg: '#fffbeb'
    },
    {
      id: 'fitness-trainer',
      slug: 'fitness-trainer',
      title: 'IronCore Strength & Fitness',
      category: 'Fitness & Sports',
      tagline: 'High-energy, focused website for personal trainers & fitness studios.',
      description: 'A concept website built for personal fitness coaches and gym trainers. Features trainer qualifications, monthly transformation packages, class schedules, and a free trial workout reservation form.',
      features: [
        'Trainer profile & training philosophy',
        'Monthly & quarterly training tiers',
        'Class schedule & training formats',
        'Trial session reservation CTA'
      ],
      ctaLabel: 'View Fitness Demo',
      previewRoute: '/projects/fitness-trainer',
      badge: 'Concept Design',
      primaryColor: '#1d4ed8',
      accentBg: '#eff6ff'
    }
  ],

  pricing: {
    packages: [
      {
        id: 'starter',
        name: 'Starter Website',
        priceDisplay: '₹3,999',
        priceNumeric: 3999,
        cadence: 'one-time',
        idealFor: 'Small businesses, freelancers, and local service providers needing a clean digital card.',
        deliverables: [
          '1-page responsive modern website',
          'About business & service showcase',
          'Direct WhatsApp & phone call CTA',
          'Google Maps location embed',
          'Fast mobile loading performance',
          '1 agreed revision round included'
        ],
        revisionRounds: '1 agreed revision round',
        ctaText: 'Choose Starter'
      },
      {
        id: 'business',
        name: 'Business Website',
        priceDisplay: '₹7,999',
        priceNumeric: 7999,
        cadence: 'one-time',
        popular: true,
        idealFor: 'Growing local businesses that need comprehensive service pages and clear brand authority.',
        deliverables: [
          'Up to 5 custom responsive pages',
          'Home, Services, About, Pricing/Gallery, Contact',
          'Interactive enquiry form + WhatsApp routing',
          'Basic on-page SEO setup (meta tags, titles)',
          'Social media & Google Business links',
          '2 agreed revision rounds included'
        ],
        revisionRounds: '2 agreed revision rounds',
        ctaText: 'Choose Business'
      },
      {
        id: 'care',
        name: 'Website Care',
        priceDisplay: '₹999',
        priceNumeric: 999,
        cadence: '/month',
        idealFor: 'Business owners who want worry-free maintenance, price changes, and technical support.',
        deliverables: [
          'Agreed small content & text updates',
          'Menu / price updates twice a month',
          'Minor UI adjustments & mobile bug fixes',
          'Routine frontend health checks',
          'Direct developer support over WhatsApp',
          'Maintenance within defined monthly scope'
        ],
        revisionRounds: 'Ongoing monthly care',
        ctaText: 'Inquire About Care'
      }
    ],
    disclaimer: 'Note: Prices listed are introductory indicative estimates for development and frontend design. Exact quotes are confirmed after reviewing your specific requirements and content readiness. Third-party costs such as custom domain registration, web hosting plans, and paid third-party APIs/services are separate and billed directly to the client unless explicitly bundled in our written agreement.'
  }
};
