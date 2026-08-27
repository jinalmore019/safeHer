import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../design/tokens';
import { JourneySentinelService, JourneyStatus } from '../services/JourneySentinelService';
import { LocationService } from '../services/LocationService';
import { RoutingService } from '../services/RoutingService';
import { SafetyScoringService, SafetyScoreResult, COMMUNITY_DANGER_ZONES } from '../services/SafetyScoringService';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';
import { Card } from '../components/ui';

export default function JourneyScreen() {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<JourneyStatus>('SAFE');
  
  const [sourceAddress, setSourceAddress] = useState('');
  const [destAddress, setDestAddress] = useState('');
  
  const [sourceCoords, setSourceCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [distanceText, setDistanceText] = useState('');
  const [durationText, setDurationText] = useState('');
  
  const [safetyScoreInfo, setSafetyScoreInfo] = useState<SafetyScoreResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentLoc, setCurrentLoc] = useState<any>(null);
  const [inDangerZone, setInDangerZone] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Helper to calculate distance locally
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
    const initLocation = async () => {
      const hasPermission = await LocationService.requestPermissions();
      setHasLocationPermission(hasPermission);
      if (hasPermission) {
        const loc = await LocationService.getCurrentLocation();
        if (loc) {
          setCurrentLoc({
            latitude: loc.latitude,
            longitude: loc.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      } else {
        Alert.alert('Permission Required', 'SafeHer needs location permissions to track your journey and verify route deviations.');
      }
    };

    initLocation();

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
        for (const zone of COMMUNITY_DANGER_ZONES) {
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
    if (!sourceAddress.trim() || !destAddress.trim()) {
      Alert.alert('Validation Error', 'Please enter both source and destination locations.');
      return;
    }

    setIsSearching(true);
    try {
      // 1. Geocode Source
      const resolvedSource = await RoutingService.geocodeAddress(sourceAddress);
      if (!resolvedSource) {
        Alert.alert(
          'Location Not Found',
          `Could not resolve coordinates for source: "${sourceAddress}". Please try being more specific.`
        );
        setIsSearching(false);
        return;
      }

      // 2. Geocode Destination
      const resolvedDest = await RoutingService.geocodeAddress(destAddress);
      if (!resolvedDest) {
        Alert.alert(
          'Location Not Found',
          `Could not resolve coordinates for destination: "${destAddress}". Please try being more specific.`
        );
        setIsSearching(false);
        return;
      }

      // 3. Same location validation
      const distanceBetweenPoints = SafetyScoringService.calculateDistance(
        resolvedSource.latitude, resolvedSource.longitude,
        resolvedDest.latitude, resolvedDest.longitude
      );

      if (distanceBetweenPoints < 15) {
        Alert.alert('Validation Error', 'Source and destination locations are too close to each other. Please select different points.');
        setIsSearching(false);
        return;
      }

      // 4. Calculate Route
      const routeInfo = await RoutingService.calculateRoute(resolvedSource, resolvedDest);

      // 5. Calculate Safety Score
      const safetyResult = SafetyScoringService.calculateSafetyScore(routeInfo.coordinates);

      // 6. Update Screen State
      setSourceCoords(resolvedSource);
      setDestCoords(resolvedDest);
      setRouteCoords(routeInfo.coordinates);
      setDistanceText(`${routeInfo.distanceKm} km`);
      setDurationText(`${routeInfo.durationMinutes} mins`);
      setSafetyScoreInfo(safetyResult);

      // Adjust Map view to frame both points
      setCurrentLoc({
        latitude: (resolvedSource.latitude + resolvedDest.latitude) / 2,
        longitude: (resolvedSource.longitude + resolvedDest.longitude) / 2,
        latitudeDelta: Math.max(Math.abs(resolvedSource.latitude - resolvedDest.latitude) * 1.5, 0.005),
        longitudeDelta: Math.max(Math.abs(resolvedSource.longitude - resolvedDest.longitude) * 1.5, 0.005),
      });

      // Start sentinel monitoring on destination and route deviation
      await JourneySentinelService.startJourney(resolvedDest, routeInfo.coordinates);
      setIsActive(true);

    } catch (e: any) {
      console.error(e);
      Alert.alert(
        'Route Error',
        e.message || 'Failed to compute route. Please verify your internet connection and try again.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleEnd = async () => {
    await JourneySentinelService.endJourney();
    setIsActive(false);
    setStatus('COMPLETED');
    setSourceCoords(null);
    setDestCoords(null);
    setRouteCoords([]);
    setDistanceText('');
    setDurationText('');
    setSafetyScoreInfo(null);
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.setupContainer}>
            <Text style={styles.label}>Source Location</Text>
            <TextInput
              style={styles.input}
              value={sourceAddress}
              onChangeText={setSourceAddress}
              placeholder="Enter starting point (e.g. Rajkot Railway Station)"
              placeholderTextColor="#8888aa"
              editable={!isSearching}
            />
            <Text style={styles.label}>Destination Location</Text>
            <TextInput
              style={styles.input}
              value={destAddress}
              onChangeText={setDestAddress}
              placeholder="Enter destination (e.g. Crystal Mall Rajkot)"
              placeholderTextColor="#8888aa"
              editable={!isSearching}
            />
            
            <TouchableOpacity 
              style={[styles.startBtn, isSearching && styles.disabledBtn]} 
              onPress={handleStart}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.startBtnText}>Find Safe Route</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
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

          {/* Route Info Badge */}
          {distanceText ? (
            <Card style={styles.infoCard}>
              <Text style={styles.metaText}>📍 {sourceAddress} → 🏁 {destAddress}</Text>
              <Text style={styles.metaText}>📏 Distance: {distanceText}  |  ⏱️ ETA: {durationText}</Text>
            </Card>
          ) : null}

          {/* Safe Route Safety Score Card (Pluggable Abstraction) */}
          {safetyScoreInfo ? (
            <Card style={StyleSheet.flatten([
              styles.statusCard, 
              { 
                backgroundColor: safetyScoreInfo.rating === 'EXCELLENT' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 149, 0, 0.1)', 
                borderColor: safetyScoreInfo.rating === 'EXCELLENT' ? '#22c55e' : '#FF9500', 
                borderWidth: 1 
              }
            ])}>
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: safetyScoreInfo.rating === 'EXCELLENT' ? '#22c55e' : '#FF9500' }]}>
                  🛡️ Safety Rating: {safetyScoreInfo.rating} ({safetyScoreInfo.score}/100)
                </Text>
              </View>
              {safetyScoreInfo.intersectedZones.length > 0 ? (
                <View>
                  <Text style={styles.infoText}>
                    This route intersects with community warnings:
                  </Text>
                  {safetyScoreInfo.intersectedZones.map(zone => (
                    <Text key={zone.id} style={styles.warningDetailText}>
                      • {zone.name} ({zone.riskFactors.join(', ')})
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={styles.infoText}>
                  Your calculated route avoids all currently reported community danger corridors.
                </Text>
              )}
            </Card>
          ) : null}

          {inDangerZone && (
            <Card style={StyleSheet.flatten([styles.statusCard, { backgroundColor: 'rgba(255, 59, 48, 0.1)', borderColor: '#FF3B30', borderWidth: 1 }])}>
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: '#FF3B30' }]}>⚠️ DANGER ZONE ALERT</Text>
              </View>
              <Text style={styles.infoText}>
                You are entering a high-risk area reported by the community. Stay alert.
              </Text>
            </Card>
          )}

          <View style={styles.mapContainer}>
            {currentLoc && (
              <MapView 
                style={styles.map} 
                region={currentLoc}
                showsUserLocation={hasLocationPermission}
              >
                {sourceCoords && (
                  <Marker coordinate={sourceCoords} title="Source" pinColor="#22c55e" />
                )}
                {destCoords && (
                  <Marker coordinate={destCoords} title="Destination" />
                )}
                
                {/* Draw Route Polyline */}
                {routeCoords.length >= 2 && (
                  <Polyline
                    coordinates={routeCoords}
                    strokeColor={Colors.brand.primary}
                    strokeWidth={4}
                  />
                )}
                
                {/* Danger Zone Overlays */}
                {COMMUNITY_DANGER_ZONES.map(zone => (
                  <Circle
                    key={zone.id}
                    center={{ latitude: zone.latitude, longitude: zone.longitude }}
                    radius={zone.radius}
                    fillColor="rgba(255, 59, 48, 0.2)"
                    strokeColor="rgba(255, 59, 48, 0.6)"
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
  scrollContent: {
    flexGrow: 1,
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
    paddingVertical: Spacing.xl,
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
    justifyContent: 'center',
    minHeight: 54,
  },
  disabledBtn: {
    opacity: 0.7,
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
    marginBottom: Spacing.md,
  },
  infoCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.bg.card,
    borderWidth: 1,
    borderColor: Colors.ui.border,
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
  metaText: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    lineHeight: 22,
  },
  warningDetailText: {
    color: '#FF9500',
    fontSize: Typography.sizes.xs,
    marginTop: 4,
    fontWeight: Typography.weights.medium,
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
