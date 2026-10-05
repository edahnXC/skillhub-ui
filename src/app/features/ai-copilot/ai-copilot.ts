import { Component, OnInit, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AiCopilotService } from './services/ai-copilot.service';
import { ChatMessage, ChatResponse } from './models/ai-copilot.model';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-ai-copilot',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ai-copilot.html',
  styleUrl: './ai-copilot.scss'
})
export class AiCopilot implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  isOpen = false;
  isExpanded = false;
  inputMessage = '';
  isThinking = false;
  messages: ChatMessage[] = [];
  suggestions: string[] = [];
  remainingGuestQuota: number | null = null;
  isGuestLimitReached = false;
  isLoggedIn = false;
  private shouldScroll = false;

  constructor(
    private aiService: AiCopilotService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
    });

    // Initialize welcome message
    this.messages = [
      {
        id: 'welcome',
        role: 'model',
        text: 'Hello! 👋 I am your **SkillHub AI Learning Copilot** powered by Google Gemini. How can I help you master your courses today?',
        timestamp: new Date()
      }
    ];

    this.loadSuggestions();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  loadSuggestions(): void {
    this.aiService.getSuggestions(this.router.url).subscribe({
      next: (chips) => {
        this.suggestions = chips || [];
      },
      error: () => {
        this.suggestions = [
          'Recommend top courses',
          'Explain Dependency Injection in .NET',
          'How do certificates work?',
          'Help with my quiz'
        ];
      }
    });
  }

  toggleOpen(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.shouldScroll = true;
      this.loadSuggestions();
    }
  }

  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
    this.shouldScroll = true;
  }

  close(): void {
    this.isOpen = false;
  }

  clearChat(): void {
    this.messages = [
      {
        id: 'welcome-reset',
        role: 'model',
        text: 'Chat history cleared. What would you like to explore next?',
        timestamp: new Date()
      }
    ];
    this.loadSuggestions();
  }

  sendSuggestion(suggestion: string): void {
    this.inputMessage = suggestion;
    this.sendMessage();
  }

  sendMessage(): void {
    const text = this.inputMessage.trim();
    if (!text || this.isThinking) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      text: text,
      timestamp: new Date()
    };
    this.messages.push(userMsg);
    this.inputMessage = '';
    this.isThinking = true;
    this.shouldScroll = true;

    this.aiService.sendMessage(text, this.messages).subscribe({
      next: (res: ChatResponse) => {
        this.isThinking = false;
        this.remainingGuestQuota = res.remainingGuestQuota ?? null;
        this.isGuestLimitReached = res.isGuestLimitReached;

        if (res.suggestions && res.suggestions.length > 0) {
          this.suggestions = res.suggestions;
        }

        const modelMsg: ChatMessage = {
          id: 'ai_' + Date.now(),
          role: 'model',
          text: res.reply,
          timestamp: new Date()
        };
        this.messages.push(modelMsg);
        this.shouldScroll = true;
      },
      error: (err) => {
        console.error('AI chat failed', err);
        this.isThinking = false;
        this.messages.push({
          id: 'err_' + Date.now(),
          role: 'model',
          text: 'I ran into a temporary connection issue. Please try asking again in a moment!',
          timestamp: new Date()
        });
        this.shouldScroll = true;
      }
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch {
      // scroll fallback
    }
  }

  formatContent(text: string): string {
    if (!text) return '';

    // Quick markdown parser for bold, code blocks, bullet points, and links
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Fenced code blocks ```lang ... ```
    formatted = formatted.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
      const language = lang ? lang.toUpperCase() : 'CODE';
      const cleanCode = code.trim();
      const escaped = encodeURIComponent(cleanCode);
      return `<div class="code-block-wrapper"><div class="code-block-header"><span class="code-lang">${language}</span><button type="button" class="copy-code-btn" onclick="navigator.clipboard.writeText(decodeURIComponent('${escaped}')); this.innerText='Copied!'; setTimeout(()=>this.innerText='Copy', 2000);">Copy</button></div><pre><code>${cleanCode}</code></pre></div>`;
    });

    // Inline code `...`
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Bold **text**
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Links [text](url)
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="chat-link" target="_blank" rel="noopener">$1</a>');

    // Bullet points
    formatted = formatted.replace(/(?:^|\n)- ([^\n]+)/g, '<li class="chat-li">$1</li>');
    formatted = formatted.replace(/(<li class="chat-li">[\s\S]+?<\/li>)/g, '<ul class="chat-ul">$1</ul>');

    // Paragraph breaks
    formatted = formatted.replace(/\n\n+/g, '<br><br>');

    return formatted;
  }
}
