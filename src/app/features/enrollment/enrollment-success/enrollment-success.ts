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
  isFree = false;
  message = 'Verifying your course enrollment...';
  courseId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    const isFreeParam = this.route.snapshot.queryParamMap.get('free') === 'true';
    const courseIdParam = this.route.snapshot.queryParamMap.get('courseId');

    if (courseIdParam) {
      this.courseId = parseInt(courseIdParam, 10);
    }

    // Direct Free Course Enrollment
    if (isFreeParam) {
      this.isVerifying = false;
      this.isSuccess = true;
      this.isFree = true;
      this.message = 'Enrollment confirmed! You have full access to this course.';
      return;
    }

    // Paid Course Session ID verification
    if (!sessionId) {
      this.isVerifying = false;
      this.isSuccess = false;
      this.message = 'No payment session verification key found.';
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
        this.message = err.error?.message || 'Could not verify payment with payment gateway.';
        console.error(err);
      }
    });
  }
}
