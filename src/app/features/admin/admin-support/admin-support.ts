import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupportService } from '../../support/services/support.service';
import { SupportTicket, SupportTicketDetail, TicketMessage } from '../../support/models/support.model';
import { AdminService, AdminUserDto } from '../services/admin.service';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-admin-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-support.html',
  styleUrl: './admin-support.scss'
})
export class AdminSupport implements OnInit {
  tickets: SupportTicket[] = [];
  selectedTicket: SupportTicketDetail | null = null;
  staffUsers: AdminUserDto[] = [];
  
  isLoadingList = true;
  isLoadingDetail = false;
  isSending = false;
  isUpdatingStatus = false;
  isUpdatingAssignee = false;

  // Custom Dropdown states
  statusDropdownOpen = false;
  assignDropdownOpen = false;

  readonly statusOptions = [
    { id: 'Open', label: 'Open', icon: '🔵', desc: 'Newly submitted, awaiting triage', pillClass: 'status-open' },
    { id: 'InProgress', label: 'In Progress', icon: '⚡', desc: 'Under active investigation by staff', pillClass: 'status-inprogress' },
    { id: 'WaitingOnUser', label: 'Waiting On User', icon: '⏳', desc: 'Reply sent, awaiting student response', pillClass: 'status-waiting' },
    { id: 'Resolved', label: 'Resolved', icon: '✅', desc: 'Issue addressed and resolved', pillClass: 'status-resolved' },
    { id: 'Closed', label: 'Closed', icon: '🔒', desc: 'Inquiry archived and closed', pillClass: 'status-closed' }
  ];

  // Filters
  filterStatus = 'ALL';
  filterPriority = 'ALL';
  filterCategory = 'ALL';
  searchQuery = '';

  // Reply state
  replyText = '';
  isInternalNote = false;

  // Role-based permissions
  isSuperAdmin = false;
  isProductSupport = false;
  isSubAdmin = false;

  get canAssign(): boolean {
    return this.isProductSupport;
  }

  get canChangeStatus(): boolean {
    if (this.isSuperAdmin) return false;
    return this.isProductSupport || this.isSubAdmin;
  }

  get canReply(): boolean {
    if (this.isSuperAdmin) return false;
    return this.isProductSupport || this.isSubAdmin;
  }

  currentUserId: number | null = null;

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeDropdowns();
  }

  toggleStatusDropdown(event?: Event): void {
    if (event) event.stopPropagation();
    if (!this.canChangeStatus) return;
    this.statusDropdownOpen = !this.statusDropdownOpen;
    if (this.statusDropdownOpen) this.assignDropdownOpen = false;
  }

  toggleAssignDropdown(event?: Event): void {
    if (event) event.stopPropagation();
    if (!this.canAssign) return;
    this.assignDropdownOpen = !this.assignDropdownOpen;
    if (this.assignDropdownOpen) this.statusDropdownOpen = false;
  }

  closeDropdowns(): void {
    this.statusDropdownOpen = false;
    this.assignDropdownOpen = false;
  }

  selectStatus(newStatus: string): void {
    this.closeDropdowns();
    if (!this.canChangeStatus) return;
    if (this.selectedTicket && this.selectedTicket.status !== newStatus) {
      this.onStatusChange(newStatus);
    }
  }

  selectAssignee(adminId: number | null): void {
    this.closeDropdowns();
    if (!this.canAssign) return;
    if (this.selectedTicket && this.selectedTicket.assignedAdminId !== adminId) {
      this.onAssigneeChange(adminId ? adminId.toString() : '');
    }
  }

  getCurrentStatusMeta(status: string) {
    return this.statusOptions.find(o => o.id === status) || {
      id: status,
      label: status,
      icon: '📌',
      desc: '',
      pillClass: 'status-default'
    };
  }

  constructor(
    private supportService: SupportService,
    private adminService: AdminService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();
    this.authService.currentRoles$.subscribe(roles => {
      if (Array.isArray(roles)) {
        this.isSuperAdmin = roles.includes('SuperAdmin');
        this.isProductSupport = roles.includes('ProductSupport');
        this.isSubAdmin = roles.includes('SubAdmin');
      } else {
        this.isSuperAdmin = false;
        this.isProductSupport = false;
        this.isSubAdmin = false;
      }
    });
    this.loadTickets();
    this.loadStaffUsers();
  }

  loadTickets(): void {
    this.isLoadingList = true;
    this.supportService.getAdminQueue({
      status: this.filterStatus,
      priority: this.filterPriority,
      category: this.filterCategory,
      search: this.searchQuery
    }).subscribe({
      next: (data) => {
        this.tickets = data;
        this.isLoadingList = false;

        // Maintain selection or select first ticket
        if (this.selectedTicket) {
          const stillExists = this.tickets.find(t => t.id === this.selectedTicket!.id);
          if (stillExists) {
            this.selectTicket(stillExists.id);
          } else if (this.tickets.length > 0) {
            this.selectTicket(this.tickets[0].id);
          } else {
            this.selectedTicket = null;
          }
        } else if (this.tickets.length > 0) {
          this.selectTicket(this.tickets[0].id);
        }
      },
      error: (err) => {
        console.error('Failed to load tickets', err);
        this.isLoadingList = false;
      }
    });
  }

  loadStaffUsers(): void {
    this.supportService.getAssignableAdmins().subscribe({
      next: (admins) => {
        this.staffUsers = admins;
      },
      error: (err) => {
        console.error('Failed to load assignable admins', err);
      }
    });
  }

  selectTicket(ticketId: number): void {
    this.isLoadingDetail = true;
    this.supportService.getTicketDetail(ticketId).subscribe({
      next: (detail) => {
        this.selectedTicket = detail;
        this.isLoadingDetail = false;
      },
      error: (err) => {
        console.error('Failed to load ticket detail', err);
        this.isLoadingDetail = false;
      }
    });
  }

  onStatusChange(newStatus: string): void {
    if (!this.selectedTicket || this.isUpdatingStatus) return;

    this.isUpdatingStatus = true;
    this.supportService.updateTicketStatus(this.selectedTicket.id, newStatus).subscribe({
      next: (updated) => {
        this.selectedTicket!.status = updated.status;
        this.selectedTicket!.resolvedAt = updated.resolvedAt;
        const listItem = this.tickets.find(t => t.id === updated.id);
        if (listItem) {
          listItem.status = updated.status;
        }
        this.isUpdatingStatus = false;
      },
      error: (err) => {
        console.error('Failed to update status', err);
        this.isUpdatingStatus = false;
        alert('Failed to update ticket status.');
      }
    });
  }

  onAssigneeChange(adminIdStr: string): void {
    if (!this.selectedTicket || this.isUpdatingAssignee) return;

    const adminId = adminIdStr ? parseInt(adminIdStr, 10) : null;
    this.isUpdatingAssignee = true;

    this.supportService.assignTicket(this.selectedTicket.id, adminId).subscribe({
      next: (updated) => {
        this.selectedTicket!.assignedAdminId = updated.assignedAdminId;
        this.selectedTicket!.assignedAdminName = updated.assignedAdminName;
        const listItem = this.tickets.find(t => t.id === updated.id);
        if (listItem) {
          listItem.assignedAdminId = updated.assignedAdminId;
          listItem.assignedAdminName = updated.assignedAdminName;
        }
        this.isUpdatingAssignee = false;
      },
      error: (err) => {
        console.error('Failed to assign ticket', err);
        this.isUpdatingAssignee = false;
        alert('Failed to reassign ticket.');
      }
    });
  }

  sendStaffReply(): void {
    if (!this.selectedTicket || !this.replyText.trim() || this.isSending) return;

    this.isSending = true;
    this.supportService.addMessage(this.selectedTicket.id, {
      messageText: this.replyText.trim(),
      isInternalNote: this.isInternalNote
    }).subscribe({
      next: (msg: TicketMessage) => {
        this.selectedTicket!.messages.push(msg);
        if (!this.isInternalNote && (this.selectedTicket!.status === 'Open' || this.selectedTicket!.status === 'InProgress')) {
          this.selectedTicket!.status = 'WaitingOnUser';
        }
        const listItem = this.tickets.find(t => t.id === this.selectedTicket!.id);
        if (listItem) {
          listItem.status = this.selectedTicket!.status;
          listItem.messagesCount++;
        }
        this.replyText = '';
        this.isInternalNote = false;
        this.isSending = false;
      },
      error: (err) => {
        console.error('Failed to post reply', err);
        this.isSending = false;
        alert('Failed to submit reply. Please try again.');
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
      case 'WaitingOnUser': return 'Waiting On User';
      default: return status;
    }
  }
}
