import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupportService } from '../services/support.service';
import { CreateTicketRequest } from '../models/support.model';

@Component({
  selector: 'app-support-create',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './support-create.html',
  styleUrl: './support-create.scss'
})
export class SupportCreate {
  form: CreateTicketRequest = {
    subject: '',
    category: 'CourseContent',
    priority: 'Medium',
    initialMessage: '',
    attachmentUrl: null
  };

  categories = [
    { id: 'CourseContent', label: 'Course & Curriculum', icon: '📚', desc: 'Questions about lectures, code snippets, resources' },
    { id: 'PaymentBilling', label: 'Billing & Payment', icon: '💳', desc: 'Receipts, payment failures, refunds' },
    { id: 'AccountAccess', label: 'Account & Login', icon: '🔐', desc: 'Password reset, profile settings, email issues' },
    { id: 'TechnicalIssue', label: 'Technical Glitch', icon: '🛠️', desc: 'Video player errors, site bugs, mobile issues' },
    { id: 'GeneralInquiry', label: 'General Inquiry', icon: '💡', desc: 'Certificates, partnerships, other feedback' }
  ];

  isSubmitting = false;
  errorMessage = '';

  constructor(
    private supportService: SupportService,
    private router: Router
  ) {}

  selectCategory(catId: string): void {
    this.form.category = catId;
  }

  onSubmit(): void {
    if (!this.form.subject.trim() || !this.form.initialMessage.trim()) {
      this.errorMessage = 'Please provide a subject and detailed description of your issue.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.supportService.createTicket(this.form).subscribe({
      next: (ticket) => {
        this.isSubmitting = false;
        this.router.navigate(['/support', ticket.id]);
      },
      error: (err) => {
        console.error('Failed to create ticket', err);
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Failed to submit support ticket. Please try again.';
      }
    });
  }
}
