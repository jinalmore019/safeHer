import { Audio } from 'expo-audio';
import * as SecureStore from 'expo-secure-store';

export type DistressSensitivity = 'LOW' | 'MEDIUM' | 'HIGH';

interface DistressSettings {
  enabled: boolean;
  sensitivity: DistressSensitivity;
}

const SETTINGS_KEY = 'safeher_distress_settings';

export class AudioDistressService {
  private static recording: Audio.Recording | null = null;
  private static isListening = false;
  private static consecutiveSpikes = 0;
  private static lastTriggerTime = 0;
  
  private static COOLDOWN_MS = 15000; // 15 seconds cooldown after triggering
  private static REQUIRED_SPIKES = 3; // Number of consecutive updates above threshold (approx 0.5s)
  
  private static settings: DistressSettings = {
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
      console.warn('Could not load distress settings');
    }
  }

  static async saveSettings(settings: DistressSettings) {
    this.settings = settings;
    await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(settings));
    
    if (settings.enabled) {
      await this.startListening();
    } else {
      await this.stopListening();
    }
  }

  static getSettings(): DistressSettings {
    return this.settings;
  }

  // Returns dBFS threshold (closer to 0 is louder)
  private static getThreshold(): number {
    switch (this.settings.sensitivity) {
      case 'LOW': return -3;    // Very loud (hard to trigger)
      case 'MEDIUM': return -8; // Loud scream/shout
      case 'HIGH': return -15;  // Moderate shout (easier to trigger)
      default: return -8;
    }
  }

  static onDistressCallback: (() => void) | null = null;

  static async startListening() {
    if (!this.settings.enabled) return;
    if (this.isListening) return;

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        console.warn('Microphone permission denied. Cannot start distress detection.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const options = {
        ...Audio.RecordingOptionsPresets.LOW_QUALITY,
        isMeteringEnabled: true,
      };

      const { recording } = await Audio.Recording.createAsync(options);
      this.recording = recording;
      this.isListening = true;

      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.metering !== undefined) {
          const dbfs = status.metering;
          const now = Date.now();
          
          if (now - this.lastTriggerTime < this.COOLDOWN_MS) {
            return;
          }

          if (dbfs > this.getThreshold()) {
            this.consecutiveSpikes += 1;
            console.log(`[AudioDistress] Spike detected! Level: ${dbfs} dBFS. Count: ${this.consecutiveSpikes}`);
            
            if (this.consecutiveSpikes >= this.REQUIRED_SPIKES) {
              this.lastTriggerTime = now;
              this.consecutiveSpikes = 0;
              console.log('[AudioDistress] Distress confirmed! Triggering SOS...');
              if (this.onDistressCallback) {
                this.onDistressCallback();
              }
            }
          } else {
            this.consecutiveSpikes = 0;
          }
        }
      });
      
      // Start recording with metering update interval ~150ms
      await recording.setProgressUpdateInterval(150);
      
    } catch (err) {
      console.error('Failed to start audio distress service:', err);
      this.isListening = false;
    }
  }

  static async stopListening() {
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (err) {}
      this.recording = null;
    }
    this.isListening = false;
    this.consecutiveSpikes = 0;
  }
}
