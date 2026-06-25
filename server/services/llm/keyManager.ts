import dotenv from 'dotenv';
dotenv.config();

export class GeminiKeyManager {
  private keys: string[];
  private currentIndex: number;

  constructor() {
    const keysStr = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
    this.keys = keysStr.split(',').map(k => k.trim()).filter(k => k.length > 0);
    
    if (this.keys.length === 0) {
      console.warn('No Gemini API keys found in environment variables.');
    }
    
    this.currentIndex = 0;
  }

  public getNextKey(): string {
    if (this.keys.length === 0) return '';
    const key = this.keys[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return key;
  }

  public getKeyCount(): number {
    return this.keys.length;
  }
}

export const geminiKeyManager = new GeminiKeyManager();
