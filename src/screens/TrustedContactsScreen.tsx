// TrustedContactsScreen — SafeHer
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
import { Button, Input, Card, Divider } from '../components/ui';
import { TrustedContact } from '../types/models';
import { validateName, validatePhone } from '../utils/validation';
import { DatabaseService } from '../services/DatabaseService';

export default function TrustedContactsScreen() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const resetForm = () => {
    setName('');
    setPhone('');
    setRelationship('');
    setErrors({});
    setShowForm(false);
  };

  React.useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = () => {
    setContacts(DatabaseService.getContacts());
  };

  const handleAdd = () => {
    const nameR = validateName(name);
    const phoneR = validatePhone(phone);
    const newErrors: typeof errors = {};
    if (!nameR.valid) newErrors.name = nameR.error;
    if (!phoneR.valid) newErrors.phone = phoneR.error;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const newId = `contact-${Date.now()}`;
    DatabaseService.addContact(newId, name.trim(), phone.trim(), relationship.trim() || 'Contact', true);
    loadContacts();
    resetForm();
  };

  const handleDelete = (id: string, contactName: string) => {
    Alert.alert(
      'Remove Contact',
      `Remove ${contactName} from your trusted contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            DatabaseService.deleteContact(id);
            loadContacts();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Trusted Contacts</Text>
            <Text style={styles.subtitle}>{contacts.length} contacts added</Text>
          </View>
          {!showForm && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowForm(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Add Form */}
        {showForm && (
          <Card style={styles.formCard} elevated>
            <Text style={styles.formTitle}>New Trusted Contact</Text>
            <Divider />
            <Input
              label="Name"
              placeholder="Contact name"
              value={name}
              onChangeText={setName}
              error={errors.name}
              autoCapitalize="words"
            />
            <Input
              label="Phone Number"
              placeholder="+91 98765 43210"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              error={errors.phone}
            />
            <Input
              label="Relationship (optional)"
              placeholder="e.g. Sister, Friend, Mom"
              value={relationship}
              onChangeText={setRelationship}
              autoCapitalize="words"
            />
            <View style={styles.formActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={resetForm}
                style={styles.formBtn}
                fullWidth={false}
              />
              <Button
                title="Add Contact"
                onPress={handleAdd}
                style={styles.formBtn}
                fullWidth={false}
              />
            </View>
          </Card>
        )}

        {/* Contacts List */}
        <Text style={styles.sectionTitle}>Your Contacts</Text>
        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No trusted contacts yet</Text>
            <Text style={styles.emptySubtext}>Add someone you trust for emergency alerts</Text>
          </View>
        ) : (
          contacts.map((contact) => (
            <Card key={contact.id} style={styles.contactCard}>
              <View style={styles.contactRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {contact.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <View style={styles.contactNameRow}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    {contact.isVerified && (
                      <Text style={styles.verifiedBadge}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                  <Text style={styles.contactRelation}>{contact.relationship}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(contact.id, contact.name)}
                  style={styles.deleteBtn}
                >
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Divider style={styles.contactDivider} />
              <View style={styles.notifyRow}>
                <Text style={styles.notifyLabel}>🚨 SOS Alert</Text>
                <Text style={[styles.notifyStatus, contact.notifyOnSOS && styles.notifyOn]}>
                  {contact.notifyOnSOS ? 'On' : 'Off'}
                </Text>
              </View>
            </Card>
          ))
        )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  addBtnText: {
    color: '#fff',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  formCard: {
    marginBottom: Spacing.xl,
    backgroundColor: Colors.bg.elevated,
  },
  formTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  formBtn: { flex: 1 },
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.base },
  emptyText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.secondary,
  },
  emptySubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  contactCard: { marginBottom: Spacing.md },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brand.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.brand.primary + '44',
  },
  avatarText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.brand.primary,
  },
  contactInfo: { flex: 1 },
  contactNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  contactName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
  verifiedBadge: {
    fontSize: Typography.sizes.xs,
    color: Colors.status.safe,
    fontWeight: Typography.weights.bold,
  },
  contactPhone: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  contactRelation: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    marginTop: 1,
  },
  deleteBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: Colors.status.danger,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
  },
  contactDivider: { marginVertical: Spacing.sm },
  notifyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  notifyLabel: { fontSize: Typography.sizes.sm, color: Colors.text.muted },
  notifyStatus: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.muted,
  },
  notifyOn: { color: Colors.status.safe },
});
