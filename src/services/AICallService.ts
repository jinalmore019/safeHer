interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export class AICallService {
  private static history: ChatMessage[] = [];
  
  static resetConversation() {
    this.history = [];
  }

  static async generateResponse(userSpeech: string): Promise<string> {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    const fallbackResponse = "I'm having a bit of trouble hearing you, but I'm on my way. Are you okay?";

    if (!apiKey) {
      console.warn('[AICallService] Missing EXPO_PUBLIC_GEMINI_API_KEY. Using fallback.');
      return fallbackResponse;
    }

    try {
      this.history.push({ role: 'user', parts: [{ text: userSpeech }] });

      const payload = {
        system_instruction: {
          parts: [{
            text: "You are a trusted friend on a phone call. The user is in a potentially unsafe situation and is using you as a 'fake escort call' to deter harassers. Respond in 1 or 2 short, natural sentences as if you are speaking on a real phone call. Do not use robotic language or long lists. Ask simple questions to keep the conversation going and make it sound authentic. Do not break character. Do not use asterisks or markdown."
          }]
        },
        contents: this.history,
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        console.warn(`[AICallService] API returned status ${response.status}`);
        return fallbackResponse;
      }

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (aiText) {
        this.history.push({ role: 'model', parts: [{ text: aiText }] });
        return aiText;
      }

      return fallbackResponse;
    } catch (e) {
      console.error('[AICallService] Error generating response:', e);
      return fallbackResponse;
    }
  }
}
