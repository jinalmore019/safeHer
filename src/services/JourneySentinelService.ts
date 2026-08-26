import { LocationSnapshot } from '../types/models';
import { LocationService } from './LocationService';

export type JourneyStatus = 
  | 'SAFE' 
  | 'CHECK_IN_REQUIRED' 
  | 'ROUTE_DEVIATION' 
  | 'UNEXPECTED_STOP' 
  | 'ESCALATING' 
  | 'COMPLETED';

export interface JourneySettings {
  enabled: boolean;
  checkInIntervalMinutes: number;
  deviationThresholdMeters: number;
  stopThresholdMinutes: number;
}

export class JourneySentinelService {
  private static isActive = false;
  private static status: JourneyStatus = 'SAFE';
  private static destination: { latitude: number, longitude: number } | null = null;
  private static startTime = 0;
  private static lastLocation: LocationSnapshot | null = null;
  private static lastLocationTime = 0;
  private static lastCheckInTime = 0;
  private static locationInterval: any = null;
  
  static settings: JourneySettings = {
    enabled: true,
    checkInIntervalMinutes: 10,
    deviationThresholdMeters: 500,
    stopThresholdMinutes: 5,
  };

  static onStatusChange: ((status: JourneyStatus) => void) | null = null;
  static onCheckInRequested: (() => void) | null = null;
  static onSOSEscalation: (() => void) | null = null;

  static async startJourney(dest: { latitude: number, longitude: number }) {
    this.isActive = true;
    this.destination = dest;
    this.status = 'SAFE';
    this.startTime = Date.now();
    this.lastCheckInTime = Date.now();
    
    // Start periodic tracking
    this.locationInterval = setInterval(async () => {
      await this.evaluateJourney();
    }, 15000); // Check every 15 seconds for demo purposes
    
    if (this.onStatusChange) this.onStatusChange(this.status);
  }

  static async endJourney() {
    this.isActive = false;
    this.status = 'COMPLETED';
    this.destination = null;
    if (this.locationInterval) clearInterval(this.locationInterval);
    if (this.onStatusChange) this.onStatusChange(this.status);
  }

  static isJourneyActive() { return this.isActive; }
  static getStatus() { return this.status; }
  static getStartTime() { return this.startTime; }
  static getLastLocation() { return this.lastLocation; }

  static async checkIn() {
    this.lastCheckInTime = Date.now();
    this.updateStatus('SAFE');
  }

  private static updateStatus(newStatus: JourneyStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      console.log(`[JourneySentinel] Status changed to ${newStatus}`);
      if (this.onStatusChange) this.onStatusChange(newStatus);
    }
  }

  private static async evaluateJourney() {
    if (!this.isActive) return;

    const loc = await LocationService.getCurrentLocation();
    if (!loc) return;

    const now = Date.now();
    
    // 1. Check Unexpected Stop
    if (this.lastLocation) {
      const distToLast = this.calculateDistance(
        loc.latitude, loc.longitude,
        this.lastLocation.latitude, this.lastLocation.longitude
      );

      // If moved less than 15 meters since last check
      if (distToLast < 15) {
        const timeStopped = (now - this.lastLocationTime) / 60000;
        if (timeStopped >= this.settings.stopThresholdMinutes && this.status === 'SAFE') {
          this.updateStatus('UNEXPECTED_STOP');
        }
      } else {
        // We are moving
        this.lastLocation = loc;
        this.lastLocationTime = now;
        if (this.status === 'UNEXPECTED_STOP') this.updateStatus('SAFE');
      }
    } else {
      this.lastLocation = loc;
      this.lastLocationTime = now;
    }

    // 2. Check Journey Check-in
    const minsSinceCheckIn = (now - this.lastCheckInTime) / 60000;
    if (minsSinceCheckIn >= this.settings.checkInIntervalMinutes) {
      if (this.status === 'SAFE' || this.status === 'UNEXPECTED_STOP') {
        this.updateStatus('CHECK_IN_REQUIRED');
        if (this.onCheckInRequested) this.onCheckInRequested();
      } else if (this.status === 'CHECK_IN_REQUIRED') {
        // Grace period expired (e.g., 2 mins past check-in time)
        if (minsSinceCheckIn >= this.settings.checkInIntervalMinutes + 2) {
          this.escalateToSOS('Journey check-in missed');
        }
      }
    }

    // 3. Destination Reached
    if (this.destination) {
      const distToDest = this.calculateDistance(
        loc.latitude, loc.longitude,
        this.destination.latitude, this.destination.longitude
      );
      if (distToDest < 100) { // within 100 meters
        await this.endJourney();
      }
    }
  }

  private static escalateToSOS(reason: string) {
    this.updateStatus('ESCALATING');
    console.warn(`[JourneySentinel] ESCALATING TO SOS: ${reason}`);
    if (this.onSOSEscalation) this.onSOSEscalation();
  }

  // Haversine formula
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
  }
}
