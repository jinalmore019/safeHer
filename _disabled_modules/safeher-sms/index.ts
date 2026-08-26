import SafeherSmsModule from './src/SafeherSmsModule';

export async function sendSmsAsync(phoneNumber: string, message: string): Promise<boolean> {
  return await SafeherSmsModule.sendSmsAsync(phoneNumber, message);
}
