import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  SupportTicket,
  SupportTicketDetail,
  CreateTicketRequest,
  AddTicketMessageRequest,
  TicketMessage
} from '../models/support.model';

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  private readonly baseUrl = `${environment.apiUrl}/support`;

  constructor(private http: HttpClient) {}

  createTicket(request: CreateTicketRequest): Observable<SupportTicketDetail> {
    return this.http.post<SupportTicketDetail>(`${this.baseUrl}/tickets`, request);
  }

  getMyTickets(): Observable<SupportTicket[]> {
    return this.http.get<SupportTicket[]>(`${this.baseUrl}/my-tickets`);
  }

  getTicketDetail(ticketId: number): Observable<SupportTicketDetail> {
    return this.http.get<SupportTicketDetail>(`${this.baseUrl}/tickets/${ticketId}`);
  }

  addMessage(ticketId: number, request: AddTicketMessageRequest): Observable<TicketMessage> {
    return this.http.post<TicketMessage>(`${this.baseUrl}/tickets/${ticketId}/messages`, request);
  }

  getAdminQueue(filters?: {
    status?: string;
    priority?: string;
    category?: string;
    assignedToId?: number | null;
    search?: string;
  }): Observable<SupportTicket[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.status && filters.status !== 'ALL') params = params.set('status', filters.status);
      if (filters.priority && filters.priority !== 'ALL') params = params.set('priority', filters.priority);
      if (filters.category && filters.category !== 'ALL') params = params.set('category', filters.category);
      if (filters.assignedToId != null) params = params.set('assignedToId', filters.assignedToId.toString());
      if (filters.search && filters.search.trim()) params = params.set('search', filters.search.trim());
    }

    return this.http.get<SupportTicket[]>(`${this.baseUrl}/admin/queue`, { params });
  }

  updateTicketStatus(ticketId: number, status: string): Observable<SupportTicket> {
    return this.http.put<SupportTicket>(`${this.baseUrl}/admin/tickets/${ticketId}/status`, { status });
  }

  assignTicket(ticketId: number, assignedAdminId: number | null): Observable<SupportTicket> {
    return this.http.put<SupportTicket>(`${this.baseUrl}/admin/tickets/${ticketId}/assign`, { assignedAdminId });
  }

  getAssignableAdmins(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/assignable-admins`);
  }
}
