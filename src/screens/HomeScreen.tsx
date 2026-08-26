// HomeScreen — SafeHer
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '../design/tokens';
import { Card, Badge } from '../components/ui';
import { useApp } from '../state/AppContext';
import { useSOS } from '../state/SOSContext';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

export default function HomeScreen() {
  const { state } = useApp();
  const { triggerSOS, engineState } = useSOS();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const userName = state.auth.user?.name?.split(' ')[0] ?? 'there';

  const quickActions = [
    { icon: '👥', label: 'Trusted\nContacts', color: Colors.brand.secondary, onPress: () => {} },
    { icon: '📍', label: 'My\nLocation', color: Colors.brand.teal, onPress: () => {} },
    { icon: '📋', label: 'Incident\nLog', color: Colors.status.warning, onPress: () => navigation.navigate('IncidentHistory') },
    { icon: '⚙️', label: 'Settings', color: Colors.text.muted, onPress: () => {} },
  ];

  const safetyTips = [
    'Share your live location with a trusted contact when traveling alone.',
    'Keep your phone charged and data active at all times.',
    'Trust your instincts — if something feels wrong, leave immediately.',
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <View>
            <Text style={styles.greetSub}>Good day,</Text>
            <Text style={styles.greetName}>Hey {userName} 👋</Text>
          </View>
          <Badge label="✓ Safe" color={Colors.status.safe} />
        </View>

        {/* SOS BUTTON */}
        <View style={styles.sosContainer}>
          <TouchableOpacity 
            style={[styles.sosButton, engineState !== 'IDLE' && { opacity: 0.5 }]} 
            activeOpacity={0.8}
            onLongPress={triggerSOS}
            delayLongPress={500}
            disabled={engineState !== 'IDLE'}
            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <View style={styles.sosInner}>
              <Text style={styles.sosText}>SOS</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.sosHelpText}>HOLD TO TRIGGER EMERGENCY</Text>
        </View>

        {/* Status Card */}
        <Card style={styles.statusCard} elevated>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>You are safe</Text>
          </View>
          <Text style={styles.statusSub}>
            SOS and advanced features coming in Part 2
          </Text>
        </Card>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.8}
              onPress={action.onPress}
              style={[styles.actionCard, { borderColor: action.color + '33' }]}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Safety Tips */}
        <Text style={styles.sectionTitle}>Safety Tips</Text>
        {safetyTips.map((tip, i) => (
          <Card key={i} style={styles.tipCard}>
            <Text style={styles.tipNum}>{String(i + 1).padStart(2, '0')}</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </Card>
        ))}
      </ScrollView>
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
  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greetSub: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
    fontWeight: Typography.weights.medium,
  },
  greetName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  sosContainer: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  sosButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.status.danger + '22',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sosInner: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.status.danger,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: Colors.status.danger,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  sosText: {
    color: Colors.text.inverse,
    fontSize: 48,
    fontWeight: Typography.weights.extrabold,
    letterSpacing: 2,
  },
  sosHelpText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
  },
  statusCard: {
    marginBottom: Spacing.xl,
    backgroundColor: Colors.bg.elevated,
    borderColor: Colors.status.safe + '44',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.status.safe,
    shadowColor: Colors.status.safe,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  statusText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.status.safe,
  },
  statusSub: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
    lineHeight: Typography.sizes.sm * 1.6,
  },
  sectionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionCard: {
    width: '47%',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  actionIcon: { fontSize: 28 },
  actionLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontWeight: Typography.weights.medium,
  },
  tipCard: {
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  tipNum: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.brand.primary + '33',
    lineHeight: Typography.sizes.xxl,
    minWidth: 36,
  },
  tipText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.sizes.sm * 1.7,
  },
});
