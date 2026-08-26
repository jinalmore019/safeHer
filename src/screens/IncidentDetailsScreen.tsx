import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Audio } from 'expo-audio';
import { RootStackParamList } from '../types/navigation';
import { DatabaseService } from '../services/DatabaseService';
import { Incident, Evidence } from '../types/models';
import { Colors, Typography, Spacing, Radius } from '../design/tokens';
import { Card } from '../components/ui';
import { ReportGeneratorService } from '../services/ReportGeneratorService';

type Props = NativeStackScreenProps<RootStackParamList, 'IncidentDetails'>;

export default function IncidentDetailsScreen({ route, navigation }: Props) {
  const { incidentId } = route.params;
  const [incident, setIncident] = useState<Incident | null>(null);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // We get the incident from all incidents
    const allIncidents = DatabaseService.getIncidents();
    const found = allIncidents.find(inc => inc.id === incidentId);
    if (found) {
      setIncident(found);
    }
    
    // Get evidence for this incident
    const evs = DatabaseService.getEvidenceForIncident(incidentId);
    setEvidenceList(evs);
    
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [incidentId]);

  const playAudio = async (uri: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      setSound(newSound);
      setIsPlaying(true);
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (err) {
      console.error('Failed to play audio:', err);
      setIsPlaying(false);
    }
  };

  if (!incident) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>Incident Not Found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Incident Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Incident Info */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.row}>
            <Text style={styles.label}>ID:</Text>
            <Text style={styles.value}>{incident.id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Type:</Text>
            <Text style={styles.value}>{incident.triggerType.toUpperCase()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.value, { color: incident.status === 'active' ? Colors.status.danger : Colors.status.safe }]}>
              {incident.status.toUpperCase()}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Time:</Text>
            <Text style={styles.value}>{new Date(incident.createdAt).toLocaleString()}</Text>
          </View>
        </Card>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.exportBtn}
            onPress={() => ReportGeneratorService.generateReportPDF(incident, evidenceList)}
          >
            <Text style={styles.exportBtnText}>📄 Export Report</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.exportBtn, { backgroundColor: Colors.status.danger }]}
            onPress={() => ReportGeneratorService.generateFIRDraftPDF(incident, evidenceList)}
          >
            <Text style={styles.exportBtnText}>⚖️ FIR Draft</Text>
          </TouchableOpacity>
        </View>

        {/* Evidence Section */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl, marginBottom: Spacing.md }]}>
          Emergency Evidence
        </Text>
        
        {evidenceList.length === 0 ? (
          <View style={styles.emptyEvidence}>
            <Text style={styles.emptyEvidenceText}>No evidence captured for this incident.</Text>
          </View>
        ) : (
          evidenceList.map(ev => (
            <Card key={ev.id} style={styles.evidenceCard}>
              <View style={styles.evidenceHeader}>
                <Text style={styles.evidenceType}>
                  {ev.type === 'photo' ? '📷 Photo' : '🎙️ Audio'}
                </Text>
                <View style={[styles.syncBadge, { borderColor: ev.isUploaded ? Colors.status.safe : Colors.status.warning }]}>
                  <Text style={[styles.syncText, { color: ev.isUploaded ? Colors.status.safe : Colors.status.warning }]}>
                    {ev.isUploaded ? 'UPLOADED' : 'PENDING SYNC'}
                  </Text>
                </View>
              </View>
              <Text style={styles.evidenceTime}>{new Date(ev.capturedAt).toLocaleTimeString()}</Text>

              {ev.type === 'photo' && (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: ev.localUri }} style={styles.photo} resizeMode="cover" />
                </View>
              )}

              {ev.type === 'audio' && (
                <TouchableOpacity 
                  style={styles.audioBtn}
                  onPress={() => playAudio(ev.localUri)}
                >
                  <Text style={styles.audioBtnText}>{isPlaying ? 'Playing...' : 'Play Audio Clip'}</Text>
                </TouchableOpacity>
              )}
            </Card>
          ))
        )}

      </ScrollView>
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
  container: { flex: 1 },
  content: { padding: Spacing.base, paddingBottom: Spacing.xxl },
  card: { padding: Spacing.lg, backgroundColor: Colors.bg.card, marginBottom: Spacing.md },
  sectionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
  },
  value: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.secondary,
  },
  emptyEvidence: {
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.md,
  },
  emptyEvidenceText: {
    color: Colors.text.muted,
    fontSize: Typography.sizes.sm,
  },
  evidenceCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  evidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  evidenceType: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  syncBadge: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  syncText: {
    fontSize: 9,
    fontWeight: Typography.weights.bold,
  },
  evidenceTime: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    marginBottom: Spacing.md,
  },
  photoContainer: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.ui.border,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  audioBtn: {
    backgroundColor: Colors.brand.primary,
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  audioBtnText: {
    color: Colors.text.inverse,
    fontWeight: Typography.weights.bold,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  exportBtn: {
    flex: 1,
    backgroundColor: Colors.brand.primary,
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  exportBtnText: {
    color: '#fff',
    fontWeight: Typography.weights.bold,
  }
});
