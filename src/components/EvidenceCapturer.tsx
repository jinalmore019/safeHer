import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Audio } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { Evidence } from '../types/models';
import { DatabaseService } from '../services/DatabaseService';

interface EvidenceCapturerProps {
  incidentId: string;
  userId: string;
  onEvidenceCaptured?: () => void;
}

export function EvidenceCapturer({ incidentId, userId, onEvidenceCaptured }: EvidenceCapturerProps) {
  const cameraRef = useRef<CameraView>(null);
  const [camStatus, requestCamPermission] = useCameraPermissions();
  const [micStatus, requestMicPermission] = useMicrophonePermissions();
  const [isReady, setIsReady] = useState(false);
  const [hasCaptured, setHasCaptured] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    // Request permissions on mount
    const requestPerms = async () => {
      if (!camStatus?.granted) await requestCamPermission();
      if (!micStatus?.granted) await requestMicPermission();
      setIsReady(true);
    };
    requestPerms();
  }, [camStatus, micStatus]);

  useEffect(() => {
    if (isReady && !hasCaptured && camStatus?.granted) {
      setHasCaptured(true);
      captureEvidence();
    }
  }, [isReady, camStatus]);

  const captureEvidence = async () => {
    try {
      // 1. Capture Photo
      if (cameraRef.current) {
        console.log('Capturing emergency photo...');
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
        if (photo) {
          const newPath = `${FileSystem.documentDirectory}photo_${incidentId}_${Date.now()}.jpg`;
          await FileSystem.moveAsync({ from: photo.uri, to: newPath });
          
          const evidence: Evidence = {
            id: `ev_ph_${Date.now()}`,
            incidentId,
            userId,
            type: 'photo',
            localUri: newPath,
            capturedAt: new Date().toISOString(),
            isUploaded: false,
          };
          
          DatabaseService.saveEvidence(evidence);
          DatabaseService.addToSyncQueue({
            id: `sq_${Date.now()}`,
            type: 'EVIDENCE_UPLOAD',
            entityId: evidence.id,
            payload: JSON.stringify(evidence),
            createdAt: new Date().toISOString(),
            retryCount: 0,
            status: 'PENDING'
          });
          console.log('Photo saved:', newPath);
        }
      }

      // 2. Capture Audio
      if (micStatus?.granted) {
        console.log('Recording emergency audio...');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.LOW_QUALITY
        );
        recordingRef.current = recording;

        // Record for 10 seconds, then stop
        setTimeout(async () => {
          if (recordingRef.current) {
            await recordingRef.current.stopAndUnloadAsync();
            const uri = recordingRef.current.getURI();
            if (uri) {
              const newPath = `${FileSystem.documentDirectory}audio_${incidentId}_${Date.now()}.m4a`;
              await FileSystem.moveAsync({ from: uri, to: newPath });
              
              const evidence: Evidence = {
                id: `ev_au_${Date.now()}`,
                incidentId,
                userId,
                type: 'audio',
                localUri: newPath,
                capturedAt: new Date().toISOString(),
                isUploaded: false,
              };
              
              DatabaseService.saveEvidence(evidence);
              DatabaseService.addToSyncQueue({
                id: `sq_au_${Date.now()}`,
                type: 'EVIDENCE_UPLOAD',
                entityId: evidence.id,
                payload: JSON.stringify(evidence),
                createdAt: new Date().toISOString(),
                retryCount: 0,
                status: 'PENDING'
              });
              console.log('Audio saved:', newPath);
            }
          }
          if (onEvidenceCaptured) onEvidenceCaptured();
        }, 10000); // 10 seconds duration
      } else {
        if (onEvidenceCaptured) onEvidenceCaptured();
      }

    } catch (err) {
      console.error('Failed to capture evidence:', err);
      // Failsafe: don't crash SOS flow
      if (onEvidenceCaptured) onEvidenceCaptured();
    }
  };

  if (!isReady || !camStatus?.granted) {
    return null;
  }

  return (
    <View style={styles.hiddenContainer}>
      <CameraView 
        ref={cameraRef} 
        style={styles.hiddenCamera} 
        facing="front" // Front camera to capture attacker/environment
        mute={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0, // Hidden from view but mounted to allow capture
  },
  hiddenCamera: {
    width: 100,
    height: 100,
  }
});
