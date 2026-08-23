import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
// Assuming @google/generative-ai provides the SDK. We'll use the basic Google AI client.

export interface PreVisitOutput {
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  chiefComplaint: string;
  suggestedQuestions: string[];
}

export interface PostVisitOutput {
  summary: string;
  medications: any[];
  followUp: string[];
  safetyNote: string;
}

export interface ILLMProvider {
  generatePreVisitSummary(symptoms: string): Promise<PreVisitOutput>;
  generatePostVisitSummary(notes: string, prescriptionDetails: any[]): Promise<PostVisitOutput>;
}

@Injectable()
export class GeminiProvider implements ILLMProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private ai: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('geminiApiKey');
    this.logger.log(`Initializing Gemini with API key: ${apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET'}`);
    
    if (apiKey && apiKey !== 'your-gemini-api-key') {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        this.ai = new GoogleGenerativeAI(apiKey);
        this.logger.log('Gemini AI initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize Gemini AI:', error);
      }
    } else {
      this.logger.warn('Gemini API key not configured or set to placeholder value');
    }
  }

  async generatePreVisitSummary(symptoms: string): Promise<PreVisitOutput> {
    if (!this.ai) {
      this.logger.warn('Gemini API key not configured. Returning fallback pre-visit summary.');
      return {
        urgencyLevel: 'LOW',
        chiefComplaint: 'Fallback complaint (AI Not Configured)',
        suggestedQuestions: ['What should I know?', 'When to return?']
      };
    }

    try {
      const model = this.ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `
        Analyze these symptoms: "${symptoms}".
        Return a JSON object matching this schema exactly without markdown formatting:
        {
          "urgencyLevel": "LOW" | "MEDIUM" | "HIGH",
          "chiefComplaint": "string",
          "suggestedQuestions": ["string", "string", "string"]
        }
      `;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      // Simple JSON extraction
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      this.logger.log(`Gemini pre-visit analysis complete for symptoms: ${symptoms.substring(0, 50)}...`);
      return JSON.parse(jsonStr) as PreVisitOutput;
    } catch (e) {
      this.logger.error(`LLM Failure for pre-visit summary: ${e.message}`, e.stack);
      throw new Error('LLM_PROCESSING_FAILED');
    }
  }

  async generatePostVisitSummary(notes: string, prescriptionDetails: any[]): Promise<PostVisitOutput> {
    if (!this.ai) {
      this.logger.warn('Gemini API key not configured. Returning fallback post-visit summary.');
      return {
        summary: 'Fallback summary (AI Not Configured). Please take medications as prescribed.',
        medications: prescriptionDetails,
        followUp: ['Return if symptoms worsen.'],
        safetyNote: 'This is not medical advice.'
      };
    }

    try {
      const model = this.ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `
        Convert these clinical notes into a patient-friendly summary: "${notes}".
        Medications: ${JSON.stringify(prescriptionDetails)}
        Return a JSON object exactly:
        {
          "summary": "string",
          "medications": [{ "name": "...", "dose": "...", "frequency": "...", "duration": "..." }],
          "followUp": ["string"],
          "safetyNote": "string"
        }
      `;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonStr = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      this.logger.log(`Gemini post-visit summary generated successfully`);
      return JSON.parse(jsonStr) as PostVisitOutput;
    } catch (e) {
      this.logger.error(`LLM Failure for post-visit summary: ${e.message}`, e.stack);
      throw new Error('LLM_PROCESSING_FAILED');
    }
  }
}

@Injectable()
export class LlmService {
  private provider: ILLMProvider;

  constructor(private configService: ConfigService) {
    // We default to Gemini as per instructions. We could switch based on config.
    this.provider = new GeminiProvider(this.configService);
  }

  getProvider(): ILLMProvider {
    return this.provider;
  }
}
