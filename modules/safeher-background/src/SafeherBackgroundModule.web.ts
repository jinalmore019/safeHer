import { registerWebModule, NativeModule } from 'expo';

class SafeherBackgroundModule extends NativeModule<{}> {
  startService(): void {}
  stopService(): void {}
}

export default registerWebModule(SafeherBackgroundModule, 'SafeherBackground');
