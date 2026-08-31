import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PaymentService } from '../services/payment.service';

@Component({
  selector: 'app-enrollment-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './enrollment-success.html',
  styleUrl: './enrollment-success.scss'
})
export class EnrollmentSuccess implements OnInit {
  isVerifying = true;
  isSuccess = false;
  message = 'Verifying your payment with Stripe...';
  courseId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (!sessionId) {
      this.isVerifying = false;
      this.isSuccess = false;
      this.message = 'No payment session ID found.';
      return;
    }

    this.paymentService.confirmPayment(sessionId).subscribe({
      next: (res) => {
        this.isVerifying = false;
        this.isSuccess = true;
        this.message = res.message || 'Payment confirmed! You are now enrolled.';
        if (res.courseId) {
          this.courseId = res.courseId;
        }
      },
      error: (err) => {
        this.isVerifying = false;
        this.isSuccess = false;
        this.message = err.error?.message || 'Could not verify payment with Stripe.';
        console.error(err);
      }
    });
  }
}
