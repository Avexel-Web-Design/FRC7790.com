/**
 * SEO utility functions for dynamic meta tag management
 */

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
}

/**
 * Updates the document meta tags for SEO
 * @param config - SEO configuration object
 */
export function updateSEO(config: SEOConfig): void {
  // Update title
  if (config.title) {
    document.title = config.title;
    updateMetaTag('og:title', config.title);
    updateMetaTag('twitter:title', config.title);
  }

  // Update description
  if (config.description) {
    updateMetaTag('description', config.description);
    updateMetaTag('og:description', config.description);
    updateMetaTag('twitter:description', config.description);
  }

  // Update keywords
  if (config.keywords) {
    updateMetaTag('keywords', config.keywords);
  }

  // Update canonical URL
  if (config.canonical) {
    updateLinkTag('canonical', config.canonical);
    updateMetaTag('og:url', config.canonical);
  }

  // Update Open Graph image
  if (config.ogImage) {
    updateMetaTag('og:image', config.ogImage);
    updateMetaTag('twitter:image', config.ogImage);
  }

  // Update Open Graph type
  if (config.ogType) {
    updateMetaTag('og:type', config.ogType);
  }
}

/**
 * Helper function to update or create meta tags
 */
function updateMetaTag(name: string, content: string): void {
  const isProperty = name.startsWith('og:') || name.startsWith('twitter:');
  const attribute = isProperty ? 'property' : 'name';
  
  let element = document.querySelector(
    `meta[${attribute}="${name}"]`
  ) as HTMLMetaElement;

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }

  element.content = content;
}

/**
 * Helper function to update or create link tags
 */
function updateLinkTag(rel: string, href: string): void {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;

  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.appendChild(element);
  }

  element.href = href;
}

/**
 * Default SEO configurations for different pages
 */
export const SEO_CONFIGS = {
  home: {
    title: 'Team 7790 Baywatch Robotics - Harbor Springs FIRST Robotics | 2025 Traverse City Champions',
    description: 'Team 7790 Baywatch Robotics - 2025 Traverse City Event Champions from Harbor Springs High School, Michigan. Award-winning FIRST Robotics Competition team with 19 events, 9 awards, and 1 Championship trip.',
    keywords: 'Team 7790, Baywatch Robotics, FRC 7790, FIRST Robotics Competition, Harbor Springs High School robotics, Michigan FRC team, Traverse City Champions 2025',
    canonical: 'https://www.frc7790.com/',
  },
  robots: {
    title: 'Our Robots - Team 7790 Baywatch Robotics | FIRST Robotics Competition',
    description: 'Explore the innovative robots built by Team 7790 Baywatch Robotics. From Riptide to Cobalt, see our award-winning FRC competition robots and their achievements.',
    keywords: 'FRC robots, Team 7790 robots, Baywatch Robotics competition robots, FIRST Robotics robots, FRC robot designs',
    canonical: 'https://www.frc7790.com/robots',
  },
  sponsors: {
    title: 'Our Sponsors - Team 7790 Baywatch Robotics | Supporting STEM Education',
    description: 'Meet the amazing sponsors supporting Team 7790 Baywatch Robotics. Our community partners help make STEM education and robotics competition possible in Harbor Springs, Michigan.',
    keywords: 'FRC sponsors, Team 7790 sponsors, robotics team sponsors, STEM education sponsors, Harbor Springs sponsors',
    canonical: 'https://www.frc7790.com/sponsors',
  },
  schedule: {
    title: 'Competition Schedule - Team 7790 Baywatch Robotics | FRC Events 2025',
    description: 'View Team 7790 Baywatch Robotics competition schedule, upcoming FRC events, match times, and event results for the 2025 FIRST Robotics Competition season.',
    keywords: 'FRC schedule, Team 7790 schedule, FIRST Robotics events, FRC competition schedule, robotics tournament schedule',
    canonical: 'https://www.frc7790.com/schedule',
  },
  scouting: {
    title: 'Scouting System - Team 7790 Baywatch Robotics | FRC Alliance Selection',
    description: 'Advanced scouting system for FIRST Robotics Competition. Team 7790 Baywatch Robotics uses data-driven analysis for strategic alliance selection and match preparation.',
    keywords: 'FRC scouting, robotics scouting system, alliance selection, FRC data analysis, Team 7790 scouting',
    canonical: 'https://www.frc7790.com/scouting',
  },
  ftc: {
    title: 'FTC Team - Baywatch Robotics | FIRST Tech Challenge Harbor Springs',
    description: 'Learn about Team 7790\'s FIRST Tech Challenge (FTC) program. Building the next generation of robotics competitors in Harbor Springs, Michigan.',
    keywords: 'FTC, FIRST Tech Challenge, Team 7790 FTC, Harbor Springs FTC, Michigan FTC team',
    canonical: 'https://www.frc7790.com/ftc',
  },
  becomeASponsor: {
    title: 'Become a Sponsor - Team 7790 Baywatch Robotics | Support STEM Education',
    description: 'Support Team 7790 Baywatch Robotics and invest in STEM education in Harbor Springs, Michigan. Learn about sponsorship opportunities and benefits.',
    keywords: 'sponsor robotics team, FRC sponsorship, support STEM education, Team 7790 sponsors, robotics team funding',
    canonical: 'https://www.frc7790.com/become-a-sponsor',
  },
} as const;

/**
 * Generate structured data for events
 */
export function generateEventSchema(eventData: {
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: eventData.name,
    startDate: eventData.startDate,
    endDate: eventData.endDate,
    location: {
      '@type': 'Place',
      name: eventData.location,
    },
    description: eventData.description,
    organizer: {
      '@type': 'Organization',
      name: 'Baywatch Robotics',
      url: 'https://www.frc7790.com',
    },
    performer: {
      '@type': 'SportsTeam',
      name: 'Team 7790 Baywatch Robotics',
    },
  };
}
