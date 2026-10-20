import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CourseService } from '../../courses/services/course.service';
import { Course } from '../../courses/course.model';
import { PaymentService } from '../services/payment.service';

@Component({
  selector: 'app-payment-gateway',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './payment-gateway.html',
  styleUrls: ['./payment-gateway.scss']
})
export class PaymentGateway implements OnInit {
  courseId: number | null = null;
  sessionId: string = '';
  course: Course | null = null;
  isLoading = true;
  isProcessing = false;
  paymentMethod: 'card' | 'upi' | 'netbanking' = 'card';

  // Card form state
  cardNumber = '';
  cardExpiry = '';
  cardCvc = '';
  cardName = '';

  // UPI state
  upiId = '';

  // Selected Bank
  selectedBank = 'HDFC';

  // Processing state message
  processingMessage = 'Contacting payment processor...';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.courseId = params['courseId'] ? parseInt(params['courseId'], 10) : null;
      this.sessionId = params['sessionId'] || `sim_${Date.now()}`;

      if (this.courseId) {
        this.loadCourse(this.courseId);
      } else {
        this.isLoading = false;
      }
    });
  }

  loadCourse(id: number): void {
    this.isLoading = true;
    this.courseService.getCourseById(id).subscribe({
      next: (course) => {
        this.course = course;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading course for checkout', err);
        this.isLoading = false;
      }
    });
  }

  get amountToPay(): number {
    if (!this.course) return 0;
    return (this.course.discountPrice !== null && this.course.discountPrice !== undefined && this.course.discountPrice > 0)
      ? this.course.discountPrice
      : this.course.price;
  }

  fillTestCard(): void {
    this.cardNumber = '4242 4242 4242 4242';
    this.cardExpiry = '12/28';
    this.cardCvc = '888';
    this.cardName = 'Verified Student';
  }

  formatCardNumber(): void {
    const digits = this.cardNumber.replace(/\D/g, '').substring(0, 16);
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.substring(i, i + 4));
    }
    this.cardNumber = parts.join(' ');
  }

  formatExpiry(): void {
    let clean = this.cardExpiry.replace(/\D/g, '').substring(0, 4);
    if (clean.length >= 3) {
      this.cardExpiry = `${clean.substring(0, 2)}/${clean.substring(2)}`;
    } else {
      this.cardExpiry = clean;
    }
  }

  processPayment(): void {
    if (this.isProcessing) return;

    if (this.paymentMethod === 'card') {
      if (!this.cardNumber || this.cardNumber.replace(/\s/g, '').length < 16) {
        alert('Please enter a valid 16-digit card number (or click "Use Test Card").');
        return;
      }
      if (!this.cardExpiry || this.cardExpiry.length < 5) {
        alert('Please enter a valid expiry date (MM/YY).');
        return;
      }
      if (!this.cardCvc || this.cardCvc.length < 3) {
        alert('Please enter a valid 3-digit CVV/CVC.');
        return;
      }
    } else if (this.paymentMethod === 'upi') {
      if (!this.upiId || !this.upiId.includes('@')) {
        alert('Please enter a valid UPI ID (e.g., student@oksbi).');
        return;
      }
    }

    this.isProcessing = true;
    this.processingMessage = 'Contacting payment gateway & verifying authorization...';

    setTimeout(() => {
      this.processingMessage = 'Securing transaction & confirming enrollment...';
    }, 900);

    setTimeout(() => {
      // Navigate to confirmation success
      this.router.navigate(['/enrollment/success'], {
        queryParams: {
          courseId: this.courseId,
          session_id: this.sessionId
        }
      });
    }, 1800);
  }
}
