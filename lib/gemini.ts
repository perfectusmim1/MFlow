import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY environment değişkeni tanımlanmamış');
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    if (GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-06-17' });
    }
  }

  async translateText(text: string, targetLanguage: string = 'tr', sourceLanguage: string = 'ja'): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini API anahtarı yapılandırılmamış');
    }

    try {
      const prompt = `
Lütfen aşağıdaki metni ${sourceLanguage} dilinden ${targetLanguage} diline çevir.
Metin bir manga/anime karakteri konuşmasından olabilir, bu yüzden doğal ve akıcı bir çeviri yap.
Sadece çeviriyi döndür, başka açıklama ekleme.

Çevrilecek metin: "${text}"
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const translatedText = response.text().trim();

      return translatedText;
    } catch (error) {
      console.error('Gemini çeviri hatası:', error);
      throw new Error('Çeviri başarısız');
    }
  }

  async translateMultipleTexts(
    texts: string[], 
    targetLanguage: string = 'tr', 
    sourceLanguage: string = 'ja'
  ): Promise<string[]> {
    if (!this.model) {
      throw new Error('Gemini API anahtarı yapılandırılmamış');
    }

    try {
      const textsString = texts.map((text, index) => `${index + 1}. "${text}"`).join('\n');
      
      const prompt = `
Lütfen aşağıdaki metinleri ${sourceLanguage} dilinden ${targetLanguage} diline çevir.
Bu metinler manga/anime sayfasından alınmıştır. Her satırı ayrı ayrı çevir.
Çeviriler doğal ve akıcı olmalı. Sadece çevirileri döndür, numaraları koru.

Çevrilecek metinler:
${textsString}

Format:
1. "çeviri1"
2. "çeviri2"
...
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const translatedResponse = response.text().trim();

      // Çeviriyi parçala ve döndür
      const translations = translatedResponse
        .split('\n')
        .map((line: string) => {
          const match = line.match(/^\d+\.\s*"(.+)"$/);
          return match ? match[1] : line.replace(/^\d+\.\s*/, '').replace(/"/g, '');
        })
        .filter((text: string) => text.length > 0);

      return translations;
    } catch (error) {
      console.error('Gemini toplu çeviri hatası:', error);
      throw new Error('Toplu çeviri başarısız');
    }
  }

  async detectLanguage(text: string): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini API anahtarı yapılandırılmamış');
    }

    try {
      const prompt = `
Aşağıdaki metnin dilini tespit et ve sadece dil kodunu döndür (örn: ja, en, ko, zh, tr).
Metin: "${text}"
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const language = response.text().trim().toLowerCase();

      return language;
    } catch (error) {
      console.error('Gemini dil tespiti hatası:', error);
      throw new Error('Dil tespiti başarısız');
    }
  }

  async improveTranslation(originalText: string, translation: string, context?: string): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini API anahtarı yapılandırılmamış');
    }

    try {
      const prompt = `
Aşağıdaki çeviriyi daha iyi hale getir. Manga/anime karakteri konuşması olduğunu düşün.
${context ? `Bağlam: ${context}` : ''}

Orijinal metin: "${originalText}"
Mevcut çeviri: "${translation}"

Daha doğal ve akıcı bir çeviri öner. Sadece geliştirilmiş çeviriyi döndür.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const improvedTranslation = response.text().trim();

      return improvedTranslation;
    } catch (error) {
      console.error('Gemini çeviri iyileştirme hatası:', error);
      throw new Error('Çeviri iyileştirme başarısız');
    }
  }

  isConfigured(): boolean {
    return !!this.model;
  }
}

export const geminiService = new GeminiService();
export default geminiService;