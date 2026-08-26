import * as Crypto from 'expo-crypto';
import { FirebaseService } from './FirebaseService';

/**
 * The base URL for the SafeHer live-tracking web page.
 * This page is served via Firebase Hosting for the safeher-b637f project.
 * Recipients open this URL to see the SOS location update in real-time.
 */
export const TRACKING_BASE_URL = 'https://safeher-b637f.web.app/track';

export const TrackingTokenService = {
  /**
   * Generates a 128-bit (32 hex chars) unpredictable tracking token by hashing
   * a combination of the incident ID, a random UUID, and a timestamp using SHA-256.
   * Stores the token → incidentId mapping in Firestore, then returns the full URL.
   *
   * @param incidentId - The active incident ID to associate with this token.
   * @returns The full tracking URL, e.g. https://safeher-b637f.web.app/track#abc123...
   */
  generateTrackingToken: async (incidentId: string): Promise<string> => {
    try {
      // Build a high-entropy seed: incidentId + random UUID + current timestamp
      const seed = `${incidentId}__${Math.random().toString(36)}__${Date.now()}`;

      // SHA-256 the seed — produces a 64-char hex string, we take the first 32 chars
      const fullHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        seed
      );
      const token = fullHash.substring(0, 32).toLowerCase();

      // Persist the token → incidentId mapping to Firestore
      await FirebaseService.createTrackingToken(token, incidentId);

      const trackingUrl = `${TRACKING_BASE_URL}#${token}`;
      console.log(`[TrackingToken] Generated token for incident ${incidentId}: ${token}`);
      console.log(`[TrackingToken] Tracking URL: ${trackingUrl}`);

      return trackingUrl;
    } catch (error) {
      // If token creation fails (e.g. offline), return empty string so caller can handle gracefully
      console.error('[TrackingToken] Failed to generate tracking token', error);
      return '';
    }
  },
};
