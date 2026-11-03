# IT Help Desk Chatbot - Algorithm & Architecture

## 1. System Overview

### Purpose
AI-powered chatbot assistant for the IT Help Desk system that:
- Answers common IT questions
- Helps employees create tickets
- Provides support documentation
- Learns from ticket history and resolutions
- Integrates with existing chat system

### Technology Stack
- **AI Provider:** Google Gemini API
- **Framework:** NestJS with existing Chat module
- **Real-time Communication:** Socket.io (already implemented)
- **Database:** PostgreSQL with existing chat entities
- **Authentication:** JWT tokens (existing)

---

## 2. Data Architecture

### Existing Entities to Leverage
```
UserAccount
  ↓
Ticket (status, priority, category, description, resolution)
  ↓
Conversation (TICKET type, participant_ids)
  ↓
Message (content, sender_id, is_read)
  ↓
FileAttachment (files, images, screenshots)
```

### New Entities Needed
```
ChatbotKnowledge
├── id: UUID
├── category: string (Troubleshooting, Process, FAQ, etc.)
├── question: string
├── answer: string
├── keywords: string[] (for quick matching)
├── relevant_ticket_ids: UUID[] (linked tickets)
├── created_at: Date
├── updated_at: Date
└── confidence_score: number (0-1)

ChatbotInteraction
├── id: UUID
├── user_id: UUID (from UserAccount)
├── conversation_id: UUID (from Conversation)
├── message_content: string
├── chatbot_response: string
├── response_type: enum (FAQ, TICKET_CREATION, TROUBLESHOOTING, ESCALATION)
├── satisfaction_score: number (1-5, optional)
├── created_at: Date
└── is_helpful: boolean (user feedback)

TicketSolution
├── id: UUID
├── ticket_id: UUID
├── solution_summary: string
├── resolution_steps: string[]
├── resolution_time: number (minutes)
├── category: string
├── issue_type: string
├── tags: string[]
├── created_at: Date
└── is_resolved: boolean
```

---

## 3. Chatbot Workflow Algorithm

### 3.1 Message Ingestion Flow
```
User sends message in chat
    ↓
[Is message directed to chatbot?]
    ├─ Yes: Extract intent
    └─ No: Regular chat
    ↓
[Parse message for intent]
    ├─ Intent: FAQ Query
    │   ├─ Search knowledge base
    │   └─ Return cached answer
    ├─ Intent: Create Ticket
    │   ├─ Extract ticket details
    │   └─ Create via API
    ├─ Intent: Troubleshooting
    │   ├─ Search similar tickets
    │   └─ Provide solutions
    ├─ Intent: General Question
    │   ├─ Generate response with Gemini
    │   └─ Store in knowledge base
    └─ Intent: Escalation
        └─ Route to human agent
```

### 3.2 Knowledge Base Retrieval Algorithm
```
User Query Input
    ↓
[Tokenize & Clean Query]
    ├─ Remove stopwords
    ├─ Normalize text (lowercase, trim)
    └─ Extract keywords
    ↓
[Search Priority Levels]
    ├─ Level 1: Exact keyword match in KB
    │   └─ Return if confidence > 0.9
    ├─ Level 2: Partial keyword match
    │   └─ Return if confidence > 0.7
    ├─ Level 3: Similar tickets
    │   ├─ Search ticket descriptions
    │   ├─ Find with similar category/priority
    │   └─ Return solutions if exists
    └─ Level 4: Gemini fallback
        ├─ Send to Gemini API
        ├─ Get response
        ├─ Store in KB
        └─ Return answer
```

### 3.3 AI Response Generation
```
User Query (with context)
    ↓
[Build Gemini Prompt]
    ├─ System prompt (role: IT help desk assistant)
    ├─ User context (role, department, recent tickets)
    ├─ Related ticket history
    ├─ Knowledge base context
    └─ User query
    ↓
[Call Gemini API]
    ├─ Stream response (for real-time display)
    ├─ Collect full response
    └─ Extract confidence score
    ↓
[Post-Process Response]
    ├─ Extract action items (create ticket, etc.)
    ├─ Format markdown
    ├─ Add suggestions
    └─ Store interaction
    ↓
Response to User + Socket.io broadcast
```

### 3.4 Ticket Creation from Chat
```
User: "My monitor is broken and won't turn on"
    ↓
[Extract ticket information]
    ├─ Category: Detection (Repair/Hardware)
    ├─ Priority: Extraction from keywords (urgent, broken, asap)
    ├─ Subject: Summary generation
    ├─ Description: Full message
    └─ Images/attachments: From chat context
    ↓
[Validation]
    ├─ Check required fields
    ├─ Validate category
    ├─ Validate priority
    └─ Confirm with user
    ↓
[Create Ticket]
    ├─ Call Ticket API
    ├─ Link to conversation
    ├─ Store ticket_id in ChatbotInteraction
    └─ Notify user of ticket ID
```

### 3.5 Learning Loop
```
[Ticket Resolved]
    ↓
[Extract Solution]
    ├─ Final resolution message
    ├─ Assigned IT staff notes
    ├─ Time to resolution
    └─ Ticket category
    ↓
[Store in TicketSolution]
    ├─ Create solution record
    ├─ Extract key steps
    ├─ Tag with keywords
    └─ Link to category
    ↓
[Update Knowledge Base]
    ├─ Check if similar FAQ exists
    ├─ If yes: Update answer with new info
    ├─ If no: Create new KB entry
    └─ Increase confidence score
    ↓
[Monitor Chatbot Feedback]
    ├─ User satisfaction rating
    ├─ "Is this helpful?" feedback
    ├─ Suggestion/correction input
    └─ Update KB confidence
```

---

## 4. Chatbot Features & Flows

### Feature 1: FAQ Query
```
User: "How do I reset my password?"
    ↓
Chatbot:
1. Search KB for "password reset"
2. If found (confidence > 0.8):
   - Return cached answer with steps
   - Offer: Create ticket, get IT help, etc.
3. If not found:
   - Call Gemini
   - Generate answer based on system knowledge
   - Store in KB
   - Return answer
```

### Feature 2: Ticket Creation Assistance
```
User: "I need to report my keyboard doesn't work"
    ↓
Chatbot:
1. Identify intent: Ticket creation
2. Extract info:
   - Issue: Keyboard malfunction
   - Asset: Extract from user's devices if available
   - Priority: Normal (not urgent)
3. Ask for clarification:
   - "Is this keyboard wireless or wired?"
   - "When did this start?"
   - "Have you tried [basic troubleshooting]?"
4. If solvable: Provide quick fix
5. If not: Create ticket with all info
6. Confirm: "Ticket IT-20261103-0001 created!"
```

### Feature 3: Troubleshooting Guide
```
User: "My laptop won't turn on"
    ↓
Chatbot:
1. Search similar tickets
2. Common solutions tree:
   Step 1: "Have you checked the power adapter?"
   Step 2: "Try holding power button for 10 seconds"
   Step 3: "Check for LED indicator lights"
   Step 4: "No improvement? Let's create a ticket"
3. Each step: User confirms or needs help
4. Final: Create ticket OR provide contact info
```

### Feature 4: Ticket Status Updates
```
User: "Where's my ticket IT-20261103-0001?"
    ↓
Chatbot:
1. Fetch ticket by ID
2. Display:
   - Current status: In Progress
   - Assigned to: John IT
   - Last updated: 2 hours ago
   - Comments: [latest update]
3. Offer: Message assigned IT, cancel ticket, etc.
```

### Feature 5: Knowledge Base Management
```
Admin/IT creates ticket → Ticket resolved
    ↓
System:
1. Extract resolution details
2. Create TicketSolution record
3. Generate KB entry:
   - Issue category
   - Solution steps
   - Preventive tips
4. Store with confidence score
5. Make available for future queries
```

---

## 5. Intent Detection Algorithm

### Intent Types
```typescript
enum ChatbotIntent {
  FAQ = 'faq',                    // "How do I...?"
  TICKET_CREATION = 'create_ticket', // "Report issue...", "Need help with..."
  TICKET_STATUS = 'ticket_status',    // "Where's my ticket?"
  TROUBLESHOOTING = 'troubleshooting', // "Something not working..."
  ESCALATION = 'escalation',      // "Talk to IT", "Need human help"
  GENERAL = 'general',            // General conversation
  FEEDBACK = 'feedback',          // "That was helpful/not helpful"
  KNOWLEDGE_UPDATE = 'kb_update'  // Admin: update knowledge base
}
```

### Detection Logic
```
Message Analysis
    ↓
[Check Keywords]
├─ FAQ keywords: "how", "what", "where", "explain", "guide"
├─ Ticket keywords: "broken", "issue", "problem", "report", "error"
├─ Status keywords: "ticket", "status", "progress", "where"
├─ Help keywords: "help", "assist", "guide me", "troubleshoot"
└─ Escalation: "talk to", "agent", "human", "urgent"
    ↓
[Use NLP/Gemini for ambiguous cases]
    ├─ Query Gemini with message
    ├─ Get intent + confidence
    └─ Return highest confidence intent
    ↓
[Apply Context Filters]
├─ If in ticket chat: Likely ticket_creation/status
├─ If user is admin: May be kb_update
└─ If message is rated feedback: Override to feedback
```

---

## 6. Response Generation Template

### System Prompt for Gemini
```
You are an AI assistant for an IT Help Desk ticketing system.

Your responsibilities:
1. Help employees with IT issues
2. Provide troubleshooting steps
3. Create support tickets when needed
4. Answer questions about IT policies and procedures
5. Escalate to human IT staff when necessary

Context:
- User's role: {user_role}
- User's department: {user_department}
- Recent tickets: {last_3_tickets}
- Available solutions: {kb_entries}

Guidelines:
- Be friendly and professional
- Provide step-by-step solutions for technical issues
- Always confirm before creating tickets
- Escalate if issue is urgent or beyond your knowledge
- Suggest ticket creation when needed
- Maintain conversation history for context

User Query: {user_message}

Respond with:
1. Acknowledgment of the issue
2. Recommended action or solution
3. If creating ticket: provide fields
4. If escalation: explain why
5. Offer to create ticket at the end if applicable
```

---

## 7. Data Persistence Strategy

### Conversation Context
```
Store in ChatbotInteraction:
- User input
- Chatbot response
- Intent detected
- Action taken (ticket created, KB search, etc.)
- Gemini API call details (for debugging)
- User feedback (later)

Purpose:
- Train/improve intent detection
- Measure chatbot effectiveness
- Provide conversation history
- Audit trail for support
```

### Knowledge Base Building
```
Auto-populate from:
1. Resolved tickets (TicketSolution)
2. Common FAQ patterns
3. IT documentation links
4. User feedback on responses

Manual updates:
1. Admin/IT staff add common questions
2. Mark frequently asked questions
3. Update confidence scores
4. Archive outdated info
```

---

## 8. Error Handling & Fallbacks

### API Failure
```
Gemini API fails
    ↓
[Retry Logic]
├─ Attempt 1: Immediate retry
├─ Attempt 2: After 500ms
└─ Attempt 3: After 1000ms
    ↓
[Fallback]
├─ If KB has similar answer: Use that
├─ If not: Generic response + escalation
└─ Suggest ticket creation / human help
    ↓
Log error for debugging
```

### Invalid Intent
```
Intent not detected
    ↓
[Default: General Question]
├─ Use Gemini with full context
├─ Return general response
├─ Offer: More info needed? Create ticket?
└─ Store as GENERAL intent
```

### Rate Limiting
```
Max 50 Gemini requests per user per hour
    ↓
[Exceeded?]
├─ Show: "Taking a break, please wait..."
├─ Offer: Manual ticket creation
└─ Suggest: Contact IT directly
```

---

## 9. Performance Optimization

### Caching Strategy
```
Cache Layer 1: Recent KB entries (1 hour)
├─ Frequently accessed questions
├─ Recent solutions
└─ Update on new resolution

Cache Layer 2: User context (30 minutes)
├─ User's recent tickets
├─ User's department
└─ User's common issues

Cache Layer 3: Gemini responses (by query hash)
├─ Similar questions → similar answers
├─ TTL: 24 hours
└─ Clear on KB update
```

### Query Optimization
```
Search Knowledge Base:
- Index on: category, keywords, issue_type
- Full-text search on: question, answer
- Filter by: relevance score, confidence

Search Tickets:
- Filter by: category, status, resolution
- Limit results: Top 5 similar tickets
- Cache frequent searches
```

---

## 10. User Interaction Flow (Complete)

```
┌─ Start Conversation
│
├─ User sends message
│
├─ [Chatbot receives via Socket.io]
│
├─ Parse message for intent
│  ├─ FAQ → Search KB
│  ├─ Ticket Creation → Extract info → Confirm → Create
│  ├─ Troubleshooting → Provide steps → Create ticket if needed
│  ├─ Status → Fetch ticket → Display
│  └─ General → Call Gemini → Return answer
│
├─ Generate response
│  ├─ If KB answer: Return with confidence
│  ├─ If Gemini: Generate, store, return
│  └─ If escalation: Route to IT + link to ticket
│
├─ Broadcast via Socket.io
│
├─ Store ChatbotInteraction record
│
├─ Display to user
│
├─ [User provides feedback]
│  ├─ Rating (1-5 stars)
│  ├─ "Is this helpful?" yes/no
│  └─ Comments/suggestions
│
├─ Update KB confidence based on feedback
│
└─ Close or continue conversation
```

---

## 11. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- ✅ Create ChatbotKnowledge, ChatbotInteraction entities
- ✅ Create migrations
- ✅ Create ChatbotService with basic intent detection
- ✅ Create Gemini API integration
- ✅ Create chatbot conversation endpoint
- ✅ Integrate with existing Socket.io gateway

### Phase 2: Core Features (Week 3-4)
- ✅ Implement FAQ search (Knowledge Base)
- ✅ Implement ticket creation from chat
- ✅ Implement troubleshooting flow
- ✅ Implement ticket status queries
- ✅ Store interactions for learning

### Phase 3: Learning & Feedback (Week 5-6)
- ✅ Extract solutions from resolved tickets
- ✅ Auto-populate knowledge base
- ✅ User feedback mechanism
- ✅ Update confidence scores

### Phase 4: Optimization (Week 7-8)
- ✅ Caching layer implementation
- ✅ Performance optimization
- ✅ Error handling improvements
- ✅ Testing & deployment

---

## 12. Success Metrics

```
Track:
1. Query resolution rate (% of questions answered without ticket)
2. Ticket creation speed (avg time from issue to ticket)
3. User satisfaction (avg rating)
4. Chatbot utilization (# of interactions per day)
5. KB effectiveness (% answers used by chatbot)
6. Escalation rate (% of conversations needing human help)
7. Cost savings (time saved per ticket)

Goal: >80% satisfaction, <20% escalation rate
```

---

## 13. Security & Privacy

### Data Protection
```
- User queries: Encrypted in transit
- Gemini API: No PII stored (hash sensitive info)
- Knowledge Base: Admin-only write access
- Interaction logs: Accessible by user + admins only
- GDPR: Allow data deletion requests
```

### Rate Limiting
```
- 50 requests per user per hour
- 10 requests per minute per IP
- Escalate suspicious patterns to admin
```

---

This is the complete algorithm and architecture. Ready to implement? 🚀
