// SplashScreen — SafeHer
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Colors, Typography, Spacing } from '../design/tokens';
import { useApp } from '../state/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const { state, checkStoredSession } = useApp();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    checkStoredSession().then(() => {
      // Navigation handled by the root navigator based on state
    });
  }, []);

  useEffect(() => {
    if (!state.auth.isLoading) {
      const timer = setTimeout(() => {
        if (state.auth.isAuthenticated) {
          navigation.replace('Main');
        } else if (state.onboardingDone) {
          navigation.replace('Auth');
        } else {
          navigation.replace('Onboarding');
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.auth.isLoading, state.auth.isAuthenticated, state.onboardingDone]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoWrapper,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>🛡️</Text>
        </View>
        <Text style={styles.appName}>SafeHer</Text>
        <Text style={styles.tagline}>Your safety, always first</Text>
      </Animated.View>
      <Animated.Text style={[styles.poweredBy, { opacity: fadeAnim }]}>
        Powered by trust
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: { alignItems: 'center' },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.bg.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.brand.primary + '55',
    marginBottom: Spacing.lg,
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoIcon: { fontSize: 48 },
  appName: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text.primary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    letterSpacing: 0.5,
  },
  poweredBy: {
    position: 'absolute',
    bottom: 40,
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    letterSpacing: 1,
  },
});
