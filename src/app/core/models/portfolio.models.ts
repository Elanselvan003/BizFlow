export interface ServiceItem {
  id: string;
  title: string;
  shortDescription: string;
  detailedPoints: string[];
  icon: string;
  badge?: string;
}

export interface DemoProject {
  id: string;
  slug: string;
  title: string;
  category: string;
  tagline: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaActionUrl?: string;
  previewRoute: string;
  badge: 'Demo Project' | 'Concept Design';
  primaryColor: string;
  accentBg: string;
}

export interface PricingPackage {
  id: string;
  name: string;
  priceDisplay: string;
  priceNumeric: number;
  cadence?: string;
  popular?: boolean;
  idealFor: string;
  deliverables: string[];
  revisionRounds: string;
  ctaText: string;
}

export interface DeveloperProfile {
  name: string;
  title: string;
  location: string;
  cityArea: string;
  availabilityStatus: string;
  experienceHeadline: string;
  bioParagraphs: string[];
  technicalSkills: {
    category: string;
    skills: string[];
  }[];
  contact: {
    email: string;
    phoneFormatted: string;
    whatsappNumber: string; // international digits only, e.g. "919876543210"
    whatsappDisplay: string;
    officeHours: string;
  };
}

export interface PortfolioConfig {
  developer: DeveloperProfile;
  brand: {
    siteTitle: string;
    logoText: string;
    logoSubtext: string;
    tagline: string;
  };
  hero: {
    headline: string;
    supportingText: string;
    primaryCtaText: string;
    secondaryCtaText: string;
    availabilityBadge: string;
  };
  services: ServiceItem[];
  demoProjects: DemoProject[];
  pricing: {
    packages: PricingPackage[];
    disclaimer: string;
  };
}
