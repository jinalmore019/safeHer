import { registerWebModule, NativeModule } from 'expo';

// SafeherSmsModule is not available on the web platform.
class SafeherSmsModule extends NativeModule<{}> {}

export default registerWebModule(SafeherSmsModule, 'SafeherSmsModule');
