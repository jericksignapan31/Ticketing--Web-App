# 🤖 CHATBOT BACKEND SETUP & CONFIGURATION GUIDE

**Version:** 1.0  
**Date:** November 6, 2026  
**Status:** Ready for Implementation  

---

## 📋 TABLE OF CONTENTS

1. [Quick Start](#quick-start)
2. [Environment Configuration](#environment-configuration)
3. [Knowledge Base Setup](#knowledge-base-setup)
4. [Testing & Validation](#testing--validation)
5. [Troubleshooting](#troubleshooting)
6. [Production Deployment](#production-deployment)

---

## ⚡ QUICK START

### Prerequisites
- NestJS backend running (v11.0.1+)
- PostgreSQL database connected
- Node.js 18+ installed
- Render account (for production)

### Setup Steps (5 minutes)

```bash
# 1. Install dependencies (if not already done)
npm install @google/generative-ai

# 2. Set environment variables (see section below)
# Edit .env file

# 3. Run database migrations
npm run migration:run

# 4. Seed knowledge base (optional but recommended)
npm run seed:chatbot-kb

# 5. Start backend
npm run start:dev

# 6. Verify endpoints
# See "Testing & Validation" section
```

---

## 🔧 ENVIRONMENT CONFIGURATION

### Local Development (.env file)

```bash
# Database (should already exist)
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=it_helpdesk
DB_SSL=false
DB_SYNCHRONIZE=false

# Gemini AI API Key (CRITICAL FOR CHATBOT)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: API Configuration
CORS_ORIGIN=http://localhost:4200,http://localhost:3000
```

### Production (Render Environment Variables)

On your Render dashboard, add these environment variables:

**Step 1:** Go to Dashboard → Select your service → Environment

**Step 2:** Add these variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `GOOGLE_GEMINI_API_KEY` | Get from [Google AI Studio](https://aistudio.google.com/app/apikey) | **CRITICAL** |
| `DB_HOST` | Pool host from Supabase | Already set? |
| `DB_PORT` | 6543 (Supabase pooler) | Already set? |
| `DB_USERNAME` | Supabase user | Already set? |
| `DB_PASSWORD` | Supabase password | Already set? |
| `DB_DATABASE` | Database name | Already set? |
| `CORS_ORIGIN` | Your frontend URL | e.g., https://frontend.onrender.com |

### How to Get Gemini API Key

1. **Go to:** https://aistudio.google.com/app/apikey
2. **Sign in** with Google account (must be same as project)
3. **Click:** "Create API Key"
4. **Select:** Create in "Default project"
5. **Copy** the key
6. **Add to .env** (local) or Render environment variables (production)

⚠️ **SECURITY:** Never commit API keys to Git. Use .env files locally and environment variables in Render.

---

## 📚 KNOWLEDGE BASE SETUP

### Option 1: Automatic Seeding (Recommended)

Create this file: `src/scripts/seed-chatbot-kb.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ChatbotService } from '../chat/services/chatbot.service';

async function seedKnowledgeBase() {
  const app = await NestFactory.create(AppModule);
  const chatbotService = app.get(ChatbotService);

  const faqEntries = [
    // ACCESS & PASSWORDS
    {
      category: 'Access',
      question: 'How do I reset my password?',
      answer: 'The current IT Help Desk system does not provide a Forgot Password or email reset-link flow. If you are signed in, you can change your password through the authenticated POST /auth/change-password endpoint by providing your current password and a new password. If you cannot sign in because you do not know your current password, contact your IT administrator for assistance.',
      keywords: ['password', 'reset', 'forgot', 'login', 'access', 'account'],
    },
    {
      category: 'Access',
      question: 'How do I change my password?',
      answer: 'The current system changes passwords through the authenticated POST /auth/change-password endpoint. Provide your current password and a new password. The new password must be at least 8 characters and contain an uppercase letter, a lowercase letter, a number, and a supported special character. The system rejects a new password that matches the current password.',
      keywords: ['password', 'change', 'security', 'update'],
    },
    {
      category: 'Access',
      question: 'I\'m locked out of my account. What do I do?',
      answer: 'The current system does not provide a self-service Forgot Password or account-unlock flow. If you cannot sign in, contact your IT administrator or submit a support ticket for assistance.',
      keywords: ['locked', 'account', 'locked out', 'access denied'],
    },

    // HARDWARE & CONNECTIVITY
    {
      category: 'Hardware',
      question: 'My printer is not working. How do I troubleshoot?',
      answer: 'Printer troubleshooting steps:\n1. Check if printer is powered on and connected\n2. Verify the printer is connected to the network\n3. Restart the printer (turn off, wait 30 seconds, turn on)\n4. Restart your computer\n5. Try printing from a different application\n6. Check printer queue: Settings → Devices → Printers → {Your Printer} → Open queue → Clear jobs\n7. If still not working, uninstall and reinstall printer driver\n\nCommon printers: HP (https://support.hp.com), Canon (https://support.canon.com), Brother (https://support.brother.com)',
      keywords: ['printer', 'print', 'printing', 'not working', 'hardware', 'network'],
    },
    {
      category: 'Hardware',
      question: 'How do I connect to the company WiFi?',
      answer: 'To connect to company WiFi:\n1. Look for network named "CompanyWiFi" in available networks\n2. Click "Connect"\n3. Enter your username: {your_email@company.com}\n4. Enter your password: {your_company_password}\n5. Click "Connect"\n\nIf "CompanyWiFi" doesn\'t appear:\n- Move closer to a WiFi router\n- Restart your device\n- Check that WiFi is enabled\n\nFor troubleshooting, contact IT support with your device type.',
      keywords: ['wifi', 'wireless', 'network', 'internet', 'connection', 'connect'],
    },
    {
      category: 'Hardware',
      question: 'My computer is running slow. What can I do?',
      answer: 'To improve computer performance:\n1. Restart your computer (close all applications first)\n2. Check available disk space: Settings → System → Storage → Delete temporary files\n3. Close unnecessary applications and browser tabs\n4. Disable startup programs: Task Manager → Startup tab → Disable unnecessary items\n5. Run antivirus scan: Windows Defender → Virus & threat protection\n6. Update Windows and drivers: Settings → Update & Security\n7. Add more RAM (hardware upgrade - contact IT)\n\nIf issues persist after these steps, create a support ticket.',
      keywords: ['slow', 'performance', 'lag', 'memory', 'disk', 'speed'],
    },

    // SOFTWARE & APPLICATIONS
    {
      category: 'Software',
      question: 'How do I install software on my computer?',
      answer: 'To install software:\n1. Go to Software Center or Company IT Portal\n2. Find the application you need\n3. Click "Install"\n4. Follow the installation wizard\n5. Restart your computer if prompted\n\nIf software is not in the Software Center:\n1. Create a support ticket requesting the application\n2. Include the software name and version you need\n3. Our IT team will review and install if approved\n\nDo NOT download software from unknown sources.',
      keywords: ['install', 'software', 'application', 'program', 'download'],
    },
    {
      category: 'Software',
      question: 'An application is not responding. How do I fix it?',
      answer: 'If an application is frozen:\n1. Wait 30 seconds to see if it responds\n2. Try pressing Alt+Tab to switch windows\n3. If still frozen, force close it:\n   - Windows: Ctrl+Shift+Esc → Task Manager → Find application → "End Task"\n   - Mac: Cmd+Option+Esc → Force Quit\n4. Restart the application\n5. If still not working, restart your computer\n6. If problem persists, create a support ticket\n\nFor persistent issues, we can reinstall the application.',
      keywords: ['crash', 'freeze', 'not responding', 'hang', 'close', 'application'],
    },
    {
      category: 'Software',
      question: 'How do I update my software?',
      answer: 'To update applications:\n\nFor Windows:\n1. Settings → Update & Security → Check for updates\n2. Click "Check now" and wait for updates to download\n3. Click "Install now" and restart when prompted\n\nFor individual applications:\n1. Open the application\n2. Go to Help → Check for updates (or About)\n3. If updates available, follow the update wizard\n4. Restart the application\n\nFor security: Always install updates as soon as available.',
      keywords: ['update', 'upgrade', 'patch', 'version', 'latest'],
    },

    // TICKETS & SUPPORT
    {
      category: 'Tickets',
      question: 'How do I create a support ticket?',
      answer: 'To create a support ticket:\n1. Click "Create Ticket" in the help desk portal\n2. Enter a short summary (e.g., "Printer not working")\n3. Select the category: Hardware, Software, Network, Access, Other\n4. Select priority: Low, Medium, High, Urgent\n5. Provide detailed description of your issue\n6. Attach any screenshots or files that help explain the problem\n7. Click "Submit"\n\nYou\'ll receive a ticket ID (IT-YYYYMMDD-XXXX) and email updates on progress.',
      keywords: ['ticket', 'support', 'help', 'issue', 'problem', 'create', 'submit'],
    },
    {
      category: 'Tickets',
      question: 'How do I check my ticket status?',
      answer: 'To check your ticket status:\n1. Log in to the IT Help Desk portal\n2. Go to "My Tickets"\n3. Click on your ticket (IT-YYYYMMDD-XXXX)\n4. View the current status:\n   - "Open": Ticket received, waiting for assignment\n   - "In Progress": IT team is working on it\n   - "Pending": Waiting for your response or additional info\n   - "Resolved": Issue fixed, confirmation needed\n   - "Closed": Ticket completed\n\nYou can also add comments or attach additional files to an open ticket.',
      keywords: ['ticket', 'status', 'progress', 'check', 'tracking', 'update'],
    },
    {
      category: 'Tickets',
      question: 'What do I do if my ticket is not being resolved?',
      answer: 'If your ticket isn\'t progressing:\n1. Add a comment to your ticket with:\n   - Additional details about the issue\n   - Any steps you\'ve already tried\n   - How the issue is affecting your work\n2. Set priority to "Urgent" if your work is blocked\n3. Reach out to IT directly:\n   - Email: it-support@company.com\n   - Phone: ext. 5555\n   - In-person: IT Office, Building A, Room 102\n\nProvide your ticket ID so they can locate your request immediately.',
      keywords: ['ticket', 'slow', 'not resolved', 'escalate', 'urgent', 'follow up'],
    },

    // NETWORK & VPN
    {
      category: 'Network',
      question: 'How do I set up VPN to work from home?',
      answer: 'To set up VPN:\n1. Go to IT Portal → VPN Setup\n2. Download the VPN client appropriate for your OS\n3. Install the VPN client\n4. Restart your computer\n5. Open VPN client\n6. Enter your username: your_email@company.com\n7. Enter your password: your_company_password\n8. Click "Connect"\n9. You should see "Connected" in the VPN app\n\nOnce connected, you can access company resources as if you\'re in the office.\n\nTroubleshooting:\n- Restart VPN client\n- Restart your computer\n- Check firewall settings\n- Create a support ticket if issues persist',
      keywords: ['vpn', 'remote', 'home', 'work from home', 'connection', 'access'],
    },
    {
      category: 'Network',
      question: 'My internet connection keeps dropping. What should I do?',
      answer: 'If your internet connection is unstable:\n1. Restart your modem and router (turn off 30 seconds, turn on)\n2. Restart your computer\n3. Check WiFi signal strength (move closer to router)\n4. Switch to wired connection (Ethernet cable) if available\n5. Check for interference from other devices\n6. Disable VPN and test connection\n7. Run speed test: speedtest.net\n8. Check network status: Settings → Status → Network & Internet\n9. Update network drivers: Device Manager → Network adapters → Right-click → Update driver\n\nIf problem persists after these steps, create a support ticket with:\n- Your location\n- Device type (laptop/desktop)\n- Connection type (WiFi/Ethernet)\n- Speed test results',
      keywords: ['internet', 'connection', 'dropping', 'disconnect', 'unstable', 'network'],
    },

    // GENERAL
    {
      category: 'General',
      question: 'What is the IT Help Desk?',
      answer: 'The IT Help Desk is your central support for:\n- Technical issues and troubleshooting\n- Software and hardware requests\n- Account access and password resets\n- Network and VPN setup\n- Security and compliance guidance\n- Device management\n\nAvailable support channels:\n- Web Portal: http://helpdesk.company.com\n- Email: it-support@company.com\n- Phone: ext. 5555\n- In-person: Building A, Room 102\n\nResponse times:\n- Urgent (work-blocking): 1 hour\n- High: 4 hours\n- Medium: 1 business day\n- Low: 3 business days',
      keywords: ['helpdesk', 'support', 'it', 'help', 'assistance', 'contact'],
    },
    {
      category: 'General',
      question: 'How do I contact IT support?',
      answer: 'Contact IT Support:\n\nEmail: it-support@company.com\n- Best for: Non-urgent issues, detailed documentation\n- Response time: Within 4 business hours\n\nPhone: ext. 5555\n- Best for: Urgent issues, complex problems\n- Hours: 8 AM - 6 PM Mon-Fri\n\nIn-person:\n- Location: Building A, Room 102\n- Hours: 8 AM - 5 PM Mon-Fri\n\nWeb Portal: http://helpdesk.company.com\n- Best for: Tracking tickets, viewing documentation\n- Available 24/7\n\nFor urgent issues that block your work:\n1. Call ext. 5555 immediately\n2. Create a ticket and mark as "Urgent"\n3. Email it-support@company.com with "URGENT" in subject',
      keywords: ['contact', 'support', 'email', 'phone', 'help', 'reach'],
    },
  ];

  console.log(`📚 Starting knowledge base seeding...`);
  
  let created = 0;
  for (const entry of faqEntries) {
    try {
      await chatbotService.addKnowledgeEntry(entry);
      created++;
      console.log(`✅ Added: ${entry.question.substring(0, 50)}...`);
    } catch (error) {
      console.error(`❌ Failed to add: ${entry.question}`, error);
    }
  }

  console.log(`\n✅ Knowledge base seeding complete!`);
  console.log(`📊 Total entries created: ${created}/${faqEntries.length}`);

  await app.close();
}

// Run the seed
seedKnowledgeBase().catch((error) => {
  console.error('Error during seeding:', error);
  process.exit(1);
});
```

**Run the seed:**
```bash
npx ts-node src/scripts/seed-chatbot-kb.ts
```

### Option 2: Manual Entry via API

```bash
# Create a new knowledge base entry
curl -X POST http://localhost:3000/chat/chatbot/kb \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Access",
    "question": "How do I reset my password?",
    "answer": "The current system does not provide a self-service password reset. Signed-in users can change their password using their current password; users who cannot sign in should contact their IT administrator.",
    "keywords": ["password", "reset", "login"]
  }'
```

### Option 3: Direct Database Insert

```sql
INSERT INTO chatbot_knowledge (category, question, answer, keywords, confidence_score, is_active)
VALUES (
  'Access',
  'How do I reset my password?',
  'The current system does not provide a self-service password reset. Signed-in users can change their password using their current password; users who cannot sign in should contact their IT administrator.',
  ARRAY['password', 'reset', 'login'],
  0.95,
  true
);
```

---

## 🧪 TESTING & VALIDATION

### 1. Verify Database Tables Exist

```bash
# Connect to PostgreSQL
psql -h localhost -U username -d database_name

# Check chatbot tables
\dt chatbot*

# Should show:
# - chatbot_interaction
# - chatbot_knowledge
# - ticket_solution
```

### 2. Test Endpoints (Postman or cURL)

#### Create Conversation
```bash
curl -X POST http://localhost:3000/chat/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "DIRECT",
    "name": "Test Chatbot"
  }'

# Expected response:
{
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "DIRECT",
  "name": "Test Chatbot",
  "created_at": "2026-11-06T10:30:00Z"
}
```

#### Send Chatbot Message
```bash
curl -X POST http://localhost:3000/chat/chatbot/message \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "How do I reset my password?"
  }'

# Expected response:
{
  "response": "The current system does not provide a self-service password reset. Signed-in users can change their password using their current password; users who cannot sign in should contact their IT administrator.",
  "intent": "FAQ",
  "confidence": 0.95,
  "responseType": "FAQ",
  "interactionId": "uuid"
}
```

#### Get Stats
```bash
curl -X GET http://localhost:3000/chat/chatbot/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected response:
{
  "totalInteractions": 1,
  "averageConfidence": 0.95,
  "knowledgeBaseSize": 15,
  "resolvedSolutions": 0
}
```

### 3. Automated Testing Script

Create `src/scripts/test-chatbot.ts`:

```typescript
import axios, { AxiosInstance } from 'axios';

class ChatbotTester {
  private client: AxiosInstance;
  private token: string;
  private conversationId: string | null = null;

  constructor(baseURL: string, token: string) {
    this.token = token;
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async testAll() {
    console.log('\n🧪 Starting Chatbot Integration Tests...\n');

    try {
      await this.testCreateConversation();
      await this.testSendMessage();
      await this.testGetStats();
      await this.testSubmitFeedback();
      
      console.log('\n✅ ALL TESTS PASSED!\n');
    } catch (error) {
      console.error('\n❌ TEST FAILED:', error);
      process.exit(1);
    }
  }

  private async testCreateConversation() {
    console.log('📝 Test 1: Create Conversation...');
    const response = await this.client.post('/chat/conversations', {
      type: 'DIRECT',
      name: 'Test Conversation',
    });

    if (!response.data.conversation_id) {
      throw new Error('No conversation_id returned');
    }

    this.conversationId = response.data.conversation_id;
    console.log(`   ✅ Conversation created: ${this.conversationId}\n`);
  }

  private async testSendMessage() {
    console.log('💬 Test 2: Send Chatbot Message...');
    const response = await this.client.post('/chat/chatbot/message', {
      conversation_id: this.conversationId,
      message: 'How do I reset my password?',
    });

    if (!response.data.response) {
      throw new Error('No response received');
    }

    console.log(`   ✅ Got response: "${response.data.response.substring(0, 50)}..."`);
    console.log(`   Intent: ${response.data.intent}, Confidence: ${response.data.confidence}\n`);
  }

  private async testGetStats() {
    console.log('📊 Test 3: Get Statistics...');
    const response = await this.client.get('/chat/chatbot/stats');

    console.log(`   ✅ Stats retrieved:`);
    console.log(`      - Total Interactions: ${response.data.totalInteractions}`);
    console.log(`      - Avg Confidence: ${response.data.averageConfidence}`);
    console.log(`      - KB Size: ${response.data.knowledgeBaseSize}`);
    console.log(`      - Resolved Solutions: ${response.data.resolvedSolutions}\n`);
  }

  private async testSubmitFeedback() {
    console.log('👍 Test 4: Submit Feedback...');
    // Note: This would need a real interactionId from previous test
    console.log(`   ℹ️  Skipped (requires previous interaction ID)\n`);
  }
}

// Usage
const tester = new ChatbotTester(
  'http://localhost:3000',
  'your_jwt_token_here'
);

tester.testAll();
```

**Run tests:**
```bash
npx ts-node src/scripts/test-chatbot.ts
```

---

## 🐛 TROUBLESHOOTING

### Issue: Chatbot responds with generic fallback messages

**Diagnosis:**
```bash
# Check if Gemini API is initialized
# Look for log: "✅ Gemini API initialized successfully"
# Or: "⚠️  GOOGLE_GEMINI_API_KEY not found"
```

**Solution:**
1. ✅ Verify `GOOGLE_GEMINI_API_KEY` is set in environment
2. ✅ Restart the application
3. ✅ Check application logs for initialization message
4. ✅ If API key is wrong, update and redeploy

### Issue: No data returned from knowledge base search

**Solution:**
```bash
# Check KB has entries
psql -h localhost -u username -d database_name
SELECT COUNT(*) FROM chatbot_knowledge WHERE is_active = true;

# If 0, run seed script
npx ts-node src/scripts/seed-chatbot-kb.ts

# If still 0, manually add entries
# See "Manual Entry via API" section above
```

### Issue: Stats endpoint returns `averageConfidence: 0`

**Why:** No interactions yet, or all interactions have NULL confidence

**Solution:**
1. Send a few test messages
2. Stats will update after each message
3. Average confidence calculated from recent interactions

### Issue: 401 Unauthorized on endpoints

**Solution:**
1. ✅ Verify JWT token is valid
2. ✅ Check token not expired (24 hour expiry)
3. ✅ Verify header format: `Authorization: Bearer {token}`
4. ✅ Check JwtAuthGuard is protecting the route

### Issue: Chatbot says "I'm having trouble understanding"

**Why:** Intent detection failed or all handlers returned fallback

**Solutions:**
1. Check message clarity - use clear, complete sentences
2. Try keywords: "password", "printer", "ticket", "troubleshoot"
3. Check Gemini API is working: See logs for any errors
4. If persistent, create support ticket with message details

---

## 🚀 PRODUCTION DEPLOYMENT (Render)

### Pre-Deployment Checklist

- [ ] Gemini API key added to Render environment variables
- [ ] Knowledge base seeded with at least 10 FAQs
- [ ] All tests passing locally
- [ ] Build command: `npm run build` (✅ Success)
- [ ] No TypeScript compilation errors
- [ ] No database migration errors
- [ ] All environment variables set in Render

### Deployment Steps

**1. Push code to GitHub:**
```bash
git add -A
git commit -m "feat: Add chatbot setup and configuration"
git push origin main
```

**2. Render auto-deploys** (watch the build log)

**3. Add Gemini API key on Render:**
- Go to Render Dashboard
- Select your service
- Go to Environment
- Add: `GOOGLE_GEMINI_API_KEY=your_key`
- Click "Save"
- Service will auto-redeploy

**4. Verify production endpoints:**
```bash
# Test production URL
curl -X POST https://ticketing-web-app.onrender.com/chat/chatbot/message \
  -H "Authorization: Bearer PROD_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "test-uuid",
    "message": "How do I reset my password?"
  }'
```

**5. Monitor logs:**
- Go to Render Dashboard → Logs
- Watch for any errors
- Look for "✅ Gemini API initialized successfully"

### Post-Deployment Verification

```bash
# 1. Test conversation creation
✅ /chat/conversations responds with conversation_id

# 2. Test chatbot message
✅ /chat/chatbot/message returns response (not error)

# 3. Test stats
✅ /chat/chatbot/stats returns valid JSON

# 4. Test knowledge base
✅ /chat/chatbot/kb/search returns results

# 5. Check logs
✅ No "GOOGLE_GEMINI_API_KEY" errors
✅ No database connection errors
```

---

## 📞 SUPPORT

For issues or questions about chatbot setup:

1. **Check logs:** Look for error messages
2. **Review this guide:** Search relevant section
3. **Test manually:** Use cURL to isolate the issue
4. **Database check:** Verify tables exist and have data

**Common Issues:**
- ❌ Chatbot not responding? → Check Gemini API key
- ❌ No knowledge base results? → Seed the database
- ❌ 401 errors? → Verify JWT token
- ❌ 404 on endpoints? → Check endpoint paths (/chat not /api/chat)

---

## 📝 MAINTENANCE

### Regular Tasks

**Weekly:**
- Check chatbot stats for unusual patterns
- Review low-confidence responses
- Monitor error logs

**Monthly:**
- Add new FAQ entries based on common tickets
- Update existing answers with improvements
- Review chatbot learning metrics

**Quarterly:**
- Audit knowledge base relevance
- Update confidence scores
- Archive outdated entries

### Monitoring Commands

```bash
# Check recent interactions
SELECT COUNT(*) as recent_interactions 
FROM chatbot_interaction 
WHERE created_at > NOW() - INTERVAL '1 hour';

# Find low-confidence responses
SELECT * FROM chatbot_interaction 
WHERE intent_confidence < 0.5 
ORDER BY created_at DESC 
LIMIT 10;

# Most common intents
SELECT detected_intent, COUNT(*) as count 
FROM chatbot_interaction 
GROUP BY detected_intent 
ORDER BY count DESC;

# Knowledge base coverage
SELECT category, COUNT(*) as entries 
FROM chatbot_knowledge 
WHERE is_active = true 
GROUP BY category;
```

---

## ✅ COMPLETION CHECKLIST

Mark as complete when done:

- [ ] Environment variables configured (.env and/or Render)
- [ ] Gemini API key obtained and set
- [ ] Database migrations run
- [ ] Knowledge base seeded
- [ ] All endpoints tested
- [ ] Production deployment successful
- [ ] Logs monitored for errors
- [ ] Team notified (backend setup complete)
- [ ] Frontend team ready to integrate

---

## 📅 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 6, 2026 | Initial setup guide |

---

**Last Updated:** November 6, 2026  
**Status:** Ready for Implementation ✅
