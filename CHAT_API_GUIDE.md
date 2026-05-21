# Chat API Documentation

## Overview

The chat system supports three types of conversations:
- **GROUP** - Public chats visible to all users
- **DIRECT** - Private 1-on-1 conversations
- **TICKET** - Ticket-related discussions

## API Endpoints

### 1. Initialize General Chat

```http
GET /chat/general
Authorization: Bearer <JWT_TOKEN>
```

**Purpose:** Get or create the General group chat (auto-created if doesn't exist)

**Response (200):**
```json
{
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "GROUP",
  "name": "General",
  "participant_ids": [],
  "messages": [],
  "created_at": "2026-05-21T09:25:16.000Z",
  "updated_at": "2026-05-21T09:25:16.000Z"
}
```

---

### 2. Load All Conversations with Messages

```http
GET /chat/all-conversations-with-messages
Authorization: Bearer <JWT_TOKEN>
```

**Purpose:** Get all conversations (personal + group) with all messages in one API call

**Response (200):**
```json
[
  {
    "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "GROUP",
    "name": "General",
    "participant_ids": [],
    "messages": [
      {
        "message_id": "550e8400-e29b-41d4-a716-446655440001",
        "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
        "sender_id": "EMP001",
        "sender": {
          "employee_id": "EMP001",
          "first_name": "Admin",
          "last_name": "User",
          "email": "admin@ithelp.com"
        },
        "content": "Welcome to the General chat!",
        "is_read": false,
        "created_at": "2026-05-21T09:30:00.000Z"
      }
    ],
    "created_at": "2026-05-21T09:25:16.000Z",
    "updated_at": "2026-05-21T09:30:00.000Z"
  },
  {
    "conversation_id": "550e8400-e29b-41d4-a716-446655440002",
    "type": "DIRECT",
    "name": "Admin User, John Doe",
    "participant_ids": ["EMP001", "EMP002"],
    "messages": [
      {
        "message_id": "550e8400-e29b-41d4-a716-446655440003",
        "conversation_id": "550e8400-e29b-41d4-a716-446655440002",
        "sender_id": "EMP001",
        "sender": {
          "employee_id": "EMP001",
          "first_name": "Admin",
          "last_name": "User",
          "email": "admin@ithelp.com"
        },
        "content": "Hi, how are you?",
        "is_read": true,
        "created_at": "2026-05-21T09:35:00.000Z"
      }
    ],
    "created_at": "2026-05-21T09:25:16.000Z",
    "updated_at": "2026-05-21T09:35:00.000Z"
  }
]
```

---

### 3. Send Message

```http
POST /chat/messages
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "This is my message!"
}
```

**Response (201):**
```json
{
  "message_id": "550e8400-e29b-41d4-a716-446655440004",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "sender_id": "EMP001",
  "content": "This is my message!",
  "is_read": false,
  "created_at": "2026-05-21T09:40:00.000Z"
}
```

**Error Responses:**
- `404` - Conversation not found
- `400` - User not allowed to send messages in this chat

---

### 4. Get Conversations (Paginated)

```http
GET /chat/conversations?page=1&limit=50
Authorization: Bearer <JWT_TOKEN>
```

**Parameters:**
- `page` (optional): Page number (1-indexed), default: 1
- `limit` (optional): Results per page, max: 100, default: 50

**Response (200):**
```json
{
  "data": [
    {
      "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "GROUP",
      "name": "General",
      "participant_ids": [],
      "messages": [],
      "created_at": "2026-05-21T09:25:16.000Z",
      "updated_at": "2026-05-21T09:30:00.000Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 50
}
```

---

### 5. Get Specific Conversation Messages

```http
GET /chat/conversations/:conversationId/messages?limit=50&offset=0
Authorization: Bearer <JWT_TOKEN>
```

**Parameters:**
- `limit` (optional): Message limit, default: 50
- `offset` (optional): Pagination offset, default: 0

**Response (200):**
```json
[
  {
    "message_id": "550e8400-e29b-41d4-a716-446655440001",
    "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
    "sender_id": "EMP001",
    "sender": {
      "employee_id": "EMP001",
      "first_name": "Admin",
      "last_name": "User",
      "email": "admin@ithelp.com"
    },
    "content": "Hello!",
    "is_read": false,
    "created_at": "2026-05-21T09:30:00.000Z"
  }
]
```

---

### 6. Get Conversation Details

```http
GET /chat/conversations/:conversationId
Authorization: Bearer <JWT_TOKEN>
```

**Response (200):**
```json
{
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "GROUP",
  "name": "General",
  "participant_ids": [],
  "messages": [],
  "created_at": "2026-05-21T09:25:16.000Z",
  "updated_at": "2026-05-21T09:30:00.000Z"
}
```

---

### 7. Create Direct Conversation

```http
POST /chat/conversations/direct/:otherUserId
Authorization: Bearer <JWT_TOKEN>
```

**Response (201):**
```json
{
  "conversation_id": "550e8400-e29b-41d4-a716-446655440002",
  "type": "DIRECT",
  "name": "Admin User, John Doe",
  "participant_ids": ["EMP001", "EMP002"],
  "messages": [],
  "created_at": "2026-05-21T09:25:16.000Z",
  "updated_at": "2026-05-21T09:25:16.000Z"
}
```

---

### 8. Create Group Conversation

```http
POST /chat/conversations
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "type": "GROUP",
  "name": "Team Chat",
  "participant_ids": ["EMP001", "EMP002", "EMP003"]
}
```

**Response (201):**
```json
{
  "conversation_id": "550e8400-e29b-41d4-a716-446655440005",
  "type": "GROUP",
  "name": "Team Chat",
  "participant_ids": ["EMP001", "EMP002", "EMP003"],
  "messages": [],
  "created_at": "2026-05-21T09:45:00.000Z",
  "updated_at": "2026-05-21T09:45:00.000Z"
}
```

---

### 9. Delete Conversation

```http
DELETE /chat/conversations/:conversationId
Authorization: Bearer <JWT_TOKEN>
```

**Response (204 No Content)**

---

## Conversation Types

| Type | Description | Access | Can Send Messages | Use Case |
|------|-------------|--------|------------------|----------|
| **GROUP** | Public group chat | All authenticated users | All users | Company-wide announcements, general discussions |
| **DIRECT** | Private 1-on-1 | Participants only | Participants only | Private conversations between two users |
| **TICKET** | Ticket discussion | Ticket participants | Ticket participants | Support ticket communication |

---

## Frontend Implementation Guide

### Step 1: App Initialization

On app load, fetch all conversations with messages:

```typescript
// Load all conversations on app start
const conversations = await fetch('/chat/all-conversations-with-messages', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(res => res.json());

// Display in sidebar/list
conversations.forEach(conv => {
  displayConversation(conv);
});
```

### Step 2: Display Conversations

```typescript
conversations.forEach(conversation => {
  if (conversation.type === 'GROUP') {
    // Display as public group (no invite button)
    renderGroupChat(conversation);
  } else if (conversation.type === 'DIRECT') {
    // Display with other user's name
    renderDirectChat(conversation);
  }
});
```

### Step 3: Send Message

```typescript
async function sendMessage(conversationId, content) {
  const response = await fetch('/chat/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ conversation_id: conversationId, content })
  });
  
  const newMessage = await response.json();
  addMessageToUI(newMessage);
}
```

### Step 4: Display Messages

```typescript
// For each message in conversation.messages:
const sender = message.sender;
console.log(`${sender.first_name} ${sender.last_name}: ${message.content}`);

// Show sender info even in group chats
// This distinguishes who said what in the General chat
```

### Step 5: Group Chat Behavior

```typescript
// For GROUP type conversations:
// - Show "General" at top of chat list
// - No "Add Members" button (everyone can access)
// - Show all user messages mixed together
// - Anyone can message without invitation

// Example: General chat shows all employees' messages:
// [Admin User]: Welcome!
// [John Doe]: Hi everyone
// [Jane Smith]: Hello team
// [Admin User]: Let's discuss Q2 goals
```

---

## Key Behaviors

### ✅ General Chat
- **Visibility**: Visible to ALL logged-in users
- **Access**: No invite needed
- **Messages**: Broadcast to everyone
- **Use**: Company announcements, general discussions
- **Auto-created**: First call to `/chat/general` creates it

### ✅ Group Chat (Custom)
- **Visibility**: Specified participants only
- **Access**: Need to be added
- **Messages**: Only participants see
- **Use**: Team-specific discussions

### ✅ Direct Chat
- **Visibility**: 1-on-1 only
- **Access**: Only between 2 participants
- **Messages**: Private
- **Use**: Personal conversations

---

## Error Handling

| Error | Status | Meaning | Solution |
|-------|--------|---------|----------|
| Conversation not found | 404 | Chat doesn't exist | Check conversation ID |
| User not allowed | 400 | Not a participant in direct chat | Can't message private chats you're not in |
| Not authenticated | 401 | Missing JWT token | Login first |
| Invalid message | 400 | Content is empty/invalid | Check message content |

---

## Best Practices

1. **Load once**: Call `/all-conversations-with-messages` on app load
2. **Cache locally**: Store conversations in state to avoid repeated API calls
3. **Real-time ready**: Current API can be enhanced with WebSocket later
4. **Group chat UX**: Show sender name for each message (who said what)
5. **Sorting**: Display messages from oldest to newest
6. **Timestamps**: Show when each message was sent

---

## Example Frontend Flow

```
┌─ User Opens App
│
├─ GET /chat/all-conversations-with-messages
│  └─ Get all chats + messages
│
├─ Display Chats:
│  ├─ [General] ← Public to all
│  ├─ [Direct: John Doe]
│  └─ [Direct: Jane Smith]
│
├─ User clicks "General"
│  └─ Show all messages from all employees
│
├─ User types message + Send
│  ├─ POST /chat/messages
│  ├─ Message saved to database
│  └─ Message appears in UI
│
└─ All other users see it immediately
   (when they refresh or have real-time connection)
```

---

## Testing with cURL

### Get General Chat
```bash
curl -X GET https://ticketing-web-app.onrender.com/chat/general \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Send Message
```bash
curl -X POST https://ticketing-web-app.onrender.com/chat/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"conversation_id":"uuid-here","content":"Hello!"}'
```

### Get All Conversations
```bash
curl -X GET https://ticketing-web-app.onrender.com/chat/all-conversations-with-messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

Get token by logging in:
```bash
POST /auth/login
{
  "username": "EMP001",
  "password": "admin123"
}
```

---

## Summary

- **General chat**: Public group, everyone sees it
- **Direct chat**: Private 1-on-1
- **One API call**: `/all-conversations-with-messages` gets everything
- **Same send endpoint**: All chat types use `/messages` POST
- **Frontend displays**: Show sender name for each message
- **No real-time yet**: Refresh to see new messages (can add WebSocket later)
