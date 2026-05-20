# 💬 CHAT FEATURE IMPLEMENTATION GUIDE

**Status:** ✅ Backend Complete  
**Date:** May 20, 2026  
**Version:** 1.0.0

---

## 📋 WHAT WAS BUILT

### ✅ Database Entities
- **Message** - Individual chat messages
- **Conversation** - Chat groups/threads

### ✅ API Endpoints (REST)
```
POST   /chat/conversations              - Create new conversation
GET    /chat/conversations              - Get user's conversations
GET    /chat/conversations/:id          - Get conversation details
DELETE /chat/conversations/:id          - Delete conversation

POST   /chat/messages                   - Send message
GET    /chat/conversations/:id/messages - Get conversation messages
POST   /chat/messages/:id/read          - Mark message as read
DELETE /chat/messages/:id               - Delete message

GET    /chat/unread-count               - Get unread messages count
```

### ✅ WebSocket Events (Real-time)
```
join_conversation     - User joins a chat room
leave_conversation    - User leaves a chat room
send_message         - Send real-time message
typing               - Show typing indicator
mark_as_read         - Mark message as read
```

### ✅ Features
- Direct messaging between users
- Group chat support (by ticket or department)
- Real-time message delivery via WebSocket
- Message read status tracking
- Typing indicators
- Unread message count
- Message history with pagination

---

## 🔧 INSTALLATION REQUIREMENTS

### 1. **Install Socket.IO Dependencies**

```bash
npm install socket.io socket.io-client
npm install --save-dev @types/socket.io
```

### 2. **Update Main Application File**

Edit `src/main.ts` to enable CORS for WebSocket:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: '*', // Or specify your frontend URL
      credentials: true,
    },
  });
  
  await app.listen(3000);
}
bootstrap();
```

### 3. **Run Database Migration**

```bash
npm run migration:run
```

This creates:
- `conversation` table
- `message` table
- Foreign key relationships
- Indexes for performance

---

## 📱 HOW TO USE (FRONTEND)

### **Connect to Chat Server**

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/chat', {
  auth: {
    userId: 'user-uuid-here'
  }
});
```

### **Join a Conversation**

```javascript
// Join a specific conversation room
socket.emit('join_conversation', {
  conversationId: 'conversation-uuid'
});
```

### **Send a Message (Real-time)**

```javascript
socket.emit('send_message', {
  conversation_id: 'conversation-uuid',
  content: 'Hello, this is a message'
});

// Listen for new messages
socket.on('new_message', (message) => {
  console.log('New message:', message);
});
```

### **Show Typing Indicator**

```javascript
// When user starts typing
socket.emit('typing', {
  conversationId: 'conversation-uuid',
  isTyping: true
});

// When user stops typing
socket.emit('typing', {
  conversationId: 'conversation-uuid',
  isTyping: false
});

// Listen for other users typing
socket.on('user_typing', (data) => {
  console.log(`${data.userId} is ${data.isTyping ? 'typing...' : 'not typing'}`);
});
```

### **Get Conversations (REST API)**

```bash
curl -X GET http://localhost:3000/chat/conversations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Get Message History**

```bash
curl -X GET "http://localhost:3000/chat/conversations/{id}/messages?limit=50&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 CONVERSATION TYPES

### 1. **DIRECT Conversation**
- One-on-one messaging
- Private between two users
- Created via: `POST /chat/conversations/direct/:otherUserId`

### 2. **TICKET Conversation**
- Discussion attached to a support ticket
- Multiple participants (Employee + IT Staff + Supervisor)
- Auto-created when ticket is created

### 3. **GROUP Conversation**
- Multi-user chat
- Department or branch based
- Manual creation required

---

## 📊 DATABASE SCHEMA

### **Conversation Table**
```
conversation_id  (UUID, Primary Key)
type            (DIRECT | TICKET | GROUP)
ticket_id       (UUID, Foreign Key to Ticket)
name            (String)
participant_ids (Array of User IDs)
created_at      (Timestamp)
updated_at      (Timestamp)
```

### **Message Table**
```
message_id      (UUID, Primary Key)
conversation_id (UUID, Foreign Key)
sender_id       (UUID, Foreign Key to UserAccount)
content         (Text)
is_read         (Boolean)
created_at      (Timestamp)
updated_at      (Timestamp)
```

---

## 🔐 SECURITY FEATURES

✅ **JWT Authentication**
- All REST endpoints require valid JWT token
- WebSocket requires userId in auth

✅ **Access Control**
- Users can only see their own conversations
- Can only send messages in conversations they're part of

✅ **Participant Validation**
- System verifies user is conversation participant

✅ **Message Encryption** (Optional Future Enhancement)
- Can add encryption for sensitive messages

---

## ⚡ PERFORMANCE OPTIMIZATIONS

✅ **Database Indexes**
- Conversation type indexed
- Message conversation_id indexed
- Message sender_id indexed
- Message is_read status indexed

✅ **Pagination**
- Message history supports limit/offset
- Prevents loading massive conversations at once

✅ **Real-time Efficiency**
- WebSocket reduces API call overhead
- Only participants receive messages
- Efficient room-based broadcasting

---

## 🧪 TESTING THE FEATURE

### **1. Create a Conversation**
```bash
POST /chat/conversations
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "type": "DIRECT",
  "name": "Chat with John",
  "participant_ids": ["user-id-1", "user-id-2"]
}
```

### **2. Send a Message (REST)**
```bash
POST /chat/messages
Authorization: Bearer TOKEN

{
  "conversation_id": "conversation-uuid",
  "content": "Hello!"
}
```

### **3. Get Unread Count**
```bash
GET /chat/unread-count
Authorization: Bearer TOKEN

Response: { "unread_count": 5 }
```

---

## 📝 NEXT STEPS (Future Enhancements)

- [ ] File/Image attachment support
- [ ] Message reactions (emoji reactions)
- [ ] Message threading/replies
- [ ] Search messages
- [ ] Chat notifications
- [ ] Pinned messages
- [ ] Message editing
- [ ] Voice/Video call integration
- [ ] Message encryption
- [ ] Read receipts with timestamps

---

## ❓ TROUBLESHOOTING

**Problem:** WebSocket connection fails
**Solution:** Verify CORS settings in main.ts

**Problem:** Messages not received in real-time
**Solution:** Ensure user is joined to conversation room

**Problem:** Old messages not showing
**Solution:** Use `/chat/conversations/:id/messages` endpoint with pagination

---

## 📞 SUPPORT

For issues or questions:
1. Check WebSocket connection status
2. Verify JWT token is valid
3. Ensure user is participant in conversation
4. Check browser console for errors

---

**Chat Feature Successfully Implemented! 🎉**

Last updated: May 20, 2026
