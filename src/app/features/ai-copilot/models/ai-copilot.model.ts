export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatRequest {
  message: string;
  contextUrl?: string;
  history: { role: string; text: string }[];
  guestSessionId?: string;
}

export interface ChatResponse {
  reply: string;
  suggestions: string[];
  remainingGuestQuota?: number | null;
  isGuestLimitReached: boolean;
  modelUsed: string;
}
