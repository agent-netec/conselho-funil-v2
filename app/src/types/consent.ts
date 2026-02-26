import { Timestamp } from 'firebase/firestore';

/**
 * Cookie consent categories for LGPD compliance.
 */
export interface CookieConsent {
  /** Essential cookies - always true, cannot be disabled */
  essential: true;
  /** Analytics cookies (PostHog) - requires opt-in */
  analytics: boolean;
  /** Marketing cookies (Meta Pixel, future) - requires opt-in */
  marketing: boolean;
  /** When the consent was given/updated */
  acceptedAt: Timestamp | Date;
  /** Version of the consent policy */
  version: string;
}

/**
 * Consent record stored in Firestore under users/{uid}/consent
 */
export interface ConsentRecord extends CookieConsent {
  id: string;
  userId: string;
}

/**
 * Local storage consent for non-logged users
 */
export interface LocalConsent {
  analytics: boolean;
  marketing: boolean;
  acceptedAt: string; // ISO string for localStorage
  version: string;
}

export const CONSENT_VERSION = '1.0.0';
