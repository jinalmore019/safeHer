import * as SecureStore from 'expo-secure-store';

const SAFE_WORD_KEY = 'safeher_safeword';
const SAFE_WORD_ENABLED_KEY = 'safeher_safeword_enabled';

export class SafeWordService {
  static onSafeWordTriggered: (() => void) | null = null;

  static async setSafeWord(word: string): Promise<void> {
    const normalized = word.trim().toLowerCase();
    await SecureStore.setItemAsync(SAFE_WORD_KEY, normalized);
  }

  static async getSafeWord(): Promise<string | null> {
    return await SecureStore.getItemAsync(SAFE_WORD_KEY);
  }

  static async setEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(SAFE_WORD_ENABLED_KEY, enabled ? 'true' : 'false');
  }

  static async isEnabled(): Promise<boolean> {
    const val = await SecureStore.getItemAsync(SAFE_WORD_ENABLED_KEY);
    return val === 'true';
  }

  /**
   * Called by a Speech-to-Text engine, or manually in test mode.
   * If the detected phrase contains the safe word, triggers SOS.
   */
  static async processAudioPhrase(phrase: string): Promise<boolean> {
    const enabled = await this.isEnabled();
    if (!enabled) return false;

    const safeWord = await this.getSafeWord();
    if (!safeWord) return false;

    const normalizedPhrase = phrase.trim().toLowerCase();
    if (normalizedPhrase.includes(safeWord)) {
      console.log(`[SafeWord] Safe word detected in phrase!`);
      if (this.onSafeWordTriggered) {
        this.onSafeWordTriggered();
      }
      return true;
    }
    return false;
  }
}
