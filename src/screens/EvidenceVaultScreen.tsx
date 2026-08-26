import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-audio';
import * as LocalAuthentication from 'expo-local-authentication';
import { Colors, Typography, Spacing, Radius } from '../design/tokens';
import { Card } from '../components/ui';
import { DatabaseService } from '../services/DatabaseService';
import { Evidence } from '../types/models';
import { PINService } from '../services/PINService';

export default function EvidenceVaultScreen({ navigation }: any) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [hasBiometrics, setHasBiometrics] = useState(false);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometrics(compatible && enrolled);
    })();

    return () => {
      if (sound) sound.unloadAsync();
    };
  }, []);

  const loadData = () => {
    const data = DatabaseService.getAllEvidence();
    setEvidenceList(data);
  };

  const handleBiometricAuth = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Evidence Vault',
      fallbackLabel: 'Use PIN',
      cancelLabel: 'Cancel',
      disableDeviceFallback: true,
    });
    if (result.success) {
      setIsAuthenticated(true);
      loadData();
    }
  };

  const handlePinAuth = async () => {
    const isNormal = (await PINService.verifyPin(pin)) === 'NORMAL';
    if (isNormal) {
      setIsAuthenticated(true);
      loadData();
    } else {
      Alert.alert('Access Denied', 'Incorrect PIN.');
      setPin('');
    }
  };

  const playAudio = async (ev: Evidence) => {
    try {
      if (sound) {
        await sound.unloadAsync();
        if (isPlaying === ev.id) {
          setSound(null);
          setIsPlaying(null);
          return; // Stop if clicking same item
        }
      }
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: ev.localUri });
      setSound(newSound);
      setIsPlaying(ev.id);
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(null);
        }
      });
    } catch (err) {
      console.error('Failed to play audio:', err);
      setIsPlaying(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.authContainer} edges={['top']}>
        <Text style={styles.authTitle}>Secure Evidence Vault</Text>
        <Text style={styles.authDesc}>Enter your Normal PIN to access recorded emergency media.</Text>
        
        <TextInput
          style={styles.pinInput}
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          placeholder="Enter PIN"
          placeholderTextColor={Colors.text.muted}
        />
        <TouchableOpacity style={styles.authBtn} onPress={handlePinAuth}>
          <Text style={styles.authBtnText}>Unlock Vault</Text>
        </TouchableOpacity>

        {hasBiometrics && (
          <TouchableOpacity style={styles.bioBtn} onPress={handleBiometricAuth}>
            <Text style={styles.bioBtnText}>Use Biometrics / Device Lock</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: Evidence }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.type === 'photo' ? '📷 Photo' : '🎙️ Audio'}</Text>
        <Text style={styles.cardTime}>{new Date(item.capturedAt).toLocaleString()}</Text>
      </View>
      <Text style={styles.incidentRef}>Incident ID: {item.incidentId}</Text>
      
      {item.type === 'photo' && (
        <View style={styles.mediaContainer}>
          <Image source={{ uri: item.localUri }} style={styles.photo} resizeMode="cover" />
        </View>
      )}

      {item.type === 'audio' && (
        <TouchableOpacity style={styles.audioBtn} onPress={() => playAudio(item)}>
          <Text style={styles.audioBtnText}>
            {isPlaying === item.id ? '⏹️ Stop Playing' : '▶️ Play Audio'}
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Evidence Vault</Text>
        <TouchableOpacity onPress={() => setIsAuthenticated(false)} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Lock 🔒</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={evidenceList}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Vault is empty.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },
  authContainer: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  authTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.brand.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  authDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  pinInput: {
    backgroundColor: Colors.bg.card,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    fontSize: Typography.sizes.lg,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: Spacing.xl,
  },
  authBtn: {
    backgroundColor: Colors.brand.primary,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  authBtnText: {
    color: '#fff',
    fontWeight: Typography.weights.bold,
    fontSize: Typography.sizes.md,
  },
  bioBtn: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  bioBtnText: {
    color: Colors.brand.secondary,
    fontWeight: Typography.weights.bold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  backBtn: { padding: Spacing.sm },
  backBtnText: { color: Colors.brand.primary, fontWeight: Typography.weights.bold },
  title: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.text.primary },
  list: { padding: Spacing.base },
  card: { marginBottom: Spacing.lg, padding: Spacing.md, backgroundColor: Colors.bg.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  cardTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.text.primary },
  cardTime: { fontSize: Typography.sizes.xs, color: Colors.text.muted },
  incidentRef: { fontSize: Typography.sizes.xs, color: Colors.brand.secondary, marginBottom: Spacing.md },
  mediaContainer: { width: '100%', height: 200, backgroundColor: '#000', borderRadius: Radius.md, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  audioBtn: { backgroundColor: Colors.brand.primary, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center' },
  audioBtnText: { color: '#fff', fontWeight: Typography.weights.bold },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { color: Colors.text.muted },
});
