import { ChatbotService } from './chatbot.service';
import { ChatbotResponseType } from '../entities/chatbot-interaction.entity';

describe('ChatbotService grounded responses', () => {
  const conversationId = 'conversation-1';
  const userId = 'user-1';

  function createQueryBuilder(results: any[] = []) {
    const queryBuilder: any = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
      getMany: jest.fn().mockResolvedValue(results),
    };
    return queryBuilder;
  }

  function createService(options?: {
    faqs?: any[];
    solutions?: any[];
    history?: any[];
    intent?: { intent: string; confidence: number };
  }) {
    const knowledgeQuery = createQueryBuilder(options?.faqs || []);
    const knowledgeUsageQuery = createQueryBuilder();
    const solutionQuery = createQueryBuilder(options?.solutions || []);
    const historyQuery = createQueryBuilder(options?.history || []);
    const knowledgeRepository = {
      createQueryBuilder: jest.fn((alias?: string) =>
        alias === 'kb' ? knowledgeQuery : knowledgeUsageQuery,
      ),
    };
    const solutionRepository = {
      createQueryBuilder: jest.fn(() => solutionQuery),
    };
    const interactionRepository = {
      createQueryBuilder: jest.fn(() => historyQuery),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({
        ...value,
        interaction_id: 'interaction-1',
      })),
    };
    const geminiService = {
      detectIntent: jest
        .fn()
        .mockResolvedValue(
          options?.intent || { intent: 'FAQ', confidence: 0.95 },
        ),
      isGeminiAvailable: jest.fn().mockReturnValue(true),
      generateResponse: jest.fn().mockResolvedValue({
        text: 'Grounded answer from Gemini.',
        confidence: 0.9,
      }),
      extractTicketInfo: jest.fn(),
    };

    return {
      service: new ChatbotService(
        knowledgeRepository as any,
        interactionRepository as any,
        solutionRepository as any,
        geminiService as any,
      ),
      geminiService,
    };
  }

  it('passes a matching active FAQ to Gemini as grounding context', async () => {
    const faq = {
      knowledge_id: 'faq-1',
      category: 'Hardware',
      question: 'How do I connect to company WiFi?',
      answer: 'Select the company network and use your work credentials.',
      keywords: ['wifi', 'network', 'connect'],
      confidence_score: 0.92,
      usage_count: 0,
      is_active: true,
    };
    const { service, geminiService } = createService({ faqs: [faq] });

    const reply = await service.handleMessage({
      user_id: userId,
      conversation_id: conversationId,
      message: 'How do I connect to company WiFi?',
    });

    expect(reply.responseType).toBe(ChatbotResponseType.FAQ);
    expect(geminiService.generateResponse).toHaveBeenCalledWith(
      'How do I connect to company WiFi?',
      expect.objectContaining({
        knowledgeBase: {
          faqs: [
            expect.objectContaining({
              question: faq.question,
              answer: faq.answer,
            }),
          ],
          solutions: [],
        },
        conversationHistory: [],
      }),
    );
  });

  it('uses verified authentication behavior instead of a stale forgot-password FAQ', async () => {
    const staleFaq = {
      knowledge_id: 'faq-reset',
      category: 'Access',
      question: 'How do I reset my password?',
      answer:
        'Click Forgot Password, enter your email, and follow the reset link.',
      keywords: ['password', 'reset', 'forgot', 'login'],
      confidence_score: 0.99,
      usage_count: 10,
      is_active: true,
    };
    const { service, geminiService } = createService({ faqs: [staleFaq] });
    geminiService.generateResponse.mockResolvedValue({
      text: 'Walang Forgot Password o email reset flow sa kasalukuyang system. Kailangan ng naka-login na user ang current password para magpalit ng password.',
      confidence: 0.9,
    });

    const reply = await service.handleMessage({
      user_id: userId,
      conversation_id: conversationId,
      message: 'I forgot my password. How can I reset it?',
    });

    expect(reply.response).toContain('Walang Forgot Password');
    expect(geminiService.generateResponse).toHaveBeenCalledWith(
      'I forgot my password. How can I reset it?',
      expect.objectContaining({
        systemKnowledge: [
          expect.objectContaining({
            topic: 'Account password and recovery behavior',
            source: expect.stringContaining('src/auth/auth.controller.ts'),
            facts: expect.arrayContaining([
              expect.stringContaining('There is no forgot-password'),
            ]),
          }),
        ],
        knowledgeBase: { faqs: [], solutions: [] },
      }),
    );
  });

  it('routes unsupported policy questions to Gemini for a specific clarification', async () => {
    const { service, geminiService } = createService();
    geminiService.generateResponse.mockResolvedValue({
      text: 'I do not have the company reimbursement policy. Which expense are you asking about?',
      confidence: 0.9,
    });

    const reply = await service.handleMessage({
      user_id: userId,
      conversation_id: conversationId,
      message: 'What is the reimbursement policy for home internet?',
    });

    expect(reply.response).toContain('Which expense are you asking about?');
    expect(reply.response).not.toContain('reimbursement is');
    expect(geminiService.generateResponse).toHaveBeenCalledWith(
      'What is the reimbursement policy for home internet?',
      expect.objectContaining({
        knowledgeBase: { faqs: [], solutions: [] },
      }),
    );
  });

  it('includes recent conversation history when answering a follow-up', async () => {
    const history = [
      {
        user_message: 'How do I reset my VPN password?',
        chatbot_response: 'Use the approved password reset portal.',
      },
    ];
    const { service, geminiService } = createService({ history });

    await service.handleMessage({
      user_id: userId,
      conversation_id: conversationId,
      message: 'What about the tablet?',
    });

    expect(geminiService.generateResponse).toHaveBeenCalledWith(
      'What about the tablet?',
      expect.objectContaining({
        conversationHistory: [
          { role: 'user', content: 'How do I reset my VPN password?' },
          {
            role: 'assistant',
            content: 'Use the approved password reset portal.',
          },
        ],
      }),
    );
  });

  it('lets Gemini clarify instead of blocking the answer on low intent confidence', async () => {
    const faq = {
      knowledge_id: 'faq-1',
      category: 'Hardware',
      question: 'How do I connect to company WiFi?',
      answer: 'Select the company network and use your work credentials.',
      keywords: ['wifi', 'network', 'connect'],
      confidence_score: 0.92,
      usage_count: 0,
      is_active: true,
    };
    const clarification =
      'I found a WiFi FAQ. Are you connecting from a laptop or a mobile device?';
    const { service, geminiService } = createService({
      faqs: [faq],
      intent: { intent: 'FAQ', confidence: 0.3 },
    });
    geminiService.generateResponse.mockResolvedValue({
      text: clarification,
      confidence: 0.9,
    });

    const reply = await service.handleMessage({
      user_id: userId,
      conversation_id: conversationId,
      message: 'How do I connect to company WiFi?',
    });

    expect(reply.response).toBe(clarification);
    expect(geminiService.generateResponse).toHaveBeenCalledWith(
      'How do I connect to company WiFi?',
      expect.objectContaining({
        knowledgeBase: expect.objectContaining({
          faqs: [expect.objectContaining({ answer: faq.answer })],
        }),
      }),
    );
  });
});
