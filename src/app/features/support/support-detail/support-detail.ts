import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupportService } from '../services/support.service';
import { SupportTicketDetail, TicketMessage } from '../models/support.model';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-support-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './support-detail.html',
  styleUrl: './support-detail.scss'
})
export class SupportDetail implements OnInit {
  ticketId!: number;
  ticket: SupportTicketDetail | null = null;
  isLoading = true;
  error: string | null = null;

  newMessage = '';
  isSending = false;
  isResolving = false;
  currentUserId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private supportService: SupportService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.ticketId = parseInt(idParam, 10);
      this.currentUserId = this.authService.getUserId();
      this.loadTicket();
    } else {
      this.error = 'Invalid ticket ID.';
      this.isLoading = false;
    }
  }

  loadTicket(): void {
    this.isLoading = true;
    this.supportService.getTicketDetail(this.ticketId).subscribe({
      next: (data) => {
        this.ticket = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load ticket detail', err);
        this.error = err.error?.message || 'Could not load support ticket thread.';
        this.isLoading = false;
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || this.isSending) return;

    this.isSending = true;
    this.supportService.addMessage(this.ticketId, {
      messageText: this.newMessage.trim(),
      isInternalNote: false
    }).subscribe({
      next: (msg: TicketMessage) => {
        this.newMessage = '';
        this.isSending = false;
        if (this.ticket) {
          this.ticket.messages.push(msg);
          if (this.ticket.status === 'WaitingOnUser') {
            this.ticket.status = 'InProgress';
          }
        }
      },
      error: (err) => {
        console.error('Failed to send message', err);
        this.isSending = false;
        alert('Failed to send message. Please try again.');
      }
    });
  }

  markResolved(): void {
    if (!this.ticket || this.isResolving) return;

    this.isResolving = true;
    this.supportService.addMessage(this.ticketId, {
      messageText: 'I am marking this inquiry as resolved. Thank you for your support!',
      isInternalNote: false
    }).subscribe({
      next: () => {
        this.isResolving = false;
        this.loadTicket();
      },
      error: () => {
        this.isResolving = false;
      }
    });
  }

  getPriorityClass(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'priority-urgent';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      default: return 'priority-low';
    }
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'open': return 'status-open';
      case 'inprogress': return 'status-inprogress';
      case 'waitingonuser': return 'status-waiting';
      case 'resolved': return 'status-resolved';
      case 'closed': return 'status-closed';
      default: return 'status-default';
    }
  }

  formatStatusLabel(status: string): string {
    switch (status) {
      case 'InProgress': return 'In Progress';
      case 'WaitingOnUser': return 'Waiting On You';
      default: return status;
    }
  }
}
