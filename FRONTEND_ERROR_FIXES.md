# Frontend Error Fixes & Debugging Guide

## Issue 1: Service Worker Response Cloning Error ⚠️

**Error:**
```
service-worker.js:119 Uncaught (in promise) TypeError: 
Failed to execute 'clone' on 'Response': Response body is already used
```

**Root Cause:** Service worker is trying to clone a response that's already been consumed (read).

**Solution:**

### Option A: Fix Service Worker (Recommended)

```typescript
// service-worker.ts or ngsw-worker.js
self.addEventListener('fetch', (event: FetchEvent) => {
  if (event.request.method !== 'GET') {
    return; // Only cache GET requests
  }

  event.respondWith(
    caches.open('v1').then((cache) => {
      return cache.match(event.request).then((response) => {
        // ✅ CORRECT: Clone BEFORE consuming the response
        if (response) {
          // Clone for cache update
          const clonedForUpdate = response.clone();
          
          // Fetch fresh version in background
          fetch(event.request)
            .then((freshResponse) => {
              if (freshResponse && freshResponse.status === 200) {
                cache.put(event.request, freshResponse);
              }
            })
            .catch(() => {}); // Silently fail on network error

          return clonedForUpdate; // Return cloned version
        }

        // If not in cache, fetch from network
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Cache the response
          const responseToCache = response.clone();
          cache.put(event.request, responseToCache);
          return response;
        });
      });
    })
  );
});
```

### Option B: Disable Service Worker Caching for API Calls

```typescript
// service-worker.ts
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  
  // ✅ NEVER cache API calls
  if (request.url.includes('/api/') || request.url.includes('/chat/')) {
    // Always fetch from network
    event.respondWith(fetch(request));
    return;
  }

  // Cache only static assets (JS, CSS, images)
  event.respondWith(
    caches.open('v1').then((cache) => {
      return cache.match(request).then((response) => {
        const fetchPromise = fetch(request).then((response) => {
          // Only cache successful responses
          if (response && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        });

        return response || fetchPromise;
      });
    })
  );
});
```

### Option C: Angular PWA Configuration (Simplest)

Update `ngsw-config.json`:

```json
{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "lazy",
      "resources": {
        "files": [
          "/assets/**",
          "/*.(svg|cur|jpg|jpeg|png|apng|webp|gif|otf|ttf|woff|woff2)"
        ]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "api",
      "urls": [
        "/api/**",
        "/chat/**"
      ],
      "cacheConfig": {
        "strategy": "network-first",
        "maxSize": 100,
        "maxAge": "6h",
        "timeout": "10s"
      }
    }
  ]
}
```

**Restart dev server after changes:**
```bash
ng serve
```

---

## Issue 2: Wrong Endpoint - `/chat/conversations/start` → 404

**Error:**
```
POST https://ticketing-web-app.onrender.com/chat/conversations/start 404 (Not Found)
chatbot-window.component.ts:88 Failed to start conversation
```

**Fix:**

### chatbot-window.component.ts

```typescript
// ❌ WRONG
async startConversation() {
  try {
    const response = await this.http.post('/api/chat/conversations/start', {}).toPromise();
    return response;
  } catch (error) {
    console.error('Failed to start conversation:', error);
  }
}

// ✅ CORRECT
async startConversation() {
  try {
    const conversationPayload = {
      type: 'DIRECT', // 'DIRECT' or 'GROUP'
      name: 'Chatbot Support', // optional but recommended
      description: 'Chat with AI Assistant' // optional
    };

    const response = await this.http.post(
      '/api/chat/conversations',
      conversationPayload
    ).toPromise();

    // Store conversation ID for future messages
    const conversationId = response.conversation_id;
    localStorage.setItem('chatbot_conversation_id', conversationId);
    
    return response;
  } catch (error) {
    console.error('Failed to start conversation:', error);
    throw error;
  }
}

// Call on component init
ngOnInit() {
  this.startConversation().then(response => {
    console.log('✅ Conversation started:', response.conversation_id);
  });
}
```

### Better: Create ChatService Wrapper

```typescript
// chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiUrl = '/api/chat';
  private conversationId: string | null = null;

  constructor(private http: HttpClient) {
    this.conversationId = localStorage.getItem('chatbot_conversation_id');
  }

  // Start or get conversation
  async getOrStartConversation(): Promise<string> {
    if (this.conversationId) {
      return this.conversationId;
    }

    try {
      const response = await this.http.post(`${this.apiUrl}/conversations`, {
        type: 'DIRECT',
        name: 'Chatbot Support Chat',
        description: 'AI Assistant Chat'
      }).toPromise();

      this.conversationId = response.conversation_id;
      localStorage.setItem('chatbot_conversation_id', this.conversationId);
      return this.conversationId;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      throw error;
    }
  }

  // Send message to chatbot
  async sendMessage(message: string): Promise<any> {
    const conversationId = await this.getOrStartConversation();

    return this.http.post(`${this.apiUrl}/chatbot/message`, {
      conversation_id: conversationId,
      message: message
    }).toPromise();
  }

  // Get chatbot stats
  async getStats(): Promise<any> {
    try {
      return await this.http.get(`${this.apiUrl}/chatbot/stats`).toPromise();
    } catch (error) {
      console.error('Failed to get stats:', error);
      return {
        totalInteractions: 0,
        averageConfidence: 0,
        knowledgeBaseSize: 0,
        resolvedSolutions: 0
      };
    }
  }

  // Submit feedback
  async submitFeedback(interactionId: string, rating: number, helpful: boolean): Promise<any> {
    return this.http.post(`${this.apiUrl}/chatbot/feedback`, {
      interaction_id: interactionId,
      satisfaction_score: rating,
      is_helpful: helpful
    }).toPromise();
  }

  // Search FAQ
  async searchFAQ(query: string, limit: number = 5): Promise<any> {
    return this.http.post(`${this.apiUrl}/chatbot/kb/search`, {
      query: query,
      limit: limit
    }).toPromise();
  }

  // Get FAQ categories
  async getFAQCategories(): Promise<string[]> {
    try {
      const response = await this.http.get(`${this.apiUrl}/chatbot/kb/categories`).toPromise();
      return response.categories || [];
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  }

  // Get FAQ by category
  async getFAQByCategory(category: string): Promise<any[]> {
    try {
      const response = await this.http.get(
        `${this.apiUrl}/chatbot/kb/category/${encodeURIComponent(category)}`
      ).toPromise();
      return response.entries || [];
    } catch (error) {
      console.error('Failed to get FAQ by category:', error);
      return [];
    }
  }

  // Get popular FAQs
  async getPopularFAQs(limit: number = 5): Promise<any[]> {
    try {
      const response = await this.http.get(
        `${this.apiUrl}/chatbot/kb/popular?limit=${limit}`
      ).toPromise();
      return response.popular || [];
    } catch (error) {
      console.error('Failed to get popular FAQs:', error);
      return [];
    }
  }
}
```

### Use in Component

```typescript
// chatbot-window.component.ts
import { ChatService } from './services/chat.service';

@Component({
  selector: 'app-chatbot-window',
  templateUrl: './chatbot-window.component.html'
})
export class ChatbotWindowComponent implements OnInit {
  messages: any[] = [];
  isLoading = false;
  stats: any = {};

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.loadStats();
    this.initializeConversation();
  }

  private async initializeConversation() {
    try {
      const conversationId = await this.chatService.getOrStartConversation();
      console.log('✅ Conversation ready:', conversationId);
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
    }
  }

  async sendMessage(userMessage: string) {
    if (!userMessage.trim()) return;

    // Add user message to UI
    this.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    });

    this.isLoading = true;

    try {
      const response = await this.chatService.sendMessage(userMessage);
      
      // Add bot response
      this.messages.push({
        role: 'assistant',
        content: response.response,
        intent: response.intent,
        confidence: response.confidence,
        interactionId: response.interactionId,
        timestamp: new Date()
      });

      // Optionally store interaction ID for later feedback
    } catch (error) {
      this.messages.push({
        role: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      });
    } finally {
      this.isLoading = false;
    }
  }

  async loadStats() {
    this.stats = await this.chatService.getStats();
  }
}
```

---

## Issue 3: Socket.io - No Auth Token Found

**Error:**
```
chat-init.service.ts:41 [ChatInit] No auth token found, skipping Socket.io initialization
```

**Fix:**

### chat-init.service.ts

```typescript
// ❌ WRONG
private async initializeSocket() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    console.log('[ChatInit] No auth token found, skipping Socket.io initialization');
    return; // ← Problem: exits early
  }
}

// ✅ CORRECT
private async initializeSocket() {
  let token = localStorage.getItem('auth_token');
  
  // Wait for token if not available immediately
  if (!token) {
    console.log('[ChatInit] Auth token not found, waiting...');
    // Wait up to 5 seconds for token
    for (let i = 0; i < 50; i++) {
      await this.delay(100);
      token = localStorage.getItem('auth_token');
      if (token) break;
    }
  }

  if (!token) {
    console.warn('[ChatInit] Still no auth token, will retry later');
    // Retry after 2 seconds
    setTimeout(() => this.initializeSocket(), 2000);
    return;
  }

  console.log('[ChatInit] ✅ Initializing Socket.io with token');
  
  this.socket = io(this.socketUrl, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });

  this.setupSocketListeners();
}

private delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Better: Use Auth Guard + Resolver

```typescript
// auth.guard.ts
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private chatService: ChatService
  ) {}

  async canActivate(): Promise<boolean> {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      return false;
    }

    // Initialize chat/socket only after auth is confirmed
    this.chatService.getOrStartConversation();
    
    return true;
  }
}

// app-routing.module.ts
const routes: Routes = [
  {
    path: 'chat',
    component: ChatComponent,
    canActivate: [AuthGuard]
  }
];
```

---

## Issue 4: Angular Hydration Error NG0505

**Error:**
```
NG0505: Angular hydration was requested on the client, but there was no 
serialized information present in the server response
```

**Fix:**

### app.config.ts (Standalone API)

```typescript
import { ApplicationConfig, provideClientHydration } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    // ✅ Add this line
    provideClientHydration(),
    
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};
```

### app.module.ts (NgModule)

```typescript
import { BrowserModule } from '@angular/platform-browser';
import { withHttpClientCsrfConfiguration } from '@angular/common/http';

@NgModule({
  imports: [BrowserModule.withServerTransition({ appId: 'ithelp-app' })],
  // ... rest of config
})
export class AppModule { }
```

### main.server.ts

```typescript
// Ensure server-side rendering is enabled
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

export default () => bootstrapApplication(AppComponent, appConfig);
```

**Or disable SSR if not needed:**

```bash
# angular.json
# Set "serverTarget": null to disable SSR
# Or remove it entirely if not using SSR
```

---

## Complete Environment Setup

### .env file (Frontend)

```env
ANGULAR_APP_API_URL=https://ticketing-web-app.onrender.com
ANGULAR_APP_API_TIMEOUT=30000
ANGULAR_APP_SOCKET_URL=https://ticketing-web-app.onrender.com
ANGULAR_APP_ENVIRONMENT=production
```

### environment.ts

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  socketUrl: 'http://localhost:3000',
  socketPath: '/socket.io/'
};

export const environmentProd = {
  production: true,
  apiUrl: 'https://ticketing-web-app.onrender.com',
  socketUrl: 'https://ticketing-web-app.onrender.com',
  socketPath: '/socket.io/'
};
```

### HTTP Interceptor (Fixed)

```typescript
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const token = localStorage.getItem('auth_token');

    // Add token to request
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    console.log(`🔐 Interceptor: ${request.method} ${request.url}`);

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`❌ HTTP Error: ${error.status} ${error.statusText}`, error);

        if (error.status === 401) {
          // Token expired, redirect to login
          this.authService.logout();
          // window.location.href = '/login';
        }

        return throwError(() => error);
      })
    );
  }
}
```

---

## Testing Checklist

- [ ] Service worker cloning error fixed
- [ ] `/api/chat/conversations` endpoint working (not `/chat/conversations/start`)
- [ ] Conversation ID stored in localStorage
- [ ] Auth token being sent with each request
- [ ] Socket.io connecting after auth
- [ ] Chatbot stats loading without 500 error
- [ ] Send message working and receiving responses
- [ ] No console errors for NG0505 hydration
- [ ] Service worker only caching static assets
- [ ] API calls bypassing service worker cache

---

## Quick Debugging

Add to your main component:

```typescript
export class AppComponent implements OnInit {
  ngOnInit() {
    // Debug: Check auth status
    console.log('🔑 Auth Token:', !!localStorage.getItem('auth_token'));
    
    // Debug: Check service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log('🔧 Service Workers:', registrations.length);
        registrations.forEach(sw => {
          console.log('  - State:', sw.active?.state);
        });
      });
    }

    // Debug: Check conversation
    console.log('💬 Conversation ID:', localStorage.getItem('chatbot_conversation_id'));
  }
}
```

**All errors should be gone after applying these fixes!** ✅
