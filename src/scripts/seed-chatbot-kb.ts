import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ChatbotService } from '../chat/services/chatbot.service';

async function seedChatbotKnowledgeBase() {
  const app = await NestFactory.create(AppModule);
  const chatbotService = app.get(ChatbotService);

  const faqEntries = [
    // ACCESS & PASSWORDS
    {
      category: 'Access',
      question: 'How do I reset my password?',
      answer:
        'The current IT Help Desk system does not provide a Forgot Password or email reset-link flow. If you are signed in, you can change your password through the authenticated POST /auth/change-password endpoint by providing your current password and a new password. If you cannot sign in because you do not know your current password, contact your IT administrator for assistance.',
      keywords: ['password', 'reset', 'forgot', 'login', 'access', 'account'],
    },
    {
      category: 'Access',
      question: 'How do I change my password?',
      answer:
        'The current system changes passwords through the authenticated POST /auth/change-password endpoint. Provide your current password and a new password. The new password must be at least 8 characters and contain an uppercase letter, a lowercase letter, a number, and a supported special character. The system rejects a new password that matches the current password.',
      keywords: ['password', 'change', 'security', 'update'],
    },
    {
      category: 'Access',
      question: "I'm locked out of my account. What do I do?",
      answer:
        'The current system does not provide a self-service Forgot Password or account-unlock flow. If you cannot sign in, contact your IT administrator or submit a support ticket for assistance.',
      keywords: ['locked', 'account', 'locked out', 'access denied'],
    },

    // HARDWARE & CONNECTIVITY
    {
      category: 'Hardware',
      question: 'My printer is not working. How do I troubleshoot?',
      answer:
        'Printer troubleshooting steps:\n1. Check if printer is powered on and connected\n2. Verify the printer is connected to the network\n3. Restart the printer (turn off, wait 30 seconds, turn on)\n4. Restart your computer\n5. Try printing from a different application\n6. Check printer queue: Settings → Devices → Printers → {Your Printer} → Open queue → Clear jobs\n7. If still not working, uninstall and reinstall printer driver\n\nCommon printers: HP (https://support.hp.com), Canon (https://support.canon.com), Brother (https://support.brother.com)',
      keywords: ['printer', 'print', 'printing', 'not working', 'hardware', 'network'],
    },
    {
      category: 'Hardware',
      question: 'How do I connect to the company WiFi?',
      answer:
        'To connect to company WiFi:\n1. Look for network named "CompanyWiFi" in available networks\n2. Click "Connect"\n3. Enter your username: {your_email@company.com}\n4. Enter your password: {your_company_password}\n5. Click "Connect"\n\nIf "CompanyWiFi" doesn\'t appear:\n- Move closer to a WiFi router\n- Restart your device\n- Check that WiFi is enabled\n\nFor troubleshooting, contact IT support with your device type.',
      keywords: ['wifi', 'wireless', 'network', 'internet', 'connection', 'connect'],
    },
    {
      category: 'Hardware',
      question: 'My computer is running slow. What can I do?',
      answer:
        'To improve computer performance:\n1. Restart your computer (close all applications first)\n2. Check available disk space: Settings → System → Storage → Delete temporary files\n3. Close unnecessary applications and browser tabs\n4. Disable startup programs: Task Manager → Startup tab → Disable unnecessary items\n5. Run antivirus scan: Windows Defender → Virus & threat protection\n6. Update Windows and drivers: Settings → Update & Security\n7. Add more RAM (hardware upgrade - contact IT)\n\nIf issues persist after these steps, create a support ticket.',
      keywords: ['slow', 'performance', 'lag', 'memory', 'disk', 'speed'],
    },

    // SOFTWARE & APPLICATIONS
    {
      category: 'Software',
      question: 'How do I install software on my computer?',
      answer:
        'To install software:\n1. Go to Software Center or Company IT Portal\n2. Find the application you need\n3. Click "Install"\n4. Follow the installation wizard\n5. Restart your computer if prompted\n\nIf software is not in the Software Center:\n1. Create a support ticket requesting the application\n2. Include the software name and version you need\n3. Our IT team will review and install if approved\n\nDo NOT download software from unknown sources.',
      keywords: ['install', 'software', 'application', 'program', 'download'],
    },
    {
      category: 'Software',
      question: 'An application is not responding. How do I fix it?',
      answer:
        'If an application is frozen:\n1. Wait 30 seconds to see if it responds\n2. Try pressing Alt+Tab to switch windows\n3. If still frozen, force close it:\n   - Windows: Ctrl+Shift+Esc → Task Manager → Find application → "End Task"\n   - Mac: Cmd+Option+Esc → Force Quit\n4. Restart the application\n5. If still not working, restart your computer\n6. If problem persists, create a support ticket\n\nFor persistent issues, we can reinstall the application.',
      keywords: ['crash', 'freeze', 'not responding', 'hang', 'close', 'application'],
    },
    {
      category: 'Software',
      question: 'How do I update my software?',
      answer:
        'To update applications:\n\nFor Windows:\n1. Settings → Update & Security → Check for updates\n2. Click "Check now" and wait for updates to download\n3. Click "Install now" and restart when prompted\n\nFor individual applications:\n1. Open the application\n2. Go to Help → Check for updates (or About)\n3. If updates available, follow the update wizard\n4. Restart the application\n\nFor security: Always install updates as soon as available.',
      keywords: ['update', 'upgrade', 'patch', 'version', 'latest'],
    },

    // TICKETS & SUPPORT
    {
      category: 'Tickets',
      question: 'How do I create a support ticket?',
      answer:
        'To create a support ticket:\n1. Click "Create Ticket" in the help desk portal\n2. Enter a short summary (e.g., "Printer not working")\n3. Select the category: Hardware, Software, Network, Access, Other\n4. Select priority: Low, Medium, High, Urgent\n5. Provide detailed description of your issue\n6. Attach any screenshots or files that help explain the problem\n7. Click "Submit"\n\nYou\'ll receive a ticket ID (IT-YYYYMMDD-XXXX) and email updates on progress.',
      keywords: ['ticket', 'support', 'help', 'issue', 'problem', 'create', 'submit'],
    },
    {
      category: 'Tickets',
      question: 'How do I check my ticket status?',
      answer:
        'To check your ticket status:\n1. Log in to the IT Help Desk portal\n2. Go to "My Tickets"\n3. Click on your ticket (IT-YYYYMMDD-XXXX)\n4. View the current status:\n   - "Open": Ticket received, waiting for assignment\n   - "In Progress": IT team is working on it\n   - "Pending": Waiting for your response or additional info\n   - "Resolved": Issue fixed, confirmation needed\n   - "Closed": Ticket completed\n\nYou can also add comments or attach additional files to an open ticket.',
      keywords: ['ticket', 'status', 'progress', 'check', 'tracking', 'update'],
    },
    {
      category: 'Tickets',
      question: 'What do I do if my ticket is not being resolved?',
      answer:
        'If your ticket isn\'t progressing:\n1. Add a comment to your ticket with:\n   - Additional details about the issue\n   - Any steps you\'ve already tried\n   - How the issue is affecting your work\n2. Set priority to "Urgent" if your work is blocked\n3. Reach out to IT directly:\n   - Email: it-support@company.com\n   - Phone: ext. 5555\n   - In-person: IT Office, Building A, Room 102\n\nProvide your ticket ID so they can locate your request immediately.',
      keywords: ['ticket', 'slow', 'not resolved', 'escalate', 'urgent', 'follow up'],
    },

    // NETWORK & VPN
    {
      category: 'Network',
      question: 'How do I set up VPN to work from home?',
      answer:
        'To set up VPN:\n1. Go to IT Portal → VPN Setup\n2. Download the VPN client appropriate for your OS\n3. Install the VPN client\n4. Restart your computer\n5. Open VPN client\n6. Enter your username: your_email@company.com\n7. Enter your password: your_company_password\n8. Click "Connect"\n9. You should see "Connected" in the VPN app\n\nOnce connected, you can access company resources as if you\'re in the office.\n\nTroubleshooting:\n- Restart VPN client\n- Restart your computer\n- Check firewall settings\n- Create a support ticket if issues persist',
      keywords: ['vpn', 'remote', 'home', 'work from home', 'connection', 'access'],
    },
    {
      category: 'Network',
      question: 'My internet connection keeps dropping. What should I do?',
      answer:
        'If your internet connection is unstable:\n1. Restart your modem and router (turn off 30 seconds, turn on)\n2. Restart your computer\n3. Check WiFi signal strength (move closer to router)\n4. Switch to wired connection (Ethernet cable) if available\n5. Check for interference from other devices\n6. Disable VPN and test connection\n7. Run speed test: speedtest.net\n8. Check network status: Settings → Status → Network & Internet\n9. Update network drivers: Device Manager → Network adapters → Right-click → Update driver\n\nIf problem persists after these steps, create a support ticket with:\n- Your location\n- Device type (laptop/desktop)\n- Connection type (WiFi/Ethernet)\n- Speed test results',
      keywords: ['internet', 'connection', 'dropping', 'disconnect', 'unstable', 'network'],
    },

    // GENERAL
    {
      category: 'General',
      question: 'What is the IT Help Desk?',
      answer:
        'The IT Help Desk is your central support for:\n- Technical issues and troubleshooting\n- Software and hardware requests\n- Account access and password resets\n- Network and VPN setup\n- Security and compliance guidance\n- Device management\n\nAvailable support channels:\n- Web Portal: http://helpdesk.company.com\n- Email: it-support@company.com\n- Phone: ext. 5555\n- In-person: Building A, Room 102\n\nResponse times:\n- Urgent (work-blocking): 1 hour\n- High: 4 hours\n- Medium: 1 business day\n- Low: 3 business days',
      keywords: ['helpdesk', 'support', 'it', 'help', 'assistance', 'contact'],
    },
    {
      category: 'General',
      question: 'How do I contact IT support?',
      answer:
        'Contact IT Support:\n\nEmail: it-support@company.com\n- Best for: Non-urgent issues, detailed documentation\n- Response time: Within 4 business hours\n\nPhone: ext. 5555\n- Best for: Urgent issues, complex problems\n- Hours: 8 AM - 6 PM Mon-Fri\n\nIn-person:\n- Location: Building A, Room 102\n- Hours: 8 AM - 5 PM Mon-Fri\n\nWeb Portal: http://helpdesk.company.com\n- Best for: Tracking tickets, viewing documentation\n- Available 24/7\n\nFor urgent issues that block your work:\n1. Call ext. 5555 immediately\n2. Create a ticket and mark as "Urgent"\n3. Email it-support@company.com with "URGENT" in subject',
      keywords: ['contact', 'support', 'email', 'phone', 'help', 'reach'],
    },
  ];

  console.log('\n📚 Starting Chatbot Knowledge Base Seeding...\n');

  let created = 0;
  let failed = 0;

  for (const entry of faqEntries) {
    try {
      await chatbotService.addKnowledgeEntry(entry);
      created++;
      console.log(`✅ [${created}/${faqEntries.length}] Added: ${entry.question.substring(0, 60)}...`);
    } catch (error) {
      failed++;
      console.error(`❌ Failed to add: ${entry.question}`);
      console.error(`   Error: ${(error as Error).message}\n`);
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 SEEDING COMPLETE`);
  console.log(`${'='.repeat(70)}`);
  console.log(`✅ Successfully created: ${created}/${faqEntries.length}`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}/${faqEntries.length}`);
  }
  console.log(`${'='.repeat(70)}\n`);

  await app.close();
  process.exit(failed > 0 ? 1 : 0);
}

// Run the seeding process
seedChatbotKnowledgeBase().catch((error) => {
  console.error('🔥 FATAL ERROR during seeding:', error);
  process.exit(1);
});
