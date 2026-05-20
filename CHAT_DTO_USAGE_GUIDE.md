# Chat API - DTO Usage Guide

## 📋 Overview

All DTOs (Data Transfer Objects) are properly validated and integrated with the backend fixes. This guide shows you exactly how to use them.

---

## 🎯 CreateConversationDto

### Purpose
Create a new conversation between users (DIRECT, TICKET, or GROUP type)

### Field Breakdown

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | ConversationType enum | ✅ Yes | DIRECT, TICKET, or GROUP |
| `name` | string | ✅ Yes | Conversation name/title |
| `participant_ids` | string[] | ❌ No* | Other user IDs (current user auto-added) |
| `ticket_id` | UUID | ❌ No | Reference to ticket (for TICKET type) |

*Note: Even if not provided, current user is automatically added

### Valid Examples

#### Example 1: Create DIRECT Conversation
```typescript
// Frontend/Request Body
{
  "type": "DIRECT",
  "name": "Chat with John",
  "participant_ids": ["550e8400-e29b-41d4-a716-446655440000"]
}

// Backend Processing:
// - Current user: "abc12345-e29b-41d4-a716-446655440099"
// - Provided participants: ["550e8400-e29b-41d4-a716-446655440000"]
// - Final participants: ["abc12345-e29b-41d4-a716-446655440099", "550e8400-e29b-41d4-a716-446655440000"]

// Response
{
  "conversation_id": "conv-uuid-12345",
  "type": "DIRECT",
  "name": "Chat with John",
  "participant_ids": ["abc12345-e29b-41d4-a716-446655440099", "550e8400-e29b-41d4-a716-446655440000"],
  "created_at": "2026-05-20T10:00:00Z",
  "updated_at": "2026-05-20T10:00:00Z"
}
```

---

#### Example 2: Create GROUP Conversation
```typescript
// Frontend/Request Body
{
  "type": "GROUP",
  "name": "Project Team Discussion",
  "participant_ids": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002",
    "550e8400-e29b-41d4-a716-446655440003"
  ]
}

// Backend Processing:
// - Current user: "abc12345-e29b-41d4-a716-446655440099"
// - Provided participants: [3 user IDs]
// - Final participants: [4 user IDs including current user]

// Response
{
  "conversation_id": "conv-uuid-group-001",
  "type": "GROUP",
  "name": "Project Team Discussion",
  "participant_ids": [
    "abc12345-e29b-41d4-a716-446655440099",
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002",
    "550e8400-e29b-41d4-a716-446655440003"
  ],
  "created_at": "2026-05-20T10:00:00Z",
  "updated_at": "2026-05-20T10:00:00Z"
}
```

---

#### Example 3: Create TICKET Conversation
```typescript
// Frontend/Request Body
{
  "type": "TICKET",
  "name": "Ticket #12345 - Network Issue",
  "ticket_id": "550e8400-e29b-41d4-a716-446655440050",
  "participant_ids": [
    "550e8400-e29b-41d4-a716-446655440010"  // IT Staff assigned
  ]
}

// Backend Processing:
// - Current user: "abc12345-e29b-41d4-a716-446655440099" (Employee who created ticket)
// - Provided participants: [IT Staff ID]
// - Final participants: [Employee, IT Staff]

// Response
{
  "conversation_id": "conv-uuid-ticket-001",
  "type": "TICKET",
  "name": "Ticket #12345 - Network Issue",
  "ticket_id": "550e8400-e29b-41d4-a716-446655440050",
  "participant_ids": [
    "abc12345-e29b-41d4-a716-446655440099",
    "550e8400-e29b-41d4-a716-446655440010"
  ],
  "created_at": "2026-05-20T10:00:00Z",
  "updated_at": "2026-05-20T10:00:00Z"
}
```

---

### Validation Rules

| Field | Validation |
|-------|-----------|
| `type` | Must be: "DIRECT", "TICKET", or "GROUP" |
| `name` | Non-empty string (required) |
| `participant_ids` | Array of strings (optional, auto-includes current user) |
| `ticket_id` | Valid UUID format (optional) |

---

### Error Cases

#### ❌ Error: Invalid Type
```typescript
{
  "type": "INVALID_TYPE",  // ❌ Not in enum
  "name": "Chat",
  "participant_ids": ["user-id"]
}

// Response: 400 Bad Request
{
  "statusCode": 400,
  "message": "type must be one of the following values: DIRECT, TICKET, GROUP",
  "error": "Bad Request"
}
```

---

#### ❌ Error: Missing Name
```typescript
{
  "type": "DIRECT",
  // ❌ Missing name field
  "participant_ids": ["user-id"]
}

// Response: 400 Bad Request
{
  "statusCode": 400,
  "message": "name should not be empty",
  "error": "Bad Request"
}
```

---

#### ❌ Error: Invalid Ticket ID
```typescript
{
  "type": "TICKET",
  "name": "Ticket Chat",
  "ticket_id": "not-a-uuid"  // ❌ Invalid UUID format
}

// Response: 400 Bad Request
{
  "statusCode": 400,
  "message": "ticket_id must be a UUID",
  "error": "Bad Request"
}
```

---

## 🎯 ConversationResponseDto

### Purpose
Response object when fetching or creating conversations

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `conversation_id` | UUID | Unique conversation identifier |
| `type` | ConversationType | DIRECT, TICKET, or GROUP |
| `name` | string | Conversation name/title |
| `participant_ids` | string[] | Array of all participant user IDs |
| `created_at` | Date | ISO timestamp when created |
| `updated_at` | Date | ISO timestamp of last update |

### Example Response
```json
{
  "conversation_id": "9a97deee-01d9-4636-9d13-3e20b8fd7f9d",
  "type": "DIRECT",
  "name": "Chat with Support Team",
  "participant_ids": [
    "ce740cf2-2779-40a8-a3b9-ea2c0193146e",
    "550e8400-e29b-41d4-a716-446655440000"
  ],
  "created_at": "2026-05-20T09:30:00.000Z",
  "updated_at": "2026-05-20T10:15:30.000Z"
}
```

---

## 📨 CreateMessageDto (Reference)

### Purpose
Send a message in a conversation

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `conversation_id` | UUID | ✅ Yes | Which conversation to send to |
| `text` | string | ✅ Yes | Message content |

### Valid Example
```typescript
{
  "conversation_id": "9a97deee-01d9-4636-9d13-3e20b8fd7f9d",
  "text": "Hello team! How are you doing?"
}

// Response: 201 Created
{
  "message_id": "msg-uuid-001",
  "conversation_id": "9a97deee-01d9-4636-9d13-3e20b8fd7f9d",
  "sender_id": "ce740cf2-2779-40a8-a3b9-ea2c0193146e",
  "text": "Hello team! How are you doing?",
  "is_read": false,
  "created_at": "2026-05-20T10:30:00.000Z",
  "updated_at": "2026-05-20T10:30:00.000Z"
}
```

---

### Error: User Not Participant (NOW FIXED ✅)
```typescript
{
  "conversation_id": "9a97deee-01d9-4636-9d13-3e20b8fd7f9d",
  "text": "Trying to send message"
}

// BEFORE FIX: ❌ 400 Bad Request "User is not a participant in this chat"
// AFTER FIX: ✅ 201 Created (message sent successfully)
```

---

## 🔄 Complete API Flow Example

### Step 1: Create Conversation
```bash
POST /chat/conversations
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "type": "DIRECT",
  "name": "Chat with Support",
  "participant_ids": ["550e8400-e29b-41d4-a716-446655440000"]
}

// Response: 201 Created
{
  "conversation_id": "conv-123",
  "type": "DIRECT",
  "name": "Chat with Support",
  "participant_ids": ["current-user-id", "550e8400-e29b-41d4-a716-446655440000"],
  "created_at": "2026-05-20T10:00:00Z"
}
```

---

### Step 2: Send Message
```bash
POST /chat/messages
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "conversation_id": "conv-123",
  "text": "Hello! I need help with my network"
}

// Response: 201 Created
{
  "message_id": "msg-123",
  "conversation_id": "conv-123",
  "sender_id": "current-user-id",
  "text": "Hello! I need help with my network",
  "is_read": false,
  "created_at": "2026-05-20T10:00:05Z"
}
```

---

### Step 3: Get Conversation Messages
```bash
GET /chat/conversations/conv-123/messages?limit=50
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

// Response: 200 OK
{
  "data": [
    {
      "message_id": "msg-123",
      "conversation_id": "conv-123",
      "sender_id": "current-user-id",
      "sender": {
        "id": "current-user-id",
        "email": "user@example.com",
        "first_name": "John"
      },
      "text": "Hello! I need help with my network",
      "is_read": false,
      "created_at": "2026-05-20T10:00:05Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 50
}
```

---

## 🧪 Quick Test with cURL

### Create Conversation
```bash
curl -X POST http://localhost:3000/chat/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "DIRECT",
    "name": "Test Chat",
    "participant_ids": ["550e8400-e29b-41d4-a716-446655440000"]
  }'
```

### Send Message
```bash
curl -X POST http://localhost:3000/chat/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "CONVERSATION_ID_FROM_ABOVE",
    "text": "Hello World!"
  }'
```

### Get All Conversations
```bash
curl -X GET http://localhost:3000/chat/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Direct Conversation (Auto-Create)
```bash
curl -X POST http://localhost:3000/chat/conversations/direct/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔐 Important Notes

### Participant ID Handling
✅ **Automatically Handled by Backend:**
- Current user always added to participants
- All IDs normalized to strings
- Case-insensitive comparison
- No duplicates

### Example: You Don't Need to Include Yourself
```typescript
// ❌ WRONG (but still works!)
{
  "type": "DIRECT",
  "name": "Chat",
  "participant_ids": [
    "your-user-id",  // You don't need to include yourself
    "other-user-id"
  ]
}

// ✅ CORRECT
{
  "type": "DIRECT",
  "name": "Chat",
  "participant_ids": [
    "other-user-id"  // Just include others
  ]
}

// Result: Both produce same participant_ids = [your-id, other-id]
```

---

## 📊 DTO Validation Summary

| DTO | Fields | Validation Level |
|-----|--------|------------------|
| CreateConversationDto | 4 fields | Enum + String + Array + UUID |
| ConversationResponseDto | 6 fields | Read-only (no validation) |
| CreateMessageDto | 2 fields | UUID + String |
| MessageResponseDto | 6 fields | Read-only (no validation) |

---

## 🚀 Status

| Component | Status |
|-----------|--------|
| DTOs Defined | ✅ Complete |
| Validation Rules | ✅ Enforced |
| Auto-Participant Logic | ✅ Fixed |
| Type Safety | ✅ Fixed |
| Compilation | ✅ Successful |
| Ready for Use | ✅ Yes |

---

## 📞 Common Issues & Solutions

### Issue: Participant Not Auto-Added
**Solution:** Backend automatically adds current user - no action needed from frontend

### Issue: Case Mismatch in User IDs
**Solution:** Normalized to lowercase - all cases work (UUID, uuid, Uuid)

### Issue: Duplicate Participant
**Solution:** Filtered out automatically - can't add same user twice

### Issue: Empty Participant List
**Solution:** Auto-added current user - never empty after creation

---

**Created:** May 20, 2026  
**Status:** ✅ READY FOR USE  
**Build:** ✅ Successful  
**Validation:** ✅ Complete
