// App.tsx — SafeHer Entry Point
import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import { AppProvider } from './src/state/AppContext';
import { SOSProvider } from './src/state/SOSContext';
import RootNavigator from './src/navigation/RootNavigator';
import { SOSEngineOverlay } from './src/components/SOSEngineOverlay';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <AppProvider>
          <SOSProvider>
            <StatusBar style="light" />
            <RootNavigator />
            <SOSEngineOverlay />
          </SOSProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
