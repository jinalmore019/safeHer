import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { DatabaseService } from '../services/DatabaseService';
import { Incident } from '../types/models';
import { Colors, Typography, Spacing, Radius, Shadows } from '../design/tokens';
import { Card, Badge } from '../components/ui';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'IncidentHistory'>;
};

export default function IncidentHistoryScreen({ navigation }: Props) {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    // Fetch incidents when screen mounts
    const data = DatabaseService.getIncidents();
    setIncidents(data);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return Colors.status.danger;
      case 'resolved': return Colors.status.safe;
      case 'cancelled': return Colors.text.muted;
      default: return Colors.status.warning;
    }
  };

  const renderItem = ({ item }: { item: Incident }) => {
    const evCount = DatabaseService.getEvidenceForIncident(item.id).length;
    const endT = item.resolvedAt ? new Date(item.resolvedAt).getTime() : new Date().getTime();
    const durationMins = Math.round((endT - new Date(item.createdAt).getTime()) / 60000);
    
    return (
      <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={() => navigation.navigate('IncidentDetails', { incidentId: item.id })}
      >
        <Card style={styles.card}>
          <View style={styles.incidentRow}>
            <View>
              <Text style={styles.incidentDate}>{new Date(item.createdAt).toLocaleString()}</Text>
              <Text style={styles.incidentType}>Trigger: {item.triggerType.toUpperCase()}</Text>
              <Text style={[styles.incidentStatus, { color: getStatusColor(item.status) }]}>
                Status: {item.status.toUpperCase()}
              </Text>
            </View>
            {!item.synced && (
              <View style={styles.syncBadge}>
                <Text style={styles.syncText}>Pending Sync</Text>
              </View>
            )}
          </View>
          <View style={styles.cardBody}>
            {item.latitude && item.longitude ? (
              <Text style={styles.infoValue}>
                📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
              </Text>
            ) : null}
            <View style={styles.metricsRow}>
              <Text style={styles.metric}>⏱️ {durationMins}m</Text>
              <Text style={styles.metric}>📁 {evCount} Files</Text>
              {item.triggerType === 'duress' && <Text style={styles.metric}>⚠️ Duress</Text>}
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Incident History</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={incidents}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No incidents recorded.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },
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
  listContent: { padding: Spacing.base },
  card: {
    marginBottom: Spacing.base,
    backgroundColor: Colors.bg.card,
  },
  incidentRow: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incidentDate: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  incidentType: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  incidentStatus: {
    fontSize: Typography.sizes.sm,
    color: Colors.status.warning,
  },
  syncBadge: {
    backgroundColor: Colors.bg.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
  },
  syncText: {
    color: Colors.brand.primary,
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
  cardBody: {
    marginTop: Spacing.md,
  },
  infoValue: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  metric: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.brand.primary,
    backgroundColor: Colors.brand.primary + '11',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: Colors.text.muted,
    fontSize: Typography.sizes.md,
  },
});
