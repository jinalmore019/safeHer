import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { PermissionsAndroid, Platform, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Network from 'expo-network';
import { SOSEngineState, Incident, LocationSnapshot } from '../types/models';
import { DatabaseService } from '../services/DatabaseService';
import { LocationService } from '../services/LocationService';
import { SyncService } from '../services/SyncService';
import { FirebaseService } from '../services/FirebaseService';
import { TrackingTokenService } from '../services/TrackingTokenService';
import { ShakeDetectionService } from '../services/ShakeDetectionService';
import { AudioDistressService } from '../services/AudioDistressService';
import * as Location from 'expo-location';
import { SafeWordService } from '../services/SafeWordService';
import { JourneySentinelService } from '../services/JourneySentinelService';
import * as SMS from 'expo-sms';
// import { sendSmsAsync } from '../../modules/safeher-sms';
// import SafeherBackgroundModule from '../../modules/safeher-background/src/SafeherBackgroundModule';
// import { EventEmitter } from 'expo-modules-core';

// Initialize DB on startup
DatabaseService.init();

interface SOSState {
  engineState: SOSEngineState;
  countdown: number;
  activeIncident: Incident | null;
  activeLocation: LocationSnapshot | null;
}

type SOSAction =
  | { type: 'TRIGGER_SOS' }
  | { type: 'TICK_COUNTDOWN'; payload: number }
  | { type: 'CANCEL_SOS' }
  | { type: 'CONFIRM_SOS' }
  | { type: 'TRIGGER_DURESS' }
  | { type: 'SET_ACTIVE_EMERGENCY'; payload: { incident: Incident; location: LocationSnapshot | null } }
  | { type: 'RESOLVE_SOS' }
  | { type: 'ERROR'; payload: string }
  | { type: 'LOAD_ACTIVE_INCIDENT'; payload: { incident: Incident } };

const initialState: SOSState = {
  engineState: 'IDLE',
  countdown: 5,
  activeIncident: null,
  activeLocation: null,
};

function sosReducer(state: SOSState, action: SOSAction): SOSState {
  switch (action.type) {
    case 'TRIGGER_SOS':
      return { ...state, engineState: 'TRIGGERED', countdown: 5 };
    case 'TICK_COUNTDOWN':
      return { ...state, countdown: action.payload };
    case 'CANCEL_SOS':
      return { ...state, engineState: 'IDLE', countdown: 5 };
    case 'CONFIRM_SOS':
      return { ...state, engineState: 'CONFIRMED', countdown: 0 };
    case 'TRIGGER_DURESS':
      return { ...state, engineState: 'DURESS_ACTIVE', countdown: 0 };
    case 'SET_ACTIVE_EMERGENCY':
      return { 
        ...state, 
        engineState: 'ACTIVE', 
        activeIncident: action.payload.incident,
        activeLocation: action.payload.location
      };
    case 'RESOLVE_SOS':
      return { ...state, engineState: 'IDLE', activeIncident: null, activeLocation: null };
    case 'LOAD_ACTIVE_INCIDENT':
      return { ...state, engineState: 'ACTIVE', activeIncident: action.payload.incident };
    case 'ERROR':
      return { ...state, engineState: 'FAILED_RECOVERABLE' };
    default:
      return state;
  }
}

interface SOSContextProps extends SOSState {
  triggerSOS: () => void;
  cancelSOS: () => void;
  triggerDuress: () => void;
  resolveSOS: () => void;
}

const SOSContext = createContext<SOSContextProps | undefined>(undefined);

export const SOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(sosReducer, initialState);

  // Check for active incident on mount
  useEffect(() => {
    const activeIncident = DatabaseService.getActiveIncident();
    if (activeIncident) {
      dispatch({ type: 'LOAD_ACTIVE_INCIDENT', payload: { incident: activeIncident } });
    }
  }, []);

  // Countdown timer logic
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (state.engineState === 'TRIGGERED' && state.countdown > 0) {
      timer = setTimeout(() => {
        dispatch({ type: 'TICK_COUNTDOWN', payload: state.countdown - 1 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 1000);
    } else if (state.engineState === 'TRIGGERED' && state.countdown === 0) {
      dispatch({ type: 'CONFIRM_SOS' });
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [state.engineState, state.countdown]);

  // Handle Confirmed SOS & Duress Active
  useEffect(() => {
    if (state.engineState === 'CONFIRMED' || state.engineState === 'DURESS_ACTIVE') {
      const confirmEmergency = async () => {
        try {
          const isDuress = state.engineState === 'DURESS_ACTIVE';
          // 1. Generate IDs
          const incidentId = 'inc_' + Date.now().toString() + Math.random().toString(36).substring(7);
          
          // 2. Try to get GPS
          const location = await LocationService.getCurrentLocation(incidentId);
          
          // 3. Create Incident
          const newIncident: Incident = {
            id: incidentId,
            userId: 'user_local', // For now, local user ID
            triggerType: isDuress ? 'duress' : 'sos',
            status: 'active',
            createdAt: new Date().toISOString(),
            confirmedAt: new Date().toISOString(),
            latitude: location?.latitude,
            longitude: location?.longitude,
            accuracy: location?.accuracy,
          };

          // 4. Save to SQLite
          DatabaseService.createIncident(newIncident);
          if (location) {
            DatabaseService.addLocation(location);
          }

          // 5. Send Background SMS — includes SafeHer live tracking link
          if (Platform.OS === 'android') {
            try {
              const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.SEND_SMS,
                {
                  title: 'Emergency SMS Permission',
                  message: 'SafeHer needs to send SMS alerts during emergencies.',
                  buttonNeutral: 'Ask Me Later',
                  buttonNegative: 'Cancel',
                  buttonPositive: 'OK',
                }
              );
              
              if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                // Generate a secure tracking token and get the SafeHer tracking URL.
                // Falls back to empty string if offline — message still sends without the link.
                const trackingUrl = await TrackingTokenService.generateTrackingToken(incidentId);

                // Resolve sender name — DatabaseService.getUser() not yet implemented,
                // so we fall back to 'Someone' until user profile storage is added.
                const senderName = 'Someone';

                // Build the formatted emergency SMS body
                const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
                let msg: string;

                if (isDuress) {
                  // Duress: plain, low-profile message
                  msg = `DURESS ALERT: ${senderName} needs help.`;
                  if (trackingUrl) {
                    msg += `\n\nLive Location:\n${trackingUrl}`;
                  } else if (location) {
                    msg += `\n\nhttps://maps.google.com/?q=${location.latitude},${location.longitude}`;
                  }
                } else {
                  // Normal SOS: full formatted SafeHer alert
                  if (trackingUrl) {
                    msg =
                      `\uD83D\uDEA8 SAFEHER EMERGENCY ALERT\n\n` +
                      `${senderName} has triggered an SOS and may need help.\n\n` +
                      `\uD83D\uDCCD Live Location:\n${trackingUrl}\n\n` +
                      `Open this link to view their current live location.\n` +
                      `Time: ${timestamp}`;
                  } else {
                    // Fallback: no tracking URL (offline or token generation failed)
                    const coordsText = location
                      ? `https://maps.google.com/?q=${location.latitude},${location.longitude}`
                      : 'Unknown';
                    msg =
                      `\uD83D\uDEA8 SAFEHER EMERGENCY ALERT\n\n` +
                      `${senderName} has triggered an SOS and may need help.\n\n` +
                      `\uD83D\uDCCD Last Known Location:\n${coordsText}\n\n` +
                      `Time: ${timestamp}`;
                  }
                }
        
                const contacts = DatabaseService.getContacts();
                if (contacts.length === 0) {
                  console.warn('No emergency contacts configured to receive SMS.');
                } else {
                  const isAvailable = await SMS.isAvailableAsync();
                  if (isAvailable) {
                    for (const contact of contacts) {
                      if (contact.notifyOnSOS) {
                        console.log(`Sending SMS to ${contact.phone}`);
                        await SMS.sendSMSAsync([contact.phone], msg);
                      }
                    }
                  } else {
                    console.log(`[SMS] Error: SMS is not available on this device.`);
                  }
                  console.log(`Emergency SMS sent successfully to ${contacts.length} contacts.`);
                }
              } else {
                console.warn('SMS permission denied');
              }
            } catch (err) {
              console.error('Failed to send SMS', err);
            }
          }

          // 6. Update State and Auto-Dial Police (112)
          if (!isDuress) {
            dispatch({ type: 'SET_ACTIVE_EMERGENCY', payload: { incident: newIncident, location } });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); // Distinct pattern for SOS active
            
            // Try to auto-dial 112 (India Emergency Number)
            try {
              const telUrl = 'tel:112';
              const canOpen = await Linking.canOpenURL(telUrl);
              if (canOpen) {
                console.log('Dialing emergency services...');
                Linking.openURL(telUrl);
              }
            } catch (dialError) {
              console.error('Failed to dial 112', dialError);
            }
          } else {
            // For duress, we just store it in context without showing the red screen
            dispatch({ type: 'LOAD_ACTIVE_INCIDENT', payload: { incident: newIncident } });
            // Don't change state to ACTIVE, we want it to look normal to the attacker.
            dispatch({ type: 'RESOLVE_SOS' });
          }

        } catch (error) {
          console.error("Failed to confirm emergency", error);
          dispatch({ type: 'ERROR', payload: 'Failed to create emergency record' });
        }
      };

      confirmEmergency();
    }
  }, [state.engineState]);

  // Live Location Tracking
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    
    const startTracking = async () => {
      if (state.engineState === 'ACTIVE' && state.activeIncident) {
        try {
          locationSubscription = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
            (location) => {
              // Update local state (optional, if you want UI to re-render)
              // Update Firebase for live tracking
              FirebaseService.updateLiveLocation(state.activeIncident!.id, location.coords);
            }
          );
        } catch (e) {
          console.error('Failed to start live tracking', e);
        }
      }
    };
    
    startTracking();
    
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [state.engineState, state.activeIncident]);

  // Global network listener for Sync Queue
  useEffect(() => {
    // Process queue on app start if online
    SyncService.processQueue();

    // Listen for network changes to process queue automatically
    let isMounted = true;
    let lastStatus = true; // Assume online initially

    const checkNetwork = async () => {
      if (!isMounted) return;
      try {
        const state = await Network.getNetworkStateAsync();
        const isOnline = !!(state.isConnected && state.isInternetReachable);
        if (isOnline && !lastStatus) {
          SyncService.processQueue();
        }
        lastStatus = isOnline;
      } catch (e) {}
    };

    // Since addNetworkStateListener has quirks in some SDKs, we just use a small poll for demo
    const interval = setInterval(checkNetwork, 10000); // every 10s check network

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const triggerSOS = useCallback(async (triggerType: 'manual' | 'shake_trigger' | 'scream_trigger' | 'safe_word' = 'manual') => {
    if (state.engineState === 'IDLE') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      dispatch({ type: 'TRIGGER_SOS' });
      // In a real app, we might store the triggerType in a temporary ref to use during confirmation
    }
  }, [state.engineState]);

  // Initialize Automatic Triggers
  useEffect(() => {
    const initTriggers = async () => {
      await ShakeDetectionService.init();
      await AudioDistressService.init();

      ShakeDetectionService.onShakeCallback = () => {
        triggerSOS('shake_trigger');
      };

      AudioDistressService.onDistressCallback = () => {
        triggerSOS('scream_trigger');
      };
      
      SafeWordService.onSafeWordTriggered = () => {
        triggerSOS('safe_word');
      };
      
      JourneySentinelService.onSOSEscalation = () => {
        triggerSOS('manual'); // Escalated from Journey
      };

      // Ensure they start listening if enabled
      ShakeDetectionService.startListening();
      AudioDistressService.startListening();
      
      // Native Background Shake Listener disabled for stable build
      /*
      const emitter = new EventEmitter(SafeherBackgroundModule);
      // @ts-ignore
      const bgSub = emitter.addListener('onBackgroundShake', () => {
        triggerSOS('shake_trigger');
      });
      
      try {
        SafeherBackgroundModule.startService();
      } catch (e) {
        console.error("Could not start bg service:", e);
      }
      */
      
      return () => {
        // bgSub.remove();
      };
    };

    const cleanupBg = initTriggers();

    return () => {
      ShakeDetectionService.stopListening();
      AudioDistressService.stopListening();
      cleanupBg.then(clean => clean && clean());
    };
  }, [triggerSOS]);

  const cancelSOS = useCallback(() => {
    if (state.engineState === 'TRIGGERED') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      dispatch({ type: 'CANCEL_SOS' });
    }
  }, [state.engineState]);

  const triggerDuress = useCallback(() => {
    if (state.engineState === 'TRIGGERED') {
      // Look like we cancelled successfully
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      dispatch({ type: 'TRIGGER_DURESS' });
    }
  }, [state.engineState]);

  const resolveSOS = useCallback(() => {
    if (state.engineState === 'ACTIVE' && state.activeIncident) {
      const resolvedAt = new Date().toISOString();
      DatabaseService.updateIncidentStatus(state.activeIncident.id, 'resolved', resolvedAt);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      dispatch({ type: 'RESOLVE_SOS' });
    }
  }, [state.engineState, state.activeIncident]);

  return (
    <SOSContext.Provider value={{ ...state, triggerSOS, cancelSOS, triggerDuress, resolveSOS }}>
      {children}
    </SOSContext.Provider>
  );
};

export const useSOS = () => {
  const context = useContext(SOSContext);
  if (context === undefined) {
    throw new Error('useSOS must be used within a SOSProvider');
  }
  return context;
};
