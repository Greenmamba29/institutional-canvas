/**
 * Authentication Configuration
 * 
 * Centralized configuration for auth redirects and URLs.
 * Ensures production URLs are used correctly for all auth flows.
 */

export const AUTH_CONFIG = {
  siteUrl: 'https://www.lithiumbuy.com',
  
  redirectUrls: {
    afterSignIn: '/dashboard',
    afterSignUp: '/onboarding',
    afterPasswordReset: '/auth',
    authCallback: '/auth/callback',
  },
  
  /**
   * Get the appropriate redirect URL based on environment
   * Uses production URL in production, current origin in development
   */
  getRedirectUrl: (path: string): string => {
    const baseUrl = import.meta.env.PROD 
      ? 'https://www.lithiumbuy.com'
      : window.location.origin;
    return `${baseUrl}${path}`;
  },
};
