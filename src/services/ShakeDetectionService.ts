import { Accelerometer } from 'expo-sensors';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type ShakeSensitivity = 'LOW' | 'MEDIUM' | 'HIGH';

interface ShakeSettings {
  enabled: boolean;
  sensitivity: ShakeSensitivity;
}

const SETTINGS_KEY = 'safeher_shake_settings';

export class ShakeDetectionService {
  private static subscription: any = null;
  private static shakes: number[] = [];
  private static lastTriggerTime = 0;
  private static COOLDOWN_MS = 10000; // 10 seconds cooldown after triggering
  private static SHAKE_WINDOW_MS = 2000; // Must have 3 shakes within 2 seconds
  
  private static settings: ShakeSettings = {
    enabled: false,
    sensitivity: 'MEDIUM' // Default
  };

  static async init() {
    try {
      const stored = await SecureStore.getItemAsync(SETTINGS_KEY);
      if (stored) {
        this.settings = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not load shake settings');
    }
  }

  static async saveSettings(settings: ShakeSettings) {
    this.settings = settings;
    await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(settings));
    
    if (settings.enabled) {
      this.startListening();
    } else {
      this.stopListening();
    }
  }

  static getSettings(): ShakeSettings {
    return this.settings;
  }

  private static getThreshold(): number {
    switch (this.settings.sensitivity) {
      case 'LOW': return 4.0;    // Requires very hard shake
      case 'MEDIUM': return 2.8; // Moderate shake
      case 'HIGH': return 2.0;   // Lighter shake
      default: return 2.8;
    }
  }

  static onShakeCallback: (() => void) | null = null;

  static startListening() {
    if (!this.settings.enabled) return;
    if (this.subscription) return;

    // Set update interval (e.g. 100ms)
    Accelerometer.setUpdateInterval(100);

    this.subscription = Accelerometer.addListener(accelerometerData => {
      const { x, y, z } = accelerometerData;
      // Magnitude of acceleration vector. Gravity is 1.
      const magnitude = Math.sqrt(x*x + y*y + z*z);
      
      if (magnitude > this.getThreshold()) {
        const now = Date.now();
        
        // Check cooldown
        if (now - this.lastTriggerTime < this.COOLDOWN_MS) {
          return;
        }

        // Clean up old shakes outside window
        this.shakes = this.shakes.filter(time => now - time <= this.SHAKE_WINDOW_MS);
        
        // Add new shake if it's been at least 300ms since the last spike to avoid double counting the same physical motion
        if (this.shakes.length === 0 || (now - this.shakes[this.shakes.length - 1] > 300)) {
          this.shakes.push(now);
          
          if (this.shakes.length >= 3) {
            // TRIPLE SHAKE DETECTED!
            this.lastTriggerTime = now;
            this.shakes = [];
            console.log('[ShakeDetectionService] Triple shake detected! Triggering SOS...');
            if (this.onShakeCallback) {
              this.onShakeCallback();
            }
          }
        }
      }
    });
  }

  static stopListening() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    this.shakes = [];
  }
}
