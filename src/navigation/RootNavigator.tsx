// Root Navigator — SafeHer
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';

import { RootStackParamList, AuthStackParamList, MainTabParamList } from '../types/navigation';
import { Colors, Typography, Spacing } from '../design/tokens';

// Screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import TrustedContactsScreen from '../screens/TrustedContactsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import IncidentHistoryScreen from '../screens/IncidentHistoryScreen';
import IncidentDetailsScreen from '../screens/IncidentDetailsScreen';
import FakeCallScreen from '../screens/FakeCallScreen';
import JourneyScreen from '../screens/JourneyScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import EvidenceVaultScreen from '../screens/EvidenceVaultScreen';

// ─── Stacks ──────────────────────────────────────────────────────────────────
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

// ─── Auth Stack ───────────────────────────────────────────────────────────────
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// ─── Tab Icon ─────────────────────────────────────────────────────────────────
function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconFocused]}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconActive]}>{icon}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFocused: {
    backgroundColor: Colors.brand.primary + '20',
  },
  icon: { fontSize: 22 },
  iconActive: {},
});

// ─── Main Tab Navigator ───────────────────────────────────────────────────────
function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bg.secondary,
          borderTopColor: Colors.ui.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.brand.primary,
        tabBarInactiveTintColor: Colors.text.muted,
        tabBarLabelStyle: {
          fontSize: Typography.sizes.xs,
          fontWeight: Typography.weights.medium,
          marginTop: 2,
        },
      }}
    >
      <MainTab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <MainTab.Screen
        name="TrustedContacts"
        component={TrustedContactsScreen}
        options={{
          tabBarLabel: 'Contacts',
          tabBarIcon: ({ focused }) => <TabIcon icon="👥" focused={focused} />,
        }}
      />
      <MainTab.Screen
        name="Journey"
        component={JourneyScreen}
        options={{
          tabBarLabel: 'Journey',
          tabBarIcon: ({ focused }) => <TabIcon icon="🗺️" focused={focused} />,
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
        }}
      />
      <MainTab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} />,
        }}
      />
    </MainTab.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────
export default function RootNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        <RootStack.Screen name="Auth" component={AuthNavigator} />
        <RootStack.Screen name="Main" component={MainNavigator} />
        <RootStack.Screen name="IncidentHistory" component={IncidentHistoryScreen} />
        <RootStack.Screen name="IncidentDetails" component={IncidentDetailsScreen} />
        <RootStack.Screen name="Resources" component={ResourcesScreen} />
        <RootStack.Screen name="EvidenceVault" component={EvidenceVaultScreen} />
        <RootStack.Screen name="FakeCall" component={FakeCallScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
