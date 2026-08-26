import { NativeModule, requireNativeModule } from 'expo-modules-core';

declare class SafeherBackgroundModule extends NativeModule<{}> {
  startService(): void;
  stopService(): void;
}

export default requireNativeModule<SafeherBackgroundModule>('SafeherBackground');
