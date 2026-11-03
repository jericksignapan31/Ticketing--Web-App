import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiResponse {
  text: string;
  confidence?: number;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

@Injectable()
export class GeminiService {
  private logger = new Logger('GeminiService');
  private genAI?: GoogleGenerativeAI;
  private model?: any;
  private isAvailable: boolean = false;

  constructor(private configService: ConfigService) {
    this.initializeGemini();
  }

  /**
   * Initialize Gemini API with Google API key
   */
  private initializeGemini(): void {
    try {
      const apiKey = this.configService.get<string>('GOOGLE_GEMINI_API_KEY');
      
      if (!apiKey) {
        this.logger.warn('⚠️  GOOGLE_GEMINI_API_KEY not found in environment variables');
        this.logger.warn('Chatbot will work in fallback mode (basic responses only)');
        this.isAvailable = false;
        return;
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash', // Using faster flash model for real-time chat
        systemInstruction: this.getSystemPrompt(),
      });

      this.isAvailable = true;
      this.logger.log('✅ Gemini API initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Gemini API', error);
      this.isAvailable = false;
    }
  }

  /**
   * Check if Gemini API is available
   */
  isGeminiAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Get system prompt for chatbot
   */
  private getSystemPrompt(): string {
    return `You are an AI assistant for an IT Help Desk ticketing system named "IT Help Desk Bot".

Your responsibilities:
1. Help employees with IT issues and technical problems
2. Provide clear, step-by-step troubleshooting guidance
3. Offer information about IT policies and procedures
4. Help create support tickets when needed
5. Escalate to human IT staff when issues are beyond your scope

Guidelines:
- Be friendly, professional, and helpful
- Use simple language, avoid technical jargon when possible
- Provide step-by-step solutions for technical issues
- Always confirm important actions (like ticket creation)
- Be honest about limitations - escalate complex issues to human IT staff
- Suggest ticket creation for urgent or persistent problems
- Keep responses concise but informative (2-3 paragraphs max)
- Use markdown formatting for better readability

When suggesting ticket creation:
- Summarize the issue clearly
- Recommend a priority level (Low, Medium, High, Urgent)
- Suggest a category (Hardware, Software, Network, Access, Other)

When escalating:
- Explain why human help is needed
- Suggest contacting IT directly
- Offer to help create a support ticket`;
  }

  /**
   * Generate a response using Gemini API
   */
  async generateResponse(
    userMessage: string,
    context?: {
      userRole?: string;
      userDepartment?: string;
      recentTickets?: any[];
      conversationHistory?: Array<{ role: string; content: string }>;
    },
  ): Promise<GeminiResponse> {
    if (!this.isAvailable || !this.model) {
      this.logger.warn('Gemini API not available, using fallback response');
      return this.getFallbackResponse(userMessage);
    }

    try {
      // Build context-aware prompt
      const contextPrompt = this.buildContextPrompt(userMessage, context);

      const result = await this.model.generateContent(contextPrompt);
      const response = result.response;
      const text = response.text();

      this.logger.debug(`Generated response: ${text.substring(0, 100)}...`);

      return {
        text,
        confidence: 0.9, // High confidence for AI-generated responses
        usage: {
          input_tokens: response.usageMetadata?.promptTokenCount || 0,
          output_tokens: response.usageMetadata?.candidatesTokenCount || 0,
        },
      };
    } catch (error) {
      this.logger.error('Error calling Gemini API:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * Detect intent from user message
   */
  async detectIntent(
    userMessage: string,
  ): Promise<{
    intent: string;
    confidence: number;
    details?: Record<string, any>;
  }> {
    if (!this.isAvailable || !this.model) {
      return this.detectIntentFallback(userMessage);
    }

    try {
      const intentPrompt = `Analyze this user message and determine the primary intent.
      
Message: "${userMessage}"

Respond ONLY in this JSON format (no markdown, no extra text):
{
  "intent": "FAQ|TICKET_CREATION|TROUBLESHOOTING|TICKET_STATUS|ESCALATION|GENERAL",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;

      const result = await this.model.generateContent(intentPrompt);
      const responseText = result.response.text();

      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.detectIntentFallback(userMessage);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        intent: parsed.intent || 'GENERAL',
        confidence: parseFloat(parsed.confidence) || 0.5,
        details: { reasoning: parsed.reasoning },
      };
    } catch (error) {
      this.logger.error('Error detecting intent:', error);
      return this.detectIntentFallback(userMessage);
    }
  }

  /**
   * Extract ticket information from user message
   */
  async extractTicketInfo(userMessage: string): Promise<{
    category?: string;
    priority?: string;
    subject?: string;
    description: string;
  }> {
    if (!this.isAvailable || !this.model) {
      return { description: userMessage };
    }

    try {
      const extractPrompt = `Extract IT ticket information from this user message.

Message: "${userMessage}"

Respond ONLY in this JSON format (no markdown, no extra text):
{
  "category": "Hardware|Software|Network|Access|Other",
  "priority": "Low|Medium|High|Urgent",
  "subject": "brief one-line summary",
  "description": "full description"
}

If any field cannot be determined, use null.`;

      const result = await this.model.generateContent(extractPrompt);
      const responseText = result.response.text();

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { description: userMessage };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        category: parsed.category || undefined,
        priority: parsed.priority || undefined,
        subject: parsed.subject || userMessage.substring(0, 50),
        description: parsed.description || userMessage,
      };
    } catch (error) {
      this.logger.error('Error extracting ticket info:', error);
      return { description: userMessage };
    }
  }

  /**
   * Build context-aware prompt
   */
  private buildContextPrompt(
    userMessage: string,
    context?: {
      userRole?: string;
      userDepartment?: string;
      recentTickets?: any[];
      conversationHistory?: Array<{ role: string; content: string }>;
    },
  ): string {
    let prompt = '';

    // Add context if available
    if (context?.userRole) {
      prompt += `\nUser Role: ${context.userRole}`;
    }
    if (context?.userDepartment) {
      prompt += `\nUser Department: ${context.userDepartment}`;
    }

    if (context?.recentTickets && context.recentTickets.length > 0) {
      prompt += '\n\nRecent User Tickets:\n';
      context.recentTickets.slice(0, 3).forEach((ticket, idx) => {
        prompt += `${idx + 1}. [${ticket.ticket_id}] ${ticket.subject} - Status: ${ticket.status}\n`;
      });
    }

    prompt += `\n\nUser Message: ${userMessage}`;

    return prompt;
  }

  /**
   * Fallback response when Gemini is unavailable
   */
  private getFallbackResponse(userMessage: string): GeminiResponse {
    const lowerMessage = userMessage.toLowerCase();

    // Basic keyword-based responses
    if (
      lowerMessage.includes('password') ||
      lowerMessage.includes('reset') ||
      lowerMessage.includes('login')
    ) {
      return {
        text: 'For password reset or login issues:\n1. Visit the IT Help Desk portal\n2. Click "Forgot Password"\n3. Follow the email instructions\n\nIf you still have issues, please create a support ticket and our IT team will assist you.',
        confidence: 0.6,
      };
    }

    if (
      lowerMessage.includes('printer') ||
      lowerMessage.includes('print')
    ) {
      return {
        text: 'Printer Issues - Troubleshooting Steps:\n1. Check if printer is powered on and connected\n2. Restart your computer\n3. Try printing from a different application\n4. Check printer queue and clear any stuck jobs\n\nIf still not working, please create a support ticket with your printer model.',
        confidence: 0.6,
      };
    }

    // Default fallback
    return {
      text: `I'm here to help! Based on your message, it seems you might need assistance.\n\nI can help you with:\n- Troubleshooting common IT issues\n- Creating support tickets\n- Answering IT policy questions\n- Checking ticket status\n\nPlease describe your issue in more detail, and I'll do my best to assist. If you need immediate help, you can create a support ticket.`,
      confidence: 0.5,
    };
  }

  /**
   * Fallback intent detection
   */
  private detectIntentFallback(userMessage: string): {
    intent: string;
    confidence: number;
  } {
    const lower = userMessage.toLowerCase();

    if (
      lower.includes('?') ||
      lower.includes('how') ||
      lower.includes('what') ||
      lower.includes('where')
    ) {
      return { intent: 'FAQ', confidence: 0.4 };
    }

    if (
      lower.includes('broken') ||
      lower.includes('issue') ||
      lower.includes('problem') ||
      lower.includes('error') ||
      lower.includes('not working')
    ) {
      return { intent: 'TROUBLESHOOTING', confidence: 0.4 };
    }

    if (
      lower.includes('ticket') ||
      lower.includes('status') ||
      lower.includes('progress')
    ) {
      return { intent: 'TICKET_STATUS', confidence: 0.4 };
    }

    if (
      lower.includes('create') ||
      lower.includes('new') ||
      lower.includes('report') ||
      lower.includes('submit')
    ) {
      return { intent: 'TICKET_CREATION', confidence: 0.4 };
    }

    return { intent: 'GENERAL', confidence: 0.3 };
  }
}
