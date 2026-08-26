// ProfileScreen — SafeHer
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '../design/tokens';
import { Card, Input, Button, Divider } from '../components/ui';
import { useApp } from '../state/AppContext';
import { validateName, validateEmail } from '../utils/validation';

export default function ProfileScreen() {
  const { state, logout } = useApp();
  const user = state.auth.user;

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const nameR = validateName(name);
    const emailR = validateEmail(email);
    const newErrors: typeof errors = {};
    if (!nameR.valid) newErrors.name = nameR.error;
    if (!emailR.valid) newErrors.email = emailR.error;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    // Profile save will be wired up in Part 2
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
          <Text style={styles.userPhone}>{user?.phone ?? ''}</Text>
        </View>

        {/* Edit Profile */}
        <Card style={styles.section} elevated>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
          <Divider />
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            error={errors.name}
            autoCapitalize="words"
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <Button
            title={saved ? '✓ Saved' : 'Save Changes'}
            onPress={handleSave}
            variant={saved ? 'outline' : 'primary'}
            size="md"
          />
        </Card>

        {/* Account Info */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Divider />
          <InfoRow label="Phone" value={user?.phone ?? '—'} />
          <InfoRow label="Role" value={user?.role ?? '—'} capitalize />
          <InfoRow
            label="Member since"
            value={
              user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'
            }
          />
        </Card>

        {/* Danger Zone */}
        <Button
          title="Sign Out"
          variant="outline"
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={[infoStyles.value, capitalize && infoStyles.capitalize]}>
        {value}
      </Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  label: { fontSize: Typography.sizes.sm, color: Colors.text.muted },
  value: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium,
  },
  capitalize: { textTransform: 'capitalize' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: 100,
  },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.brand.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.brand.primary + '55',
    marginBottom: Spacing.md,
    ...Shadows.lg,
  },
  avatarText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.brand.primary,
  },
  userName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  userPhone: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
    marginTop: 2,
  },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  logoutBtn: {
    borderColor: Colors.status.danger,
    marginBottom: Spacing.xl,
  },
});
