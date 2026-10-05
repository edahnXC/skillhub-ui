import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupportService } from '../services/support.service';
import { SupportTicket, TicketStatus } from '../models/support.model';

@Component({
  selector: 'app-support-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './support-list.html',
  styleUrl: './support-list.scss'
})
export class SupportList implements OnInit {
  tickets: SupportTicket[] = [];
  filteredTickets: SupportTicket[] = [];
  isLoading = true;
  error: string | null = null;
  activeFilter: 'ALL' | TicketStatus = 'ALL';
  searchQuery = '';

  constructor(private supportService: SupportService) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading = true;
    this.error = null;
    this.supportService.getMyTickets().subscribe({
      next: (data) => {
        this.tickets = data;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load tickets', err);
        this.error = 'Failed to load your support tickets. Please try again.';
        this.isLoading = false;
      }
    });
  }

  setFilter(filter: 'ALL' | TicketStatus): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    let list = this.tickets;

    if (this.activeFilter !== 'ALL') {
      list = list.filter(t => t.status === this.activeFilter);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(t =>
        t.ticketNumber.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }

    this.filteredTickets = list;
  }

  getCountByStatus(status: TicketStatus): number {
    return this.tickets.filter(t => t.status === status).length;
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
