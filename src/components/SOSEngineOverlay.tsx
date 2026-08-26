import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSOS } from '../state/SOSContext';
import { PINService } from '../services/PINService';
import { Colors, Typography, Spacing, Radius } from '../design/tokens';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from './ui';
import * as Network from 'expo-network';
import { EvidenceCapturer } from './EvidenceCapturer';

export function SOSEngineOverlay() {
  const { engineState, countdown, cancelSOS, triggerDuress, resolveSOS, activeIncident, activeLocation } = useSOS();
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [pin, setPin] = useState('');
  const [isOffline, setIsOffline] = useState(false);

  React.useEffect(() => {
    if (engineState === 'ACTIVE') {
      Network.getNetworkStateAsync().then(state => {
        setIsOffline(!state.isConnected || !state.isInternetReachable);
      });
      // Optionally could poll or listen for changes, but this is a one-time check for demo
    }
  }, [engineState]);

  const handleCancelPress = () => {
    setShowPinEntry(true);
  };

  const handlePinSubmit = async () => {
    const result = await PINService.verifyPin(pin);
    if (result === 'NORMAL') {
      setShowPinEntry(false);
      setPin('');
      cancelSOS();
    } else if (result === 'DURESS') {
      setShowPinEntry(false);
      setPin('');
      triggerDuress();
    } else {
      // Wrong PIN
      alert('Invalid PIN');
      setPin('');
    }
  };

  if (engineState === 'IDLE' || engineState === 'CONFIRMED') {
    if (showPinEntry) setShowPinEntry(false);
    return null;
  }

  if (engineState === 'TRIGGERED') {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.triggeredOverlay}>
          {!showPinEntry ? (
            <>
              <Text style={styles.emergencyTitle}>EMERGENCY SOS</Text>
              <Text style={styles.countdownNumber}>{countdown}</Text>
              <Text style={styles.countdownText}>seconds to dispatch</Text>
              
              <TouchableOpacity 
                style={styles.cancelBtn} 
                activeOpacity={0.8}
                onPress={handleCancelPress}
              >
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
            </>
          ) : (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.pinContainer}>
              <Text style={styles.pinTitle}>Enter PIN to Cancel</Text>
              <TextInput
                style={styles.pinInput}
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                autoFocus
              />
              <View style={styles.pinActions}>
                <TouchableOpacity style={styles.pinCancelBtn} onPress={() => setShowPinEntry(false)}>
                  <Text style={styles.pinCancelText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pinSubmitBtn} onPress={handlePinSubmit}>
                  <Text style={styles.pinSubmitText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}
        </View>
      </Modal>
    );
  }

  const renderActiveEmergency = () => (
    <Modal visible animationType="slide">
      <SafeAreaView style={styles.activeContainer}>
        <View style={styles.activeHeader}>
          <View style={styles.pulsingDot} />
          <Text style={styles.activeTitle}>EMERGENCY ACTIVE</Text>
        </View>
        
        <Card style={styles.infoCard}>
          <Text style={styles.infoLabel}>Incident ID</Text>
          <Text style={styles.infoValue}>{activeIncident?.id}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.infoLabel}>Trigger Type</Text>
          <Text style={styles.infoValue}>{activeIncident?.triggerType.toUpperCase()}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.infoLabel}>Time Started</Text>
          <Text style={styles.infoValue}>
            {activeIncident?.createdAt ? new Date(activeIncident.createdAt).toLocaleTimeString() : '--'}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.infoLabel}>Location</Text>
          <Text style={styles.infoValue}>
            {activeLocation 
              ? `${activeLocation.latitude.toFixed(5)}, ${activeLocation.longitude.toFixed(5)} (\u00B1${activeLocation.accuracy.toFixed(0)}m)`
              : 'Acquiring GPS...'}
          </Text>
        </Card>

        <View style={{ flex: 1 }} />

        <View style={styles.networkStatusContainer}>
          <View style={[styles.networkDot, { backgroundColor: isOffline ? Colors.status.warning : Colors.status.safe }]} />
          <Text style={styles.networkStatusText}>
            {isOffline ? 'OFFLINE — emergency data saved locally' : 'ONLINE — syncing with cloud'}
          </Text>
        </View>

        <Text style={styles.warningText}>
          Local authorities and emergency contacts are being notified (simulated).
        </Text>

        <TouchableOpacity 
          style={styles.safeBtn} 
          activeOpacity={0.8}
          onPress={resolveSOS}
        >
          <Text style={styles.safeBtnText}>I'M SAFE (RESOLVE)</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );

  return (
    <>
      {(engineState === 'ACTIVE' || engineState === 'DURESS_ACTIVE') && activeIncident && (
        <EvidenceCapturer incidentId={activeIncident.id} userId={activeIncident.userId} />
      )}
      {engineState === 'ACTIVE' && renderActiveEmergency()}
    </>
  );
}

const styles = StyleSheet.create({
  // Triggered / Countdown Styles
  triggeredOverlay: {
    flex: 1,
    backgroundColor: 'rgba(230, 59, 111, 0.95)', // brand.primary (danger color) with opacity
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emergencyTitle: {
    color: Colors.text.inverse,
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.extrabold,
    marginBottom: Spacing.xxl,
    letterSpacing: 2,
  },
  countdownNumber: {
    color: Colors.text.inverse,
    fontSize: 120,
    fontWeight: Typography.weights.extrabold,
    lineHeight: 120,
  },
  countdownText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
    marginBottom: 60,
  },
  cancelBtn: {
    backgroundColor: Colors.bg.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: 60,
    borderRadius: Radius.full,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cancelBtnText: {
    color: Colors.status.danger,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
  },
  pinContainer: {
    backgroundColor: Colors.bg.card,
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    width: '100%',
    alignItems: 'center',
    elevation: 10,
  },
  pinTitle: {
    fontSize: Typography.sizes.lg,
    color: Colors.text.primary,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.lg,
  },
  pinInput: {
    backgroundColor: Colors.bg.primary,
    color: Colors.text.primary,
    fontSize: Typography.sizes.xxl,
    letterSpacing: 10,
    textAlign: 'center',
    width: '100%',
    padding: Spacing.base,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    marginBottom: Spacing.xl,
  },
  pinActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  pinCancelBtn: {
    flex: 1,
    padding: Spacing.base,
    alignItems: 'center',
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
  },
  pinCancelText: {
    color: Colors.text.primary,
    fontWeight: Typography.weights.semibold,
  },
  pinSubmitBtn: {
    flex: 1,
    padding: Spacing.base,
    alignItems: 'center',
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.md,
  },
  pinSubmitText: {
    color: Colors.text.inverse,
    fontWeight: Typography.weights.bold,
  },

  // Active Emergency Styles
  activeContainer: {
    flex: 1,
    backgroundColor: '#fff1f2', // light red bg
    padding: Spacing.base,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.xl,
  },
  pulsingDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.status.danger,
  },
  activeTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.status.danger,
    letterSpacing: 1.5,
  },
  infoCard: {
    backgroundColor: Colors.bg.primary,
    borderColor: Colors.status.danger + '33',
    borderWidth: 2,
  },
  infoLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.ui.border,
    marginVertical: Spacing.md,
  },
  warningText: {
    textAlign: 'center',
    color: Colors.text.secondary,
    fontSize: Typography.sizes.sm,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  safeBtn: {
    backgroundColor: Colors.status.safe,
    paddingVertical: Spacing.xl,
    borderRadius: Radius.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  safeBtnText: {
    color: Colors.text.inverse,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
  },
  networkStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg.card,
    padding: Spacing.md,
    borderRadius: Radius.full,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  networkStatusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.text.secondary,
  }
});
