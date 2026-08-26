// SettingsScreen — SafeHer
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../design/tokens';
import { Card, Divider } from '../components/ui';
import { PINService } from '../services/PINService';
import { ShakeDetectionService, ShakeSensitivity } from '../services/ShakeDetectionService';
import { AudioDistressService, DistressSensitivity } from '../services/AudioDistressService';
import { SafeWordService } from '../services/SafeWordService';
import { DatabaseService } from '../services/DatabaseService';
import { useNavigation } from '@react-navigation/native';

interface SettingItem {
  id: string;
  label: string;
  description?: string;
  type: 'toggle' | 'nav';
  icon: string;
  enabled?: boolean;
  comingSoon?: boolean;
}

const SETTINGS_GROUPS: { title: string; items: SettingItem[] }[] = [
  {
    title: 'Safety',
    items: [
      {
        id: 'config_pins',
        label: 'Configure PINs',
        description: 'Set Normal and Duress PINs',
        type: 'nav',
        icon: '🔢',
      },
      {
        id: 'sos_notifications',
        label: 'SOS Notifications',
        description: 'Notify contacts when SOS is triggered',
        type: 'toggle',
        icon: '🚨',
        enabled: true,
        comingSoon: true,
      },
      {
        id: 'location_sharing',
        label: 'Location Sharing',
        description: 'Share location during emergencies',
        type: 'toggle',
        icon: '📍',
        enabled: false,
        comingSoon: true,
      },
      {
        id: 'shake_detection',
        label: 'Triple-Shake SOS',
        description: 'Trigger SOS by shaking device 3 times',
        type: 'toggle',
        icon: '📳',
        enabled: false,
      },
      {
        id: 'distress_detection',
        label: 'Distress/Scream SOS',
        description: 'Trigger SOS via loud distress audio',
        type: 'toggle',
        icon: '🎙️',
        enabled: false,
      },
      {
        id: 'config_safeword',
        label: 'Safe-word',
        description: 'Configure and test Safe-word',
        type: 'nav',
        icon: '🗣️',
      },
      {
        id: 'fake_call',
        label: 'Simulate Fake Call',
        description: 'Trigger a fake incoming call',
        type: 'nav',
        icon: '📞',
      },
    ],
  },
  {
    title: 'Privacy',
    items: [
      {
        id: 'stealth_mode',
        label: 'Stealth Mode',
        description: 'Hide app from recent apps',
        type: 'toggle',
        icon: '🕵️',
        enabled: false,
        comingSoon: true,
      },
      {
        id: 'evidence_vault',
        label: 'Evidence Vault',
        description: 'Securely view captured media',
        type: 'nav',
        icon: '🔒',
      },
      {
        id: 'biometric_lock',
        label: 'Biometric Lock',
        description: 'Lock app with fingerprint or face',
        type: 'toggle',
        icon: '🔐',
        enabled: false,
        comingSoon: true,
      },
    ],
  },
  {
    title: 'About',
    items: [
      {
        id: 'version',
        label: 'Version',
        description: '1.0.0 (Part 1)',
        type: 'nav',
        icon: 'ℹ️',
      },
      {
        id: 'privacy_policy',
        label: 'Privacy Policy',
        type: 'nav',
        icon: '📄',
        comingSoon: true,
      },
      {
        id: 'terms',
        label: 'Terms of Service',
        type: 'nav',
        icon: '📜',
        comingSoon: true,
      },
    ],
  },
  {
    title: 'Developer',
    items: [
      {
        id: 'resources',
        label: 'Safety Resources',
        description: 'Emergency numbers & support',
        type: 'nav',
        icon: '🏥',
      },
      {
        id: 'wipe_db',
        label: 'Wipe Database',
        description: 'Delete all local incidents (Test Mode)',
        type: 'nav',
        icon: '🗑️',
      },
    ],
  },
];

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const [toggles, setToggles] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const loadSettings = async () => {
      await ShakeDetectionService.init();
      await AudioDistressService.init();
      const shakeConfig = ShakeDetectionService.getSettings();
      const audioConfig = AudioDistressService.getSettings();
      
      setToggles(prev => ({
        ...prev,
        shake_detection: shakeConfig.enabled,
        distress_detection: audioConfig.enabled,
      }));
    };
    loadSettings();
  }, []);

  const handleToggle = async (id: string, comingSoon?: boolean) => {
    if (comingSoon) return; // disable for Part 1
    const newValue = !toggles[id];
    setToggles((prev) => ({ ...prev, [id]: newValue }));

    if (id === 'shake_detection') {
      const current = ShakeDetectionService.getSettings();
      await ShakeDetectionService.saveSettings({ ...current, enabled: newValue });
      if (newValue) {
        Alert.alert('Shake SOS Enabled', 'Triple-shake your device to trigger SOS. This may cause false positives.');
      }
    }
    
    if (id === 'distress_detection') {
      const current = AudioDistressService.getSettings();
      await AudioDistressService.saveSettings({ ...current, enabled: newValue });
      if (newValue) {
        Alert.alert('Distress SOS Enabled', 'Loud continuous noises will trigger SOS. Ensure you grant microphone permissions.');
      }
    }
  };

  const [showPinModal, setShowPinModal] = useState(false);
  const [showSafeWordModal, setShowSafeWordModal] = useState(false);
  const [normalPin, setNormalPin] = useState('');
  const [duressPin, setDuressPin] = useState('');
  const [safeWord, setSafeWord] = useState('');

  const handleNav = (id: string) => {
    if (id === 'wipe_db') {
      Alert.alert(
        'Wipe Database',
        'Are you sure you want to delete ALL incidents and evidence? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Wipe Data', style: 'destructive', onPress: () => {
              DatabaseService.wipeDatabase();
              Alert.alert('Database wiped');
            }
          }
        ]
      );
    } else if (id === 'config_pins') {
      setShowPinModal(true);
    } else if (id === 'config_safeword') {
      SafeWordService.getSafeWord().then(word => {
        setSafeWord(word || '');
        setShowSafeWordModal(true);
      });
    } else if (id === 'resources') {
      navigation.navigate('Resources');
    } else if (id === 'evidence_vault') {
      navigation.navigate('EvidenceVault');
    } else if (id === 'fake_call') {
      Alert.alert('Fake Call', 'Call will start in 3 seconds...', [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start', 
          onPress: () => {
            setTimeout(() => {
              navigation.navigate('FakeCall', { callerName: 'Dad' });
            }, 3000);
          } 
        }
      ]);
    }
  };

  const savePins = async () => {
    if (normalPin.length !== 4 || duressPin.length !== 4) {
      Alert.alert('Error', 'PINs must be exactly 4 digits.');
      return;
    }
    if (normalPin === duressPin) {
      Alert.alert('Error', 'Normal and Duress PINs must be different.');
      return;
    }
    await PINService.setNormalPin(normalPin);
    await PINService.setDuressPin(duressPin);
    Alert.alert('Success', 'PINs saved securely.');
    setShowPinModal(false);
    setNormalPin('');
    setDuressPin('');
  };

  const saveSafeWord = async () => {
    if (safeWord.trim().length < 3) {
      Alert.alert('Error', 'Safe word must be at least 3 characters.');
      return;
    }
    await SafeWordService.setSafeWord(safeWord);
    await SafeWordService.setEnabled(true);
    Alert.alert('Success', 'Safe-word saved and enabled.');
    setShowSafeWordModal(false);
  };

  const testSafeWord = () => {
    SafeWordService.processAudioPhrase(`test ${safeWord} test`);
    setShowSafeWordModal(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Settings</Text>

        {SETTINGS_GROUPS.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <Card>
              {group.items.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <View style={styles.settingRow}>
                    <Text style={styles.settingIcon}>{item.icon}</Text>
                    <View style={styles.settingInfo}>
                      <View style={styles.settingLabelRow}>
                        <Text style={styles.settingLabel}>{item.label}</Text>
                        {item.comingSoon && (
                          <View style={styles.soonBadge}>
                            <Text style={styles.soonText}>Soon</Text>
                          </View>
                        )}
                      </View>
                      {item.description ? (
                        <Text style={styles.settingDesc}>{item.description}</Text>
                      ) : null}
                    </View>
                    {item.type === 'toggle' ? (
                      <Switch
                        value={toggles[item.id] ?? false}
                        onValueChange={() => handleToggle(item.id, item.comingSoon)}
                        trackColor={{
                          false: Colors.ui.border,
                          true: Colors.brand.primary + '88',
                        }}
                        thumbColor={
                          toggles[item.id] ? Colors.brand.primary : Colors.text.muted
                        }
                        disabled={item.comingSoon}
                      />
                    ) : (
                      <TouchableOpacity onPress={() => handleNav(item.id)}>
                        <Text style={styles.chevron}>›</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {idx < group.items.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Card>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showPinModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Configure PINs</Text>
            
            <Text style={styles.inputLabel}>Normal PIN (4 digits)</Text>
            <TextInput
              style={styles.textInput}
              value={normalPin}
              onChangeText={setNormalPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              placeholder="e.g. 1234"
            />
            
            <Text style={styles.inputLabel}>Duress PIN (4 digits)</Text>
            <Text style={styles.inputDesc}>Used if forced to cancel SOS. Disables alarm but secretly keeps emergency active.</Text>
            <TextInput
              style={styles.textInput}
              value={duressPin}
              onChangeText={setDuressPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              placeholder="e.g. 9999"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowPinModal(false)}>
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={savePins}>
                <Text style={styles.modalBtnTextSave}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showSafeWordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Configure Safe-word</Text>
            
            <Text style={styles.inputLabel}>Safe-word Phrase</Text>
            <Text style={styles.inputDesc}>Trigger SOS silently by saying this phrase when distressed.</Text>
            <TextInput
              style={styles.textInput}
              value={safeWord}
              onChangeText={setSafeWord}
              placeholder="e.g. pineapple"
              autoCapitalize="none"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={testSafeWord}>
                <Text style={styles.modalBtnTextCancel}>Test Trigger</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowSafeWordModal(false)}>
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={saveSafeWord}>
                <Text style={styles.modalBtnTextSave}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: 100,
  },
  pageTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text.primary,
    marginBottom: Spacing.xl,
    letterSpacing: -0.3,
  },
  group: { marginBottom: Spacing.xl },
  groupTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  settingIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  settingInfo: { flex: 1 },
  settingLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  settingLabel: {
    fontSize: Typography.sizes.base,
    color: Colors.text.primary,
    fontWeight: Typography.weights.medium,
  },
  settingDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    marginTop: 2,
  },
  soonBadge: {
    backgroundColor: Colors.brand.secondary + '22',
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.brand.secondary + '44',
  },
  soonText: {
    fontSize: 9,
    color: Colors.brand.secondary,
    fontWeight: Typography.weights.semibold,
    letterSpacing: 0.5,
  },
  chevron: {
    fontSize: Typography.sizes.xl,
    color: Colors.text.muted,
    fontWeight: Typography.weights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.bg.card,
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    width: '100%',
  },
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  inputDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.bg.primary,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    color: Colors.text.primary,
    fontSize: Typography.sizes.md,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  modalBtnCancel: {
    padding: Spacing.md,
  },
  modalBtnTextCancel: {
    color: Colors.text.secondary,
    fontWeight: Typography.weights.semibold,
  },
  modalBtnSave: {
    backgroundColor: Colors.brand.primary,
    padding: Spacing.md,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
  },
  modalBtnTextSave: {
    color: Colors.text.inverse,
    fontWeight: Typography.weights.bold,
  }
});
