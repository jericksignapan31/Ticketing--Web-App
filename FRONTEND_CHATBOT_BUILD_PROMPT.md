# Frontend Chatbot Implementation Guide

## Project Overview

Build a comprehensive AI-powered chatbot interface for the IT Help Desk system. The chatbot will handle FAQ queries, create tickets, provide troubleshooting, and learn from resolved tickets. All backend APIs are ready and deployed.

**Backend Status:** ✅ Production Ready (23 endpoints, all deployed to Render)

---

## Design Requirements

### UI/UX Principles
- **Clean & Modern**: Minimalist design with clear chat bubbles
- **Real-time Responsive**: Instant feedback on user actions
- **Mobile-First**: Fully responsive on phones, tablets, and desktops
- **Accessibility**: WCAG 2.1 AA compliant, keyboard navigation
- **Dark Mode**: Support both light and dark themes
- **Professional**: Match IT Help Desk branding

### Color Scheme (Suggested)
- Primary: Blue (#2563EB) - Trust, professionalism
- Success: Green (#10B981) - Positive actions
- Warning: Amber (#F59E0B) - Escalations
- Error: Red (#EF4444) - Issues
- Background: Light gray (#F9FAFB) or Dark (#1F2937)
- Text: Dark gray (#374151) or Light (#F3F4F6)

### Typography
- Headers: Bold, 16-18px, sans-serif
- Body: Regular, 14px, sans-serif
- Code/Steps: Monospace, 12px
- Chat messages: 13-14px with line-height 1.5

---

## Core Components

### 1. Chatbot Window
- **Position**: Floating window (bottom-right) or full-page
- **Size**: Min 350px width, max 500px (floating) or full container
- **Header**: 
  - Chatbot icon/avatar
  - Title: "IT Help Desk Assistant"
  - Status indicator (online/offline)
  - Close/minimize button
- **Features**:
  - Message history scrollable
  - Smooth scroll to latest message
  - Timestamp on messages
  - Loading indicator while waiting for response

### 2. Message Display
**User Message**:
- Right-aligned bubble
- Blue background (#2563EB)
- White text
- Rounded corners (8px radius)
- Padding: 12px 16px
- Max-width: 80% of chat width
- Timestamp: Small, light gray, below message

**Bot Message**:
- Left-aligned bubble
- Light gray background (#F3F4F6) or darker for dark mode
- Dark text
- Rounded corners (8px radius)
- Padding: 12px 16px
- Avatar: Small circle (32px) with icon
- Timestamp: Small, light gray, below message

**System Message**:
- Center-aligned
- Italics
- Gray text
- Smaller font (12px)
- Example: "Ticket TKT-20261103-0001 created"

### 3. Input Area
- Text input field with placeholder: "Ask me anything about IT..."
- Send button (paper airplane icon or "Send")
- Suggest quick actions below input (if available)
- Character limit indicator: Optional, max 500 chars
- "Typing..." indicator when bot is processing
- Disabled state while waiting for response

### 4. FAQ/Quick Access Panel (Optional)
- **Expandable section**: "Quick Help" or "Popular Answers"
- **Cards display**:
  - FAQ category tabs (Hardware, Software, Network, etc.)
  - FAQ cards with question text
  - Click card to display answer or open in modal
  - Star icon to rate helpfulness
- **Most Popular section**:
  - Top 5 most helpful FAQs
  - Usage count or star rating
  - Quick access cards

### 5. Feedback Modal
**After bot response (optional trigger)**:
- Question: "Was this helpful?"
- Rating buttons: ⭐ 1-5 stars
- Toggle buttons: "Helpful" / "Not Helpful"
- Optional comment field: "Tell us more..."
- Submit & Close buttons

### 6. Ticket Creation Form (Modal or Inline)
**When user asks to create ticket**:
- **Pre-filled fields** (from chatbot extraction):
  - Category (dropdown): Hardware, Software, Network, Access, Other
  - Priority (dropdown): Low, Medium, High, Urgent
  - Subject (text input): Pre-filled from extraction
  - Description (textarea): Pre-filled from extraction
  - Asset (optional dropdown): List of user's assets
  - Attachment (optional): Upload files
- **Checkbox**: Require approval (default: checked)
- **Buttons**: Create Ticket, Cancel
- **Confirmation**: Show ticket ID after creation
  - Format: "TKT-YYYYMMDD-XXXX"
  - Provide link to view ticket

### 7. Knowledge Base Search (Optional Page/Modal)
- **Search bar**: Full-width input
- **Search results**: Cards or list
  - Question, category, confidence score, helpfulness rating
  - Click to expand answer
  - Rate helpfulness (thumbs up/down)
- **Filters**: Category, Most Helpful, Newest, Most Used
- **Empty state**: "No results found" with suggestions

---

## User Flows

### Flow 1: Simple FAQ Query
```
User: "How do I reset my password?"
     ↓
Bot: [Detects FAQ intent]
     ↓
Bot: Shows FAQ answer with step-by-step guide
     ↓
[Optional] Feedback modal: "Was this helpful?"
     ↓
User rates 5 stars
```

### Flow 2: Ticket Creation
```
User: "My monitor isn't working"
     ↓
Bot: [Detects troubleshooting intent]
     ↓
Bot: "Let me help you troubleshoot. [Steps]"
     ↓
User: "Still not working, create a ticket"
     ↓
Bot: Opens ticket creation form with pre-filled data
     ↓
User: Reviews and clicks "Create Ticket"
     ↓
Bot: "Ticket TKT-20261103-0001 created successfully"
     ↓
[Optional] Show "View Ticket" button
```

### Flow 3: FAQ Search
```
User: Clicks "Search FAQ" button
     ↓
Knowledge Base modal opens
     ↓
User: Types "printer" in search
     ↓
Results displayed: 3 printer-related FAQs
     ↓
User: Clicks one FAQ
     ↓
Answer expands with full details
     ↓
User: Clicks "Helpful" thumbs up
```

---

## API Integration Points

### 1. Send Message to Chatbot
```typescript
POST /api/chat/chatbot/message
Authorization: Bearer TOKEN

Request:
{
  "conversation_id": "uuid",
  "message": "How do I reset my password?"
}

Response:
{
  "response": "To reset your password, follow these steps...",
  "intent": "FAQ",
  "confidence": 0.92,
  "responseType": "FAQ",
  "interactionId": "uuid",
  "suggestedActions": [
    {
      "type": "TICKET",
      "label": "Create Support Ticket"
    }
  ]
}
```

### 2. Submit Feedback
```typescript
POST /api/chat/chatbot/feedback
Authorization: Bearer TOKEN

Request:
{
  "interaction_id": "uuid",
  "satisfaction_score": 5,
  "is_helpful": true,
  "user_feedback": "Very clear and helpful!"
}

Response:
{
  "success": true,
  "message": "Feedback recorded, thank you!"
}
```

### 3. Search Knowledge Base
```typescript
POST /api/chat/chatbot/kb/search
Authorization: Bearer TOKEN

Request:
{
  "query": "password reset",
  "limit": 5
}

Response:
{
  "results": [
    {
      "knowledge_id": "uuid",
      "category": "Access",
      "question": "How do I reset my password?",
      "answer": "To reset...",
      "keywords": ["password", "reset", "account"],
      "confidence_score": 0.92,
      "usage_count": 145
    }
  ]
}
```

### 4. Get FAQ Categories
```typescript
GET /api/chat/chatbot/kb/categories
Authorization: Bearer TOKEN

Response:
{
  "categories": [
    "Hardware",
    "Software",
    "Network",
    "Access",
    "Communication",
    "Other"
  ]
}
```

### 5. Get FAQ by Category
```typescript
GET /api/chat/chatbot/kb/category/Hardware
Authorization: Bearer TOKEN

Response:
{
  "category": "Hardware",
  "entries": [
    {
      "knowledge_id": "uuid",
      "question": "Why is my monitor not detected?",
      "answer": "...",
      "confidence_score": 0.85,
      "usage_count": 32
    }
  ]
}
```

### 6. Get Most Helpful Responses
```typescript
GET /api/chat/chatbot/kb/popular?limit=5
Authorization: Bearer TOKEN

Response:
{
  "popular": [
    {
      "knowledge_id": "uuid",
      "question": "How do I reset my password?",
      "helpful_count": 234,
      "usage_count": 456,
      "confidence_score": 0.95
    }
  ]
}
```

### 7. Create Ticket from Chat
```typescript
POST /api/chat/chatbot/ticket/create
Authorization: Bearer TOKEN

Request:
{
  "conversation_id": "uuid",
  "category": "Hardware",
  "priority": "High",
  "subject": "Monitor not working",
  "description": "My monitor is showing no signal...",
  "asset_id": "optional-uuid",
  "require_approval": true
}

Response:
{
  "ticket_id": "TKT-20261103-0001",
  "message": "Ticket created successfully",
  "statusUrl": "/tickets/TKT-20261103-0001"
}
```

### 8. Get Chatbot Statistics
```typescript
GET /api/chat/chatbot/stats
Authorization: Bearer TOKEN

Response:
{
  "totalInteractions": 1234,
  "averageConfidence": 0.87,
  "userSatisfaction": 4.5,
  "totalKBEntries": 145,
  "totalTicketsCreated": 89,
  "avgResolutionTime": "2.5 hours"
}
```

### 9. Get Conversation History
```typescript
GET /api/chat/conversations/{conversationId}/messages
Authorization: Bearer TOKEN

Response:
{
  "messages": [
    {
      "id": "uuid",
      "type": "user",
      "content": "How do I reset my password?",
      "timestamp": "2026-11-03T10:30:00Z"
    },
    {
      "id": "uuid",
      "type": "assistant",
      "content": "To reset your password...",
      "timestamp": "2026-11-03T10:30:05Z",
      "confidence": 0.92
    }
  ]
}
```

---

## State Management

### Global State (Redux/Context)
```typescript
{
  auth: {
    token: string,
    userId: string,
    userRole: 'IT' | 'EMPLOYEE' | 'ADMIN' | 'SUPERVISOR'
  },
  chat: {
    conversationId: string,
    messages: Message[],
    isLoading: boolean,
    error: null | string
  },
  chatbot: {
    stats: ChatbotStats,
    lastIntent: string,
    lastConfidence: number,
    faqCategories: string[],
    isKBSearchOpen: boolean
  },
  ui: {
    theme: 'light' | 'dark',
    chatWindowOpen: boolean,
    ticketModalOpen: boolean,
    feedbackModalOpen: boolean
  }
}
```

---

## Technical Specifications

### Technologies (Recommended)
- **Framework**: React 18+ or Vue 3+
- **State**: Redux Toolkit or Pinia/Composition API
- **UI Components**: Tailwind CSS, Material-UI, or Chakra UI
- **Real-time**: Socket.io (for Phase 4)
- **HTTP Client**: Axios or Fetch API
- **Forms**: React Hook Form or VeeValidate
- **Notifications**: Toast library (react-toastify, vue-toastify)

### Authentication
- Store JWT token in secure httpOnly cookie or localStorage
- Add token to Authorization header: `Bearer {token}`
- Handle 401 responses (re-login)
- Refresh token before expiration

### Error Handling
```typescript
try {
  const response = await fetch('/api/chat/chatbot/message', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  })
  
  if (!response.ok) {
    if (response.status === 401) {
      // Handle login required
    } else if (response.status === 403) {
      // Handle permission denied
    } else {
      // Handle other errors
    }
  }
} catch (error) {
  // Handle network error
}
```

### Performance
- Lazy load FAQ modal/search
- Virtualize long message lists
- Debounce search input (300ms)
- Cache API responses when appropriate
- Minimize re-renders with React.memo/computed

### Accessibility
- ARIA labels on interactive elements
- Keyboard navigation (Tab, Enter, Escape)
- Focus management in modals
- Color contrast >= 4.5:1
- Alt text for images
- Screen reader friendly

---

## Optional Features

### Phase 4+ Enhancements
1. **Real-time Updates** - Socket.io for live notifications
2. **File Upload** - Attachments in tickets
3. **Conversation History** - Load past conversations
4. **Canned Responses** - Quick reply templates
5. **Chatbot Avatar** - Animated character
6. **Voice Input** - Speech-to-text
7. **Multi-language** - i18n support
8. **Analytics Dashboard** - User metrics

---

## Example Frontend Component Structure

```
src/
├── pages/
│   ├── ChatbotPage.tsx         # Main chatbot page
│   ├── KnowledgeBasePage.tsx   # FAQ search page
│   └── TicketPage.tsx          # Ticket details
├── components/
│   ├── ChatWindow.tsx          # Main chat container
│   ├── MessageList.tsx         # Chat message display
│   ├── MessageInput.tsx        # User input area
│   ├── BotMessage.tsx          # Bot message bubble
│   ├── UserMessage.tsx         # User message bubble
│   ├── FeedbackModal.tsx       # Rating modal
│   ├── TicketCreationForm.tsx  # Ticket creation
│   ├── KnowledgeBaseSearch.tsx # FAQ search
│   ├── QuickAccessPanel.tsx    # FAQ shortcuts
│   └── TypingIndicator.tsx     # Loading animation
├── hooks/
│   ├── useChatbot.ts           # Chat logic
│   ├── useConversation.ts      # Conversation management
│   ├── useFeedback.ts          # Feedback submission
│   └── useAuth.ts              # Authentication
├── services/
│   ├── chatService.ts          # Chat API calls
│   ├── chatbotService.ts       # Chatbot API calls
│   └── knowledgeBaseService.ts # KB API calls
├── store/
│   ├── chatSlice.ts            # Chat state
│   ├── chatbotSlice.ts         # Chatbot state
│   └── uiSlice.ts              # UI state
└── styles/
    ├── chatbot.css             # Chatbot styles
    ├── themes.css              # Theme variations
    └── responsive.css          # Mobile styles
```

---

## Testing Checklist

### Functional Testing
- [ ] Send message and receive response
- [ ] FAQ search returns results
- [ ] Create ticket from chat
- [ ] Submit feedback and verify update
- [ ] View conversation history
- [ ] Switch between categories
- [ ] View popular FAQs

### UI/UX Testing
- [ ] Chat window opens/closes smoothly
- [ ] Messages display correctly
- [ ] Mobile responsive layout
- [ ] Dark mode toggle works
- [ ] Keyboard navigation functional
- [ ] Loading states visible
- [ ] Error messages clear

### Performance Testing
- [ ] Message response time < 2s
- [ ] Search results < 1s
- [ ] No memory leaks
- [ ] Smooth scrolling with 50+ messages
- [ ] Mobile performance acceptable

### Accessibility Testing
- [ ] Screen reader friendly
- [ ] Color contrast compliant
- [ ] Keyboard navigation complete
- [ ] ARIA labels present
- [ ] Focus indicators visible

---

## Deployment

### Environment Variables
```env
REACT_APP_API_URL=https://api.helpdesk.app
REACT_APP_API_TIMEOUT=10000
REACT_APP_ENVIRONMENT=production
```

### Build & Deploy
```bash
npm run build
# Deploy to Vercel, Netlify, or S3 + CloudFront
```

### CDN Configuration
- Cache static assets (JS, CSS, images)
- Cache busting with versioning
- Gzip compression enabled

---

## Support & Questions

Backend API Documentation: Check `/api-docs` endpoint for Swagger documentation

All endpoints require valid JWT token from authentication service.

**Status Page**: Render deployment at https://helpdesk-app.render.com
