import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../design/tokens';
import { JourneySentinelService, JourneyStatus } from '../services/JourneySentinelService';
import { LocationService } from '../services/LocationService';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';
import { Card } from '../components/ui';

export default function JourneyScreen() {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<JourneyStatus>('SAFE');
  const [destLat, setDestLat] = useState('28.6139');
  const [destLon, setDestLon] = useState('77.2090'); // New Delhi default
  const [currentLoc, setCurrentLoc] = useState<any>(null);
  const [inDangerZone, setInDangerZone] = useState(false);

  // Simulated Danger Zones (Low Light / High Crime areas)
  const dangerZones = [
    { id: 1, latitude: 28.6150, longitude: 77.2100, radius: 200 },
    { id: 2, latitude: 28.6100, longitude: 77.2050, radius: 300 }
  ];

  // Helper to calculate distance
  const getDistanceFromLatLonInM = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    var R = 6371e3; // Radius of the earth in m
    var dLat = (lat2-lat1) * (Math.PI/180);
    var dLon = (lon2-lon1) * (Math.PI/180); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; 
    return d;
  };

  useEffect(() => {
    LocationService.getCurrentLocation().then(loc => {
      if (loc) {
        setCurrentLoc({
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    });

    const interval = setInterval(() => {
      setIsActive(JourneySentinelService.isJourneyActive());
      setStatus(JourneySentinelService.getStatus());
      const cloc = JourneySentinelService.getLastLocation();
      if (cloc) {
        setCurrentLoc({
          latitude: cloc.latitude,
          longitude: cloc.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });

        // Check if user is in danger zone
        let isInZone = false;
        for (const zone of dangerZones) {
          const dist = getDistanceFromLatLonInM(cloc.latitude, cloc.longitude, zone.latitude, zone.longitude);
          if (dist <= zone.radius) {
            isInZone = true;
            break;
          }
        }
        setInDangerZone(isInZone);
      }
    }, 2000);

    JourneySentinelService.onCheckInRequested = () => {
      Alert.alert(
        'Safety Check-in',
        'Are you safe? Please confirm within 2 minutes or SOS will be triggered.',
        [
          { text: 'I am safe', onPress: () => JourneySentinelService.checkIn() }
        ]
      );
    };

    return () => {
      clearInterval(interval);
      JourneySentinelService.onCheckInRequested = null;
    };
  }, []);

  const handleStart = async () => {
    const lat = parseFloat(destLat);
    const lon = parseFloat(destLon);
    if (isNaN(lat) || isNaN(lon)) {
      Alert.alert('Error', 'Invalid destination coordinates');
      return;
    }
    await JourneySentinelService.startJourney({ latitude: lat, longitude: lon });
    setIsActive(true);
  };

  const handleEnd = async () => {
    await JourneySentinelService.endJourney();
    setIsActive(false);
    setStatus('COMPLETED');
  };

  const renderStatusBadge = () => {
    let color = Colors.brand.primary;
    if (status === 'UNEXPECTED_STOP' || status === 'ROUTE_DEVIATION') color = '#FF9500';
    if (status === 'CHECK_IN_REQUIRED' || status === 'ESCALATING') color = '#FF3B30';

    return (
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{status.replace(/_/g, ' ')}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>Journey Sentinel</Text>
      
      {!isActive ? (
        <View style={styles.setupContainer}>
          <Text style={styles.label}>Destination Latitude</Text>
          <TextInput
            style={styles.input}
            value={destLat}
            onChangeText={setDestLat}
            keyboardType="numeric"
          />
          <Text style={styles.label}>Destination Longitude</Text>
          <TextInput
            style={styles.input}
            value={destLon}
            onChangeText={setDestLon}
            keyboardType="numeric"
          />
          
          <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
            <Text style={styles.startBtnText}>Start Safe Journey</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.activeContainer}>
          <Card style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              {renderStatusBadge()}
            </View>
            <Text style={styles.infoText}>
              Monitoring route deviation and unexpected stops. You will be prompted to check in every 10 minutes.
            </Text>
          </Card>

          {inDangerZone && (
            <Card style={StyleSheet.flatten([styles.statusCard, { backgroundColor: 'rgba(255, 59, 48, 0.1)', borderColor: '#FF3B30', borderWidth: 1 }])}>
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: '#FF3B30' }]}>⚠️ DANGER ZONE ALERT</Text>
              </View>
              <Text style={styles.infoText}>
                You are entering a high-risk area reported by the community (Low Streetlights/Isolated). Stay alert.
              </Text>
            </Card>
          )}

          <View style={styles.mapContainer}>
            {currentLoc && (
              <MapView 
                style={styles.map} 
                region={currentLoc}
                showsUserLocation={true}
              >
                <Marker coordinate={{ latitude: parseFloat(destLat), longitude: parseFloat(destLon) }} title="Destination" />
                
                {/* Danger Zone Overlays */}
                {dangerZones.map(zone => (
                  <Circle
                    key={zone.id}
                    center={{ latitude: zone.latitude, longitude: zone.longitude }}
                    radius={zone.radius}
                    fillColor="rgba(255, 59, 48, 0.3)" // Transparent Red
                    strokeColor="rgba(255, 59, 48, 0.8)"
                    strokeWidth={2}
                  />
                ))}
              </MapView>
            )}
          </View>

          <TouchableOpacity style={styles.endBtn} onPress={handleEnd}>
            <Text style={styles.endBtnText}>End Journey</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
    padding: Spacing.lg,
  },
  header: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xl,
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.bg.card,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    padding: Spacing.md,
    borderRadius: Radius.md,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  startBtn: {
    backgroundColor: Colors.brand.primary,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  startBtnText: {
    color: '#fff',
    fontWeight: Typography.weights.bold,
    fontSize: Typography.sizes.md,
  },
  activeContainer: {
    flex: 1,
  },
  statusCard: {
    marginBottom: Spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  badgeText: {
    color: '#fff',
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  infoText: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
  },
  mapContainer: {
    flex: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  endBtn: {
    backgroundColor: '#FF3B30',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  endBtnText: {
    color: '#fff',
    fontWeight: Typography.weights.bold,
    fontSize: Typography.sizes.md,
  }
});
