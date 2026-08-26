import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const NORMAL_PIN_KEY = 'safeher_normal_pin_hash';
const DURESS_PIN_KEY = 'safeher_duress_pin_hash';

export const PINService = {
  // Hash PIN before storing/comparing
  hashPin: async (pin: string): Promise<string> => {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `salt_${pin}_safeher_2026`
    );
  },

  setNormalPin: async (pin: string): Promise<void> => {
    const hash = await PINService.hashPin(pin);
    await SecureStore.setItemAsync(NORMAL_PIN_KEY, hash);
  },

  setDuressPin: async (pin: string): Promise<void> => {
    const hash = await PINService.hashPin(pin);
    await SecureStore.setItemAsync(DURESS_PIN_KEY, hash);
  },

  verifyPin: async (pin: string): Promise<'NORMAL' | 'DURESS' | 'INVALID'> => {
    const hash = await PINService.hashPin(pin);
    const storedNormal = await SecureStore.getItemAsync(NORMAL_PIN_KEY);
    const storedDuress = await SecureStore.getItemAsync(DURESS_PIN_KEY);

    if (storedNormal === hash) {
      return 'NORMAL';
    }
    if (storedDuress === hash) {
      return 'DURESS';
    }

    // Fallback defaults for dev testing if none set
    if (!storedNormal && !storedDuress) {
      if (pin === '1234') return 'NORMAL';
      if (pin === '9999') return 'DURESS';
    }

    return 'INVALID';
  },

  hasPinsConfigured: async (): Promise<boolean> => {
    const normal = await SecureStore.getItemAsync(NORMAL_PIN_KEY);
    const duress = await SecureStore.getItemAsync(DURESS_PIN_KEY);
    return !!(normal && duress);
  }
};
