# Chatbot API Integration Guide

**Updated: Nov 6, 2026**

## 🚨 IMPORTANT: API Path Correction

**All API endpoints use `/chat/` prefix (NOT `/api/chat/`)**

### Previous Issue
Earlier documentation incorrectly showed `/api/chat/` paths. This was a documentation error.

### Correct Paths
All endpoints should be:
- `https://ticketing-web-app.onrender.com/chat/...` (NOT `/api/chat/...`)
- `http://localhost:3000/chat/...` (development)

---

## Core Endpoints

### 1. Create Conversation
```http
POST /chat/conversations
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "type": "DIRECT",
  "name": "Chatbot Support Chat",
  "participant_ids": ["optional-user-id"]
}
```

**Response:**
```json
{
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "DIRECT",
  "name": "Chatbot Support Chat",
  "participant_ids": [],
  "created_at": "2026-11-06T10:30:00Z",
  "updated_at": "2026-11-06T10:30:00Z"
}
```

### 2. Send Chatbot Message
```http
POST /chat/chatbot/message
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "How do I reset my password?"
}
```

**Response:**
```json
{
  "response": "To reset your password, follow these steps...",
  "intent": "FAQ",
  "confidence": 0.85,
  "responseType": "GENERAL",
  "interactionId": "uuid-here",
  "suggestedAction": null
}
```

### 3. Get Chatbot Statistics
```http
GET /chat/chatbot/stats
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "totalInteractions": 15,
  "averageConfidence": 0.78,
  "knowledgeBaseSize": 42,
  "resolvedSolutions": 8
}
```

### 4. Get Conversation Messages
```http
GET /chat/conversations/{conversationId}/messages?limit=50&offset=0
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
[
  {
    "message_id": "uuid",
    "conversation_id": "uuid",
    "sender_id": "uuid",
    "content": "How do I reset my password?",
    "is_read": true,
    "attachments": [],
    "created_at": "2026-11-06T10:30:00Z"
  }
]
```

### 5. Submit Feedback
```http
POST /chat/chatbot/feedback
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "interaction_id": "uuid",
  "satisfaction_score": 4,
  "is_helpful": true,
  "user_feedback": "Very helpful!"
}
```

**Response:**
```json
{
  "message": "Feedback recorded successfully"
}
```

### 6. Search Knowledge Base
```http
POST /chat/chatbot/kb/search
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "query": "password reset",
  "limit": 5
}
```

**Response:**
```json
{
  "results": [
    {
      "knowledge_id": "uuid",
      "category": "Access",
      "question": "How do I reset my password?",
      "answer": "To reset your password...",
      "keywords": ["password", "reset", "login"],
      "confidence_score": 0.95,
      "usage_count": 42
    }
  ]
}
```

### 7. Upload Files to Conversation
```http
POST /chat/conversations/{conversationId}/files
Authorization: Bearer {JWT_TOKEN}
Content-Type: multipart/form-data

[File data]
```

**Response:**
```json
{
  "attachments": [
    {
      "filename": "image.jpg",
      "file_type": "image/jpeg",
      "file_size": 12345,
      "file_url": "/chat/files/conv-id_abc123.jpg",
      "preview_url": "/chat/files/conv-id_abc123.jpg"
    }
  ]
}
```

### 8. Download File
```http
GET /chat/files/{fileName}
Authorization: Bearer {JWT_TOKEN}
```

Returns the file content with appropriate MIME type.

---

## Angular Service Implementation

### ChatbotService (Corrected)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private baseUrl = '/chat'; // ← No /api prefix!

  constructor(private http: HttpClient) {}

  /**
   * Create a new conversation
   */
  createConversation(type: string, name: string): Observable<{conversation_id: string}> {
    return this.http.post(`${this.baseUrl}/conversations`, {
      type,
      name,
      participant_ids: []
    });
  }

  /**
   * Send message to chatbot
   */
  sendMessage(conversationId: string, message: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/chatbot/message`, {
      conversation_id: conversationId,
      message
    });
  }

  /**
   * Get chatbot statistics
   */
  getStats(): Observable<{
    totalInteractions: number;
    averageConfidence: number;
    knowledgeBaseSize: number;
    resolvedSolutions: number;
  }> {
    return this.http.get(`${this.baseUrl}/chatbot/stats`);
  }

  /**
   * Get messages from conversation
   */
  getMessages(conversationId: string, limit = 50, offset = 0): Observable<any[]> {
    return this.http.get(`${this.baseUrl}/conversations/${conversationId}/messages`, {
      params: { limit, offset }
    });
  }

  /**
   * Submit feedback on a response
   */
  submitFeedback(interactionId: string, feedback: {
    satisfaction_score?: number;
    is_helpful?: boolean;
    user_feedback?: string;
  }): Observable<{message: string}> {
    return this.http.post(`${this.baseUrl}/chatbot/feedback`, {
      interaction_id: interactionId,
      ...feedback
    });
  }

  /**
   * Search knowledge base
   */
  searchKnowledgeBase(query: string, limit = 5): Observable<{results: any[]}> {
    return this.http.post(`${this.baseUrl}/chatbot/kb/search`, {
      query,
      limit
    });
  }

  /**
   * Upload files to conversation
   */
  uploadFiles(conversationId: string, files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    return this.http.post(
      `${this.baseUrl}/conversations/${conversationId}/files`,
      formData
    );
  }
}
```

### HTTP Interceptor (Corrected)

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get JWT token from localStorage
    const token = localStorage.getItem('access_token');

    if (token) {
      // Clone the request and add Authorization header
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(req);
  }
}
```

### Component Usage Example

```typescript
import { Component, OnInit } from '@angular/core';
import { ChatbotService } from './services/chatbot.service';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit {
  conversationId: string | null = null;
  messages: any[] = [];
  userMessage = '';
  isLoading = false;

  constructor(private chatbotService: ChatbotService) {}

  ngOnInit(): void {
    this.initializeChat();
  }

  /**
   * Initialize chat by creating a conversation
   */
  private initializeChat(): void {
    this.chatbotService.createConversation('DIRECT', 'IT Help Chatbot').subscribe({
      next: (response) => {
        this.conversationId = response.conversation_id;
        console.log('✅ Conversation started:', this.conversationId);
      },
      error: (error) => {
        console.error('❌ Failed to create conversation:', error);
      }
    });
  }

  /**
   * Send message to chatbot
   */
  sendMessage(): void {
    if (!this.conversationId || !this.userMessage.trim()) {
      return;
    }

    const userMsg = this.userMessage;
    this.userMessage = '';
    this.isLoading = true;

    // Add user message to display
    this.messages.push({
      role: 'user',
      content: userMsg,
      timestamp: new Date()
    });

    // Send to chatbot
    this.chatbotService.sendMessage(this.conversationId, userMsg).subscribe({
      next: (response) => {
        // Add bot response to display
        this.messages.push({
          role: 'bot',
          content: response.response,
          confidence: response.confidence,
          interactionId: response.interactionId,
          responseType: response.responseType,
          timestamp: new Date()
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Failed to get response:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Submit feedback on a response
   */
  submitFeedback(interactionId: string, isHelpful: boolean): void {
    this.chatbotService.submitFeedback(interactionId, {
      is_helpful: isHelpful,
      satisfaction_score: isHelpful ? 5 : 1
    }).subscribe({
      next: () => {
        console.log('✅ Feedback submitted');
      },
      error: (error) => {
        console.error('❌ Failed to submit feedback:', error);
      }
    });
  }

  /**
   * Load chat statistics
   */
  loadStats(): void {
    this.chatbotService.getStats().subscribe({
      next: (stats) => {
        console.log('✅ Stats loaded:', stats);
      },
      error: (error) => {
        console.error('❌ Failed to load stats:', error);
      }
    });
  }
}
```

---

## Troubleshooting

### Issue: 404 Not Found on `/api/chat/...`
**Solution**: Remove the `/api` prefix. Use `/chat/...` instead.

### Issue: 401 Unauthorized
**Solution**: Ensure JWT token is being sent in the `Authorization: Bearer {token}` header.

### Issue: Chatbot doesn't respond
**Checklist**:
1. ✅ conversation_id is valid (UUID format, not "undefined")
2. ✅ Message is not empty
3. ✅ JWT token is valid and not expired
4. ✅ Using correct endpoint: `/chat/chatbot/message`
5. ✅ Server is running and accessible

### Issue: Can't create conversation
**Solutions**:
- Check JWT token is valid
- Ensure token is sent in Authorization header
- Verify server is accessible

### Issue: File upload returns 404
**Solution**: Ensure you're using `/chat/files/` not `/api/chat/files/`

---

## Environment Configuration

### Development
- Base URL: `http://localhost:3000`
- Endpoints: `http://localhost:3000/chat/...`

### Production (Render)
- Base URL: `https://ticketing-web-app.onrender.com`
- Endpoints: `https://ticketing-web-app.onrender.com/chat/...`

---

## Response Types

The chatbot responds with various response types:

```typescript
enum ChatbotResponseType {
  FAQ = 'FAQ',                        // Answer from knowledge base
  TICKET_CREATION = 'TICKET_CREATION',  // Suggestion to create ticket
  TROUBLESHOOTING = 'TROUBLESHOOTING',  // Step-by-step help
  ESCALATION = 'ESCALATION',            // Escalated to human agent
  GENERAL = 'GENERAL',                  // General AI response
  TICKET_STATUS = 'TICKET_STATUS'       // Ticket status info
}
```

---

## Success Criteria

✅ Frontend correctly calls `/chat/...` endpoints (not `/api/chat/...`)
✅ JWT token is sent in every request header
✅ Conversation ID is returned and used properly
✅ Chatbot sends and receives messages
✅ Stats endpoint returns valid data
✅ Files can be uploaded and downloaded
✅ Feedback can be submitted

