# Chat Feature - Frontend Integration Guide

## 📋 Overview

The backend chat feature is now **100% complete** and deployed. This document outlines all backend changes and what the frontend needs to implement for full chat functionality.

---

## 🔧 Backend Changes Made

### 1. **New Database Tables Created**
- **`conversation`** - Stores chat conversations/threads
- **`message`** - Stores individual chat messages
- **Automatic indexes** for performance optimization
- **Foreign key relationships** with CASCADE/SET NULL rules

### 2. **New NestJS Modules & Components**

#### **Chat Module** (`src/chat/`)
- `chat.module.ts` - Main module orchestrating all chat components
- `chat.service.ts` - Business logic for all chat operations
- `chat.controller.ts` - REST API endpoints
- `chat.gateway.ts` - WebSocket gateway for real-time messaging

#### **Entities** (`src/chat/entities/`)
- `conversation.entity.ts` - Conversation model with type (DIRECT/TICKET/GROUP)
- `message.entity.ts` - Message model with read/unread status tracking

#### **DTOs** (`src/chat/dto/`)
- `conversation.dto.ts` - Request/response validation
- `message.dto.ts` - Request/response validation

### 3. **Database Migration**
- File: `src/migrations/1716230400000-CreateChatTables.ts`
- Status: ✅ Executed successfully
- Creates conversation & message tables with proper relationships and indexes

### 4. **Application Configuration**
- Updated `app.module.ts` to include `ChatModule`
- Updated `data-source.ts` with chat entities and migration configuration

### 5. **New Dependencies Added**
```json
{
  "@nestjs/websockets": "^10.x",
  "@nestjs/platform-socket.io": "^10.x",
  "socket.io": "^4.x",
  "socket.io-client": "^4.x",
  "ws": "^8.x"
}
```

---

## 🎯 API Endpoints Available

### **REST Endpoints** (HTTP)

#### **Conversations**
```
POST   /chat/conversations          - Create new conversation
GET    /chat/conversations          - Get all conversations (paginated)
GET    /chat/conversations/:id      - Get specific conversation
PUT    /chat/conversations/:id      - Update conversation
DELETE /chat/conversations/:id      - Delete conversation
```

#### **Messages**
```
POST   /chat/messages               - Send message
GET    /chat/conversations/:id/messages  - Get messages in conversation (paginated)
PUT    /chat/messages/:id           - Mark message as read
DELETE /chat/messages/:id           - Delete message
```

#### **Status**
```
GET    /chat/unread-count           - Get total unread message count
GET    /chat/conversations/:id/unread - Get unread count for specific conversation
```

### **Request/Response Examples**

#### Create Conversation
```json
POST /chat/conversations
Body: {
  "type": "DIRECT",           // DIRECT | TICKET | GROUP
  "participant_ids": ["user-id-1", "user-id-2"],
  "name": "Project Discussion"  // Optional, required for GROUP
}

Response: {
  "id": "uuid",
  "type": "DIRECT",
  "participant_ids": ["user-id-1", "user-id-2"],
  "created_at": "2026-05-20T10:00:00Z",
  "updated_at": "2026-05-20T10:00:00Z"
}
```

#### Send Message
```json
POST /chat/messages
Body: {
  "conversation_id": "conversation-uuid",
  "text": "Hello, this is a test message"
}

Response: {
  "id": "uuid",
  "conversation_id": "conversation-uuid",
  "sender_id": "current-user-id",
  "text": "Hello, this is a test message",
  "is_read": false,
  "created_at": "2026-05-20T10:00:00Z",
  "updated_at": "2026-05-20T10:00:00Z"
}
```

#### Get Conversations
```json
GET /chat/conversations?page=1&limit=20

Response: {
  "data": [
    {
      "id": "uuid",
      "type": "DIRECT",
      "participant_ids": ["user-1", "user-2"],
      "last_message": "Latest message text...",
      "unread_count": 3,
      "created_at": "2026-05-20T10:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

#### Get Messages
```json
GET /chat/conversations/{conversationId}/messages?page=1&limit=50

Response: {
  "data": [
    {
      "id": "uuid",
      "conversation_id": "conversation-uuid",
      "sender_id": "user-id",
      "sender": {
        "id": "user-id",
        "email": "user@example.com",
        "first_name": "John"
      },
      "text": "Message content",
      "is_read": true,
      "created_at": "2026-05-20T10:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50
}
```

---

## 🔌 WebSocket Events (Real-Time)

### **Connection Setup**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000/chat', {
  auth: {
    userId: 'current-user-id',
    token: 'jwt-token-from-login'
  }
});

socket.on('connect', () => {
  console.log('Connected to chat server');
});
```

### **Emit Events** (Frontend → Backend)

#### Join Conversation
```javascript
socket.emit('join_conversation', {
  conversationId: 'conversation-uuid'
});
```

#### Send Message (Real-Time)
```javascript
socket.emit('send_message', {
  conversationId: 'conversation-uuid',
  text: 'Hello everyone!'
});
```

#### Mark Message as Read
```javascript
socket.emit('mark_as_read', {
  messageId: 'message-uuid'
});
```

#### Typing Indicator
```javascript
socket.emit('typing', {
  conversationId: 'conversation-uuid'
});

// Stop typing (after 3 seconds of inactivity)
socket.emit('stop_typing', {
  conversationId: 'conversation-uuid'
});
```

### **Listen Events** (Backend → Frontend)

#### New Message Received
```javascript
socket.on('message_received', (data) => {
  console.log('New message:', data);
  // data = { id, conversation_id, sender_id, text, created_at, ... }
  // Update UI: Add message to conversation
});
```

#### User Typing
```javascript
socket.on('user_typing', (data) => {
  console.log('User is typing:', data.userId);
  // data = { userId, conversationId }
  // Show "User is typing..." indicator
});
```

#### User Stopped Typing
```javascript
socket.on('user_stopped_typing', (data) => {
  console.log('User stopped typing:', data.userId);
  // Remove typing indicator
});
```

#### Message Read
```javascript
socket.on('message_read', (data) => {
  console.log('Message marked as read:', data.messageId);
  // data = { messageId, conversationId }
  // Update UI: Show read receipt
});
```

#### Error
```javascript
socket.on('error', (data) => {
  console.error('Chat error:', data.message);
  // Handle error gracefully
});
```

---

## 🎨 Frontend Implementation Checklist

### **Phase 1: Components Structure**
- [ ] ChatLayout component (main container)
- [ ] ConversationList component (list of all chats)
- [ ] ConversationDetail component (active conversation)
- [ ] MessageList component (display messages)
- [ ] MessageInput component (send message)
- [ ] TypingIndicator component (shows who's typing)
- [ ] UnreadBadge component (unread count)

### **Phase 2: State Management** (Redux/Zustand/Context)
- [ ] Store conversations list
- [ ] Store current active conversation
- [ ] Store messages for active conversation
- [ ] Store user typing status
- [ ] Store unread counts
- [ ] Store loading/error states

### **Phase 3: WebSocket Integration**
- [ ] Initialize Socket.IO connection
- [ ] Emit `join_conversation` when user opens chat
- [ ] Listen for `message_received` and add to messages
- [ ] Emit `send_message` when user types and sends
- [ ] Emit `typing` while user types
- [ ] Emit `stop_typing` after 3 seconds of inactivity
- [ ] Listen for `user_typing` and show indicator
- [ ] Listen for `user_stopped_typing` and remove indicator
- [ ] Emit `mark_as_read` when messages are viewed
- [ ] Listen for `message_read` to show read receipts

### **Phase 4: REST API Integration**
- [ ] Fetch initial conversations list (GET /chat/conversations)
- [ ] Fetch conversation messages (GET /chat/conversations/:id/messages)
- [ ] Create new conversation (POST /chat/conversations)
- [ ] Get unread count (GET /chat/unread-count)
- [ ] Delete conversation (DELETE /chat/conversations/:id)
- [ ] Delete message (DELETE /chat/messages/:id)

### **Phase 5: UI/UX Features**
- [ ] Display conversations sorted by last message
- [ ] Show unread badge on conversations
- [ ] Highlight active conversation
- [ ] Show user avatars
- [ ] Timestamp on messages (relative time: "2 min ago")
- [ ] Read receipts (checkmarks)
- [ ] Typing indicator ("John is typing...")
- [ ] Search conversations
- [ ] Pagination for messages (load more on scroll)
- [ ] Pagination for conversations
- [ ] Delete message confirmation
- [ ] Create new conversation modal

### **Phase 6: Dashboard Integration**
- [ ] Add chat icon to navigation/dashboard
- [ ] Show unread chat count badge
- [ ] Quick chat access from dashboard
- [ ] Notification for new messages

### **Phase 7: Ticket System Integration** (Optional but Recommended)
- [ ] Auto-create TICKET type conversation for each ticket
- [ ] Display ticket-related chat in ticket details
- [ ] Show chat participants (ticket creator, assigned staff, etc.)

### **Phase 8: Responsive & Mobile**
- [ ] Mobile-friendly layout
- [ ] Touch-friendly buttons
- [ ] Responsive message bubbles
- [ ] Keyboard input handling

---

## 🔐 Authentication & Authorization

### **User Roles & Chat Access**
| Role | Can Create Conversations | Can Message | Can See All Chats |
|------|--------------------------|-------------|-------------------|
| Admin | ✅ Yes | ✅ Yes | ✅ Yes (all) |
| IT Staff | ✅ Yes | ✅ Yes | ✅ Yes (assigned) |
| Supervisor | ✅ Yes | ✅ Yes | ✅ Yes (team) |
| Employee | ✅ Yes | ✅ Yes | ❌ Only own chats |

### **Authentication Flow**
1. User logs in with credentials → JWT token received
2. Store JWT token in localStorage/sessionStorage
3. Include token in WebSocket auth:
```javascript
const socket = io('http://localhost:3000/chat', {
  auth: {
    userId: currentUserId,
    token: jwtToken
  }
});
```
4. Include token in HTTP headers for REST requests:
```javascript
headers: {
  'Authorization': `Bearer ${jwtToken}`,
  'Content-Type': 'application/json'
}
```

---

## 📍 Conversation Types & Use Cases

### **DIRECT** - One-on-One Chat
- Between two users
- Created when user initiates direct message
- Automatic participant management

### **TICKET** - Ticket Discussion
- Related to specific support ticket
- Includes ticket creator, assigned staff, supervisors
- Auto-created when ticket is created
- Reference ticket_id if implementing

### **GROUP** - Group Discussion
- Multiple participants (3+)
- Manual participant management
- Department-wide or project discussions

---

## 🚀 Frontend Setup Instructions

### **1. Install Dependencies**
```bash
npm install socket.io-client axios
```

### **2. Configure API Base URL**
```javascript
const API_BASE_URL = 'http://localhost:3000'; // Dev
// const API_BASE_URL = 'https://api.yourdomain.com'; // Prod
const SOCKET_URL = API_BASE_URL;
```

### **3. Create API Service**
```javascript
// services/chatApi.js
import axios from 'axios';

const instance = axios.create({
  baseURL: `${API_BASE_URL}/chat`
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwtToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const chatApi = {
  getConversations: (page = 1, limit = 20) => 
    instance.get('/conversations', { params: { page, limit } }),
  
  getMessages: (conversationId, page = 1, limit = 50) =>
    instance.get(`/conversations/${conversationId}/messages`, { params: { page, limit } }),
  
  createConversation: (data) =>
    instance.post('/conversations', data),
  
  sendMessage: (data) =>
    instance.post('/messages', data),
  
  markAsRead: (messageId) =>
    instance.put(`/messages/${messageId}`),
  
  getUnreadCount: () =>
    instance.get('/unread-count'),
  
  deleteConversation: (conversationId) =>
    instance.delete(`/conversations/${conversationId}`),
  
  deleteMessage: (messageId) =>
    instance.delete(`/messages/${messageId}`)
};
```

### **4. Initialize WebSocket**
```javascript
// services/chatSocket.js
import io from 'socket.io-client';

let socket = null;

export const initSocket = (userId, token) => {
  socket = io(SOCKET_URL, {
    auth: { userId, token }
  });
  
  socket.on('connect', () => console.log('Chat connected'));
  socket.on('disconnect', () => console.log('Chat disconnected'));
  socket.on('error', (error) => console.error('Socket error:', error));
  
  return socket;
};

export const getSocket = () => socket;
```

---

## 🧪 Testing Endpoints

### **Using Postman/Thunder Client**

1. **Get JWT Token** (from login endpoint)
2. **Add to Headers:**
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   ```
3. **Test Conversations:**
   ```
   POST http://localhost:3000/chat/conversations
   Body: { "type": "DIRECT", "participant_ids": ["id1", "id2"] }
   ```
4. **Test Messages:**
   ```
   POST http://localhost:3000/chat/messages
   Body: { "conversation_id": "uuid", "text": "Hello" }
   ```

---

## 🔄 Integration Timeline

| Phase | Timeline | Priority |
|-------|----------|----------|
| Components Structure | Week 1 | 🔴 High |
| State Management | Week 1 | 🔴 High |
| REST API Integration | Week 1 | 🔴 High |
| WebSocket Integration | Week 2 | 🔴 High |
| UI/UX Polish | Week 2 | 🟡 Medium |
| Dashboard Integration | Week 3 | 🟡 Medium |
| Testing & Bugs | Week 3 | 🔴 High |
| Deployment | Week 4 | 🔴 High |

---

## 📞 Support & Questions

- Backend API: Running on `http://localhost:3000`
- WebSocket URL: `http://localhost:3000/chat`
- All endpoints require JWT authentication
- Database migration completed successfully
- Chat service is production-ready

**Status: ✅ Backend 100% Complete - Ready for Frontend Integration**

---

## 📝 Notes for Frontend Team

1. **Always include JWT token** in requests and WebSocket connection
2. **Implement error handling** for all API calls and socket events
3. **Handle network disconnections** gracefully (reconnect logic)
4. **Paginate** conversations and messages (50 messages per page recommended)
5. **Use timestamps** to sort messages correctly (server-side ordered)
6. **Implement rate limiting UI** (some requests are throttled: 100 req/min per user)
7. **Store unread counts** in state for dashboard badge
8. **Handle typing indicators** efficiently (don't spam typing events)
9. **Test with multiple users** to verify real-time functionality
10. **Performance**: Use virtualization for long message lists

---

**Created: May 20, 2026**
**Status: ✅ Ready for Frontend Development**
