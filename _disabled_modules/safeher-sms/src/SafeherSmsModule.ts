import { NativeModule, requireNativeModule } from 'expo';

declare class SafeherSmsModule extends NativeModule<{}> {
  sendSmsAsync(phoneNumber: string, message: string): Promise<boolean>;
}

export default requireNativeModule<SafeherSmsModule>('SafeherSms');
