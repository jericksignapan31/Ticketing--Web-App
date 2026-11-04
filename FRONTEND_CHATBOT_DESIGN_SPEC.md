# Chatbot Frontend Design Specifications

## Visual Design System

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  IT Help Desk Dashboard                   [Settings]│
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  CHATBOT WINDOW (Floating or Full Width)            │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ 🤖 IT Help Desk Assistant      [_] [□] [×]  │  │
│  ├──────────────────────────────────────────────┤  │
│  │                                              │  │
│  │  [Bot Message - Left aligned]                │  │
│  │  10:30 AM                                    │  │
│  │                                              │  │
│  │                  [User Message - Right]      │  │
│  │                              10:32 AM        │  │
│  │                                              │  │
│  │  [Bot Message with Options]                  │  │
│  │  • Create Ticket                             │  │
│  │  • Search FAQ                                │  │
│  │  10:33 AM                                    │  │
│  │                                              │  │
│  ├──────────────────────────────────────────────┤  │
│  │ [Loading: Bot is typing...]                  │  │
│  ├──────────────────────────────────────────────┤  │
│  │ [Input Field: Ask me anything...    ] [➤]   │  │
│  │                                              │  │
│  │ Quick: [Password] [Hardware] [Software]     │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Color Palette

```
Light Mode:
┌─────────────────────────────────────────────┐
│ Primary Blue       #2563EB ████             │ User messages, buttons, links
│ Dark Blue         #1E40AF ████              │ Hover states
│ Success Green     #10B981 ████              │ Positive actions, ✓
│ Warning Amber     #F59E0B ████              │ Escalations, ⚠
│ Error Red         #EF4444 ████              │ Errors, ✗
│ Light Gray        #F9FAFB ████              │ Bot messages, backgrounds
│ Mid Gray          #E5E7EB ████              │ Borders, dividers
│ Dark Gray         #374151 ████              │ Text
│ White             #FFFFFF ████              │ Backgrounds
└─────────────────────────────────────────────┘

Dark Mode:
┌─────────────────────────────────────────────┐
│ Primary Blue       #3B82F6 ████             │ User messages, buttons
│ Light Blue        #60A5FA ████              │ Hover states
│ Success Green     #34D399 ████              │ Positive actions
│ Warning Amber     #FBBF24 ████              │ Escalations
│ Error Red         #F87171 ████              │ Errors
│ Dark BG           #1F2937 ████              │ Main background
│ Card BG           #374151 ████              │ Bot messages
│ Border            #4B5563 ████              │ Borders
│ Light Text        #F3F4F6 ████              │ Text
│ Muted Text        #D1D5DB ████              │ Secondary text
└─────────────────────────────────────────────┘
```

### Typography Scale

```
Display (36px)     │ Welcome! 👋
Heading 1 (28px)   │ Chat with AI Assistant
Heading 2 (24px)   │ Quick Help
Heading 3 (20px)   │ FAQ Categories
Heading 4 (18px)   │ Popular Answers
Subheading (16px)  │ IT Help Desk Assistant
Body (14px)        │ Regular chat message text
Small (12px)       │ Timestamps, hints
Tiny (11px)        │ Helper text, metadata
Mono (13px)        │ Ticket ID: TKT-20261103-0001

Font Family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif
Line Height: 1.5 (body), 1.4 (heading)
Font Weight: Regular (400), Medium (500), Semi-Bold (600), Bold (700)
```

---

## Component Designs

### 1. Chat Bubble - Bot Message

```
┌─────────────────────────────────────┐
│                                     │
│ 🤖  To reset your password:        │
│                                     │
│     1. Go to login page             │
│     2. Click "Forgot Password"      │
│     3. Enter your email             │
│     4. Follow email instructions    │
│                                     │
│     💡 Tip: Check spam folder       │
│                                     │
│                    11:45 AM ⭐      │
│                                     │
└─────────────────────────────────────┘

Styling:
- Background: #F3F4F6 (light) / #374151 (dark)
- Border-radius: 12px (top-left: 0)
- Padding: 12px 16px
- Max-width: 70%
- Text color: #374151 (light) / #F3F4F6 (dark)
- Avatar: 32px circle, left margin
- Timestamp: 12px gray, below message
```

### 2. Chat Bubble - User Message

```
┌──────────────────────────────────┐
│                                  │
│  How do I reset my password?  ✓  │
│                         11:44 AM  │
│                                  │
└──────────────────────────────────┘

Styling:
- Background: #2563EB
- Border-radius: 12px (top-right: 0)
- Padding: 12px 16px
- Max-width: 70%
- Text color: #FFFFFF
- Alignment: Right
- Timestamp: 12px light gray, below
- Checkmark: ✓ in lighter shade
```

### 3. Bot Message with Action Buttons

```
┌─────────────────────────────────────────┐
│                                         │
│ 🤖  Issue still not resolved?           │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📄 Create Support Ticket  [→]      │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ 📚 Search Knowledge Base  [→]      │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ ☎️ Contact IT Support  [→]         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│                              11:46 AM   │
│                                         │
└─────────────────────────────────────────┘

Button Styling:
- Background: #F3F4F6 / #4B5563 (dark)
- Hover: #E5E7EB / #6B7280 (dark)
- Border: 1px solid #D1D5DB / #6B7280
- Padding: 10px 16px
- Border-radius: 8px
- Cursor: pointer
- Transition: 200ms ease
- Icon: 20px, left-aligned
```

### 4. Feedback Modal

```
┌───────────────────────────────────────┐
│                                       │
│ ⭐ Was this response helpful?        │
│                                       │
│   ☆ ☆ ☆ ☆ ☆                        │
│                                       │
│  [Not Helpful]  [Helpful]            │
│                                       │
│  Comments (optional):                │
│  ┌─────────────────────────────────┐ │
│  │ This was clear and concise      │ │
│  └─────────────────────────────────┘ │
│                                       │
│           [Send]  [Cancel]           │
│                                       │
└───────────────────────────────────────┘

Modal Styling:
- Background: White (#FFFFFF) / #1F2937 (dark)
- Border-radius: 12px
- Box-shadow: 0 10px 40px rgba(0,0,0,0.2)
- Padding: 24px
- Max-width: 400px
- Z-index: 1000
- Overlay: rgba(0,0,0,0.5)
```

### 5. Ticket Creation Form

```
┌─────────────────────────────────────────┐
│  Create Support Ticket                  │
│                                         │
│  Category *                             │
│  ┌─────────────────────────────────────┐│
│  │ Hardware                         [v]││
│  └─────────────────────────────────────┘│
│                                         │
│  Priority *                             │
│  ◯ Low    ◯ Medium    ◉ High    ◯ Urgent
│                                         │
│  Subject *                              │
│  ┌─────────────────────────────────────┐│
│  │ Monitor not working                 ││
│  └─────────────────────────────────────┘│
│                                         │
│  Description *                          │
│  ┌─────────────────────────────────────┐│
│  │ My monitor is showing no signal     ││
│  │ after Windows update. Already tried ││
│  │ restarting and checking cables.     ││
│  │                                     ││
│  │                                     ││
│  └─────────────────────────────────────┘│
│                                         │
│  Asset (optional)                       │
│  ┌─────────────────────────────────────┐│
│  │ Dell Monitor (Asset-12345)       [v]││
│  └─────────────────────────────────────┘│
│                                         │
│  ☑ Require supervisor approval          │
│                                         │
│         [Create Ticket]  [Cancel]       │
│                                         │
└─────────────────────────────────────────┘

Form Styling:
- Label: 14px, medium weight, dark gray
- Input: 14px, padding 10px, border 1px #D1D5DB
- Hover: border #2563EB
- Focus: border #2563EB, box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1)
- Textarea: 4 rows, resize: vertical
- Required: Red * asterisk
- Disabled: opacity 0.6, cursor not-allowed
```

### 6. FAQ/Knowledge Base Search

```
┌─────────────────────────────────────────────┐
│ Knowledge Base                         [×]  │
├─────────────────────────────────────────────┤
│                                             │
│ Search FAQ:  [_____________ printer _____] │
│                                             │
│ Categories:                                 │
│ [All]  [Hardware]  [Software]  [Network]   │
│ [Access]  [Other]                          │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ ┌──────────────────────────────────────┐  │
│ │ 🖨️  Why is my printer offline?       │  │
│ │ Hardware • Used 45 times ⭐⭐⭐⭐⭐  │  │
│ └──────────────────────────────────────┘  │
│                                             │
│ ┌──────────────────────────────────────┐  │
│ │ 📄 How to connect to network printer? │  │
│ │ Hardware • Used 32 times ⭐⭐⭐⭐   │  │
│ └──────────────────────────────────────┘  │
│                                             │
│ ┌──────────────────────────────────────┐  │
│ │ 🔧 How to add printer to Windows?    │  │
│ │ Hardware • Used 28 times ⭐⭐⭐⭐   │  │
│ └──────────────────────────────────────┘  │
│                                             │
│ [Load More Results...]                     │
│                                             │
└─────────────────────────────────────────────┘

Search Result Card:
- Background: #F9FAFB / #374151 (dark)
- Border: 1px solid #E5E7EB / #4B5563
- Padding: 12px 16px
- Border-radius: 8px
- Hover: Box-shadow 0 4px 12px rgba(0,0,0,0.1)
- Icon: 20px
- Category: Small tag, gray
- Rating: Stars, right-aligned
```

### 7. Quick Access Panel

```
┌──────────────────────────────────────┐
│ Quick Help                         ▼ │
├──────────────────────────────────────┤
│                                      │
│ Popular This Week:                   │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 🔐 Reset Password          [→] │ │
│ │ 234 people found this helpful    │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 🖥️  Laptop Won't Turn On   [→] │ │
│ │ 198 people found this helpful    │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 📧 Email Setup                    │ │
│ │ 167 people found this helpful    │ │
│ └──────────────────────────────────┘ │
│                                      │
│ [Browse All Answers →]               │
│                                      │
└──────────────────────────────────────┘

Styling:
- Collapsible section
- Header: 16px, semi-bold
- Cards: Similar to FAQ results
- Icon + title: 14px
- Metadata: 12px gray
```

### 8. Loading States

```
Typing Indicator:
┌──────────────────────────┐
│ 🤖  ●  ●  ●             │
│ (animated circles)       │
│ Bot is typing...        │
└──────────────────────────┘

Message Loading:
┌──────────────────────────┐
│                          │
│  ░░░░░░░░░░░░░░░░░░░░  │ (skeleton)
│  ░░░░░░░░░░░░░          │
│                          │
└──────────────────────────┘

Button Loading:
[⟳ Sending...]  or  [● ● ●]

Styling:
- Opacity: 0.7
- Animation: pulse or spin at 1.5s
- Color: Gray (#9CA3AF)
```

### 9. Error States

```
┌──────────────────────────────────────┐
│ ⚠️  Oops! Something went wrong        │
│                                      │
│ Failed to send message. Please try   │
│ again or contact IT support.         │
│                                      │
│                 [Retry]  [Close]     │
└──────────────────────────────────────┘

Toast Notification (Top-right):
┌─────────────────────────┐
│ ✓ Feedback received     │
│ Thanks for helping us!  │
└─────────────────────────┘

Auto-dismiss: 3 seconds
Background: #10B981 (success), #EF4444 (error)
Text: White
Icon: Checkmark or X
```

### 10. Empty States

```
No Messages Yet:
┌──────────────────────────────────────┐
│                                      │
│            👋 Hello there!           │
│                                      │
│     How can I help you today?       │
│                                      │
│  [Quick Links Below]                 │
│                                      │
└──────────────────────────────────────┘

No Search Results:
┌──────────────────────────────────────┐
│                                      │
│        🔍 No results found           │
│                                      │
│   Try searching for different terms  │
│   or browse by category              │
│                                      │
│  [Browse Categories]  [New Search]   │
│                                      │
└──────────────────────────────────────┘
```

---

## Responsive Breakpoints

```
Mobile (< 640px):
- Chat width: Full width - 16px padding
- Input: Stack vertically
- Modal: Full screen
- Font size: -1px on mobile

Tablet (640px - 1024px):
- Chat width: 500px
- Float: Right side with 16px margin
- Modal: Centered, 80% width
- Sidebar: Collapsible

Desktop (> 1024px):
- Chat width: 450-500px
- Float: Bottom right, 24px margin
- Modal: Centered, 500px width
- Full layout with sidebars
```

---

## Animation & Transitions

```
Smooth Scroll:
scroll-behavior: smooth
Duration: 300ms

Message Fade-in:
opacity: 0 → 1
Duration: 300ms
Easing: ease-out

Button Hover:
transform: translateY(-2px)
box-shadow: expand
Duration: 200ms
Easing: ease-out

Modal Slide-in:
transform: translateY(100%) → translateY(0)
opacity: 0 → 1
Duration: 300ms
Easing: cubic-bezier(0.34, 1.56, 0.64, 1)

Loading Pulse:
opacity: 0.5 → 1 → 0.5
Duration: 1.5s
Infinite

Typing Dots:
●: scale 0.8 → 1 → 0.8
Duration: 1s
Infinite, staggered 100ms
```

---

## Accessibility Guidelines

### Keyboard Navigation

```
Tab: Next interactive element
Shift+Tab: Previous interactive element
Enter: Activate button, submit form
Escape: Close modal, collapse dropdown
Arrow Keys: Navigate dropdown options
Space: Toggle checkbox/radio
```

### ARIA Labels

```html
<!-- Chat input -->
<input aria-label="Chat message input" 
       aria-describedby="input-help">

<!-- Send button -->
<button aria-label="Send message">
  <span aria-hidden="true">➤</span>
</button>

<!-- Loading indicator -->
<div aria-live="polite" aria-busy="true">
  Bot is typing...
</div>

<!-- Modal -->
<div role="dialog" aria-labelledby="modal-title">
  <h2 id="modal-title">Feedback</h2>
</div>

<!-- Rating -->
<fieldset aria-label="Rating">
  <legend>Rate this response</legend>
  <input type="radio" name="rating" value="1" aria-label="1 star">
</fieldset>
```

### Color Contrast

```
Text on Background:
- Normal text: >= 4.5:1 contrast ratio
- Large text (18px+): >= 3:1 contrast ratio
- Interactive elements: >= 4.5:1 contrast ratio

Examples:
✓ Dark gray on white: 6.5:1
✓ Blue on white: 4.5:1
✗ Light gray on white: 2.1:1
```

### Focus Indicators

```css
/* All interactive elements must show focus */
button:focus,
a:focus,
input:focus,
textarea:focus {
  outline: 2px solid #2563EB;
  outline-offset: 2px;
}

/* Visible and high contrast */
/* Should not be removed or hidden */
```

---

## Dark Mode Toggle

```html
<button aria-label="Toggle dark mode" 
        id="theme-toggle">
  <span class="light-mode">🌞</span>
  <span class="dark-mode">🌙</span>
</button>

<script>
const toggle = document.getElementById('theme-toggle');
const html = document.documentElement;

// Check system preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Load saved preference or use system
const isDark = localStorage.getItem('theme') === 'dark' || 
               (!localStorage.getItem('theme') && prefersDark);

if (isDark) html.classList.add('dark');

toggle.addEventListener('click', () => {
  html.classList.toggle('dark');
  localStorage.setItem('theme', 
    html.classList.contains('dark') ? 'dark' : 'light'
  );
});
</script>
```

---

## Browser Support

```
- Chrome: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Edge: Latest 2 versions
- Mobile Safari: Latest 2 versions
- Chrome Mobile: Latest 2 versions

Polyfills: For fetch, Promise, Array.includes
```

---

**Design System Complete!** 🎨

All component specifications, colors, typography, and interactions are defined above. Frontend developer can use this as complete design reference.
