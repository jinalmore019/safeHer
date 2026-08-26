import SafeherBackgroundModule from './src/SafeherBackgroundModule';

export function startBackgroundService() {
  return SafeherBackgroundModule.startService();
}

export function stopBackgroundService() {
  return SafeherBackgroundModule.stopService();
}
