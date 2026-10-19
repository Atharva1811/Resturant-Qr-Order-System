/**
 * Centralized Branding Configuration for Servora
 * Allows instant customization of product name, tagline, branding metadata,
 * storage keys, and contact endpoints across the entire application.
 */

export const BRAND_CONFIG = {
  name: 'Servora',
  tagline: 'Restaurant ordering, simplified',
  shortName: 'Servora',
  legalName: 'Servora Technologies',
  title: 'Servora — Restaurant Ordering, Simplified',
  metaDescription: 'Modern QR-code restaurant ordering, kitchen display system, and multi-tenant management platform.',
  supportEmail: 'support@servora.app',
  defaultSenderEmail: 'orders@servora.app',
  defaultSenderName: 'Servora QR Ordering',
  
  // Client-side storage keys
  authTokenKey: 'servora_auth_token',
  customerSessionKey: 'servora_customer_session',
  cartKey: 'servora_cart',
  roleKey: 'servora_role',
  activeRestaurantSlugKey: 'servora_restaurant_slug',

  // Footers & powered-by badges
  poweredBy: 'Powered by Servora',
  copyright: `© ${new Date().getFullYear()} Servora. All rights reserved.`,
} as const;

export default BRAND_CONFIG;
