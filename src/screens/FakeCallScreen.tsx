import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Colors, Typography, Spacing, Radius } from '../design/tokens';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { SafeWordService } from '../services/SafeWordService';
import { AICallService } from '../services/AICallService';

export default function FakeCallScreen({ route }: any) {
  const navigation = useNavigation();
  const callerName = route.params?.callerName || 'Unknown';
  
  const [callState, setCallState] = useState<'incoming' | 'active' | 'ended'>('incoming');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const [isSpeakingAI, setIsSpeakingAI] = useState(false);
  const transcriptRef = React.useRef<string>('');
  const debounceTimer = React.useRef<any>(null);

  const handleUserTurnFinished = async (finalTranscript: string) => {
    if (!finalTranscript.trim() || isSpeakingAI) return;
    
    setIsSpeakingAI(true);
    transcriptRef.current = ''; 
    
    try {
      console.log(`[FakeCall] User finished speaking. Sending to AI: "${finalTranscript}"`);
      const response = await AICallService.generateResponse(finalTranscript);
      console.log(`[FakeCall] AI Response: "${response}"`);
      
      try { ExpoSpeechRecognitionModule.stop(); } catch (e) {}

      Speech.speak(response, {
        onDone: () => {
          setIsSpeakingAI(false);
          // Safety: only restart mic if still active
          try { ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: false, continuous: true }); } catch (e) {}
        },
        onError: () => {
          setIsSpeakingAI(false);
          try { ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: false, continuous: true }); } catch (e) {}
        },
        onStopped: () => setIsSpeakingAI(false)
      });
    } catch (e) {
      console.error('[FakeCall] AI turn error:', e);
      setIsSpeakingAI(false);
    }
  };

  // Speech recognition event listeners
  useSpeechRecognitionEvent('result', (event) => {
    if (event.results && event.results.length > 0) {
      const transcript = event.results[0]?.transcript;
      if (transcript) {
        console.log(`[FakeCall] Speech recognized: "${transcript}"`);
        SafeWordService.processAudioPhrase(transcript)
          .then((triggered) => {
            if (triggered) {
              console.log('[FakeCall] Safe word matched! Triggering silent SOS.');
              handleEnd();
            }
          })
          .catch((err) => console.error('[FakeCall] SafeWordService error:', err));
          
        if (!isSpeakingAI) {
          transcriptRef.current = transcript;
          if (debounceTimer.current) clearTimeout(debounceTimer.current);
          debounceTimer.current = setTimeout(() => {
            handleUserTurnFinished(transcriptRef.current);
          }, 1500);
        }
      }
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.warn('[FakeCall] Speech recognition error event:', event.error, event.message);
  });

  useEffect(() => {
    let isListening = false;

    const startSpeechRec = async () => {
      try {
        const perms = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (perms.granted) {
          console.log('[FakeCall] Speech recognition permission granted. Starting listener...');
          await ExpoSpeechRecognitionModule.start({
            lang: 'en-US',
            interimResults: false,
            continuous: true,
          });
          isListening = true;
        } else {
          console.warn('[FakeCall] Speech recognition permission denied.');
        }
      } catch (err) {
        console.error('[FakeCall] Failed to start speech recognition:', err);
      }
    };

    if (callState === 'active') {
      startSpeechRec();
    }

    return () => {
      if (isListening) {
        try {
          console.log('[FakeCall] Stopping speech recognition...');
          ExpoSpeechRecognitionModule.stop();
        } catch (err) {
          console.error('[FakeCall] Failed to stop speech recognition:', err);
        }
      }
    };
  }, [callState]);

  useEffect(() => {
    // Play ringtone loop and haptic vibrations
    let hapticInterval: any;
    
    const startRinging = async () => {
      hapticInterval = setInterval(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 2000);

      // In a real app we'd load a local ringtone MP3 file here.
      // For this demo, we'll just rely on haptics if no asset is provided.
    };

    if (callState === 'incoming') {
      startRinging();
    } else {
      if (hapticInterval) clearInterval(hapticInterval);
    }

    return () => {
      if (hapticInterval) clearInterval(hapticInterval);
      if (sound) sound.unloadAsync();
    };
  }, [callState]);

  useEffect(() => {
    let timer: any;
    if (callState === 'active') {
      timer = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState]);

  const handleAccept = () => {
    setCallState('active');
  };

  const handleEnd = () => {
    setCallState('ended');
    AICallService.resetConversation();
    Speech.stop();
    try { ExpoSpeechRecognitionModule.stop(); } catch(e) {}
    setTimeout(() => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }, 1500);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>{callerName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.callerName}>{callerName}</Text>
        
        {callState === 'incoming' && <Text style={styles.statusText}>Incoming call...</Text>}
        {callState === 'active' && <Text style={styles.statusText}>{formatTime(secondsElapsed)}</Text>}
        {callState === 'ended' && <Text style={styles.statusText}>Call ended</Text>}
      </View>

      {callState === 'incoming' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.btnDecline]} onPress={handleEnd}>
            <Text style={styles.btnIcon}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.btnAccept]} onPress={handleAccept}>
            <Text style={styles.btnIcon}>📞</Text>
          </TouchableOpacity>
        </View>
      )}

      {callState === 'active' && (
        <View style={styles.actionRowCenter}>
          <TouchableOpacity style={[styles.actionBtn, styles.btnDecline]} onPress={handleEnd}>
            <Text style={styles.btnIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    justifyContent: 'space-between',
    paddingBottom: Spacing.xxl * 2,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarInitial: {
    fontSize: 50,
    color: '#fff',
    fontWeight: 'bold',
  },
  callerName: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  statusText: {
    fontSize: 18,
    color: '#8E8E93',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.xl,
  },
  actionRowCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionBtn: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnAccept: {
    backgroundColor: '#34C759', // iOS Green
  },
  btnDecline: {
    backgroundColor: '#FF3B30', // iOS Red
  },
  btnIcon: {
    fontSize: 32,
    color: '#fff',
  }
});
