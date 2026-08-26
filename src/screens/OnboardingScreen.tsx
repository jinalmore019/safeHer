// OnboardingScreen — SafeHer
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Animated,
  ListRenderItem,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Colors, Typography, Spacing, Radius } from '../design/tokens';
import { Button } from '../components/ui';
import { useApp } from '../state/AppContext';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  accentColor: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: '🛡️',
    title: 'Your Personal\nSafety Guardian',
    subtitle:
      'SafeHer keeps you protected with intelligent safety features designed for women on the move.',
    accentColor: Colors.brand.primary,
  },
  {
    id: '2',
    icon: '👥',
    title: 'Trusted Circle\nAlways Ready',
    subtitle:
      'Add trusted contacts who will be instantly alerted if you ever need help. Stay connected to those who care.',
    accentColor: Colors.brand.secondary,
  },
  {
    id: '3',
    icon: '🚨',
    title: 'One Touch,\nInstant Help',
    subtitle:
      'Activate SOS with a single tap. Your safety network is mobilized within seconds.',
    accentColor: Colors.brand.accent,
  },
  {
    id: '4',
    icon: '🔒',
    title: 'Private &\nSecure',
    subtitle:
      'Your data stays on your device. We believe your privacy is as important as your safety.',
    accentColor: Colors.brand.teal,
  },
];

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen({ navigation }: Props) {
  const { completeOnboarding } = useApp();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const handleNext = async () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      await completeOnboarding();
      navigation.replace('Auth');
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    navigation.replace('Auth');
  };

  const renderSlide: ListRenderItem<Slide> = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.iconCircle, { borderColor: item.accentColor + '44', shadowColor: item.accentColor }]}>
        <Text style={styles.icon}>{item.icon}</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );

  const currentSlide = SLIDES[activeIndex];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(idx);
        }}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i === activeIndex
                    ? currentSlide.accentColor
                    : Colors.ui.border,
                width: i === activeIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.bottomSection}>
        <Button
          title={activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          style={[
            styles.nextBtn,
            { backgroundColor: currentSlide.accentColor },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: Spacing.xl,
    zIndex: 10,
  },
  skipText: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingTop: 60,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.bg.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: Spacing.xxl,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  icon: { fontSize: 56 },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text.primary,
    textAlign: 'center',
    lineHeight: Typography.sizes.xxl * 1.25,
    letterSpacing: -0.5,
    marginBottom: Spacing.base,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.sizes.base * 1.7,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: Radius.full,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 48,
  },
  nextBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
