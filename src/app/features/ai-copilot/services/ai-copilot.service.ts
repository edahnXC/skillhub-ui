import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ChatMessage, ChatRequest, ChatResponse } from '../models/ai-copilot.model';

@Injectable({
  providedIn: 'root'
})
export class AiCopilotService {
  private readonly apiUrl = `${environment.apiUrl}/aichat`;
  private readonly GUEST_KEY = 'skillhub_ai_guest_id';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  getGuestSessionId(): string {
    let id = localStorage.getItem(this.GUEST_KEY);
    if (!id) {
      id = 'guest_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
      localStorage.setItem(this.GUEST_KEY, id);
    }
    return id;
  }

  sendMessage(message: string, history: ChatMessage[]): Observable<ChatResponse> {
    const payload: ChatRequest = {
      message: message.trim(),
      contextUrl: this.router.url,
      history: history.slice(-6).map(h => ({
        role: h.role,
        text: h.text
      })),
      guestSessionId: this.getGuestSessionId()
    };

    return this.http.post<ChatResponse>(`${this.apiUrl}/message`, payload);
  }

  getSuggestions(route?: string): Observable<string[]> {
    const currentRoute = route || this.router.url;
    return this.http.get<string[]>(`${this.apiUrl}/suggestions`, {
      params: { route: currentRoute }
    });
  }
}
