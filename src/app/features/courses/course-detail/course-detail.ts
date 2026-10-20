import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseService } from '../services/course.service';
import { CurriculumService } from '../services/curriculum.service';
import { ReviewService } from '../services/review.service';
import { AdminService } from '../../admin/services/admin.service';
import { AuthService } from '../../auth/services/auth.service';
import { EnrollmentService } from '../../enrollment/services/enrollment.service';
import { PaymentService } from '../../enrollment/services/payment.service';
import { Course } from '../course.model';
import { CourseSection } from '../models/curriculum.model';
import { CourseReviewSummary, CourseReview } from '../models/review.model';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './course-detail.html',
  styleUrl: './course-detail.scss'
})
export class CourseDetail implements OnInit {
  Math = Math;

  course: Course | null = null;
  sections: CourseSection[] = [];
  expandedSections: { [key: number]: boolean } = {};
  reviewSummary: CourseReviewSummary | null = null;

  isLoading = true;
  isLoadingCurriculum = false;
  isLoadingReviews = false;
  error: string | null = null;
  currentUserId: number | null = null;
  isLoggedIn: boolean = false;
  isStudent: boolean = false;
  isAdmin: boolean = false;
  isSubAdmin: boolean = false;
  isApprover: boolean = false;
  isEnrolled: boolean = false;
  isEnrolling: boolean = false;
  isApproving: boolean = false;

  // Review Form State
  showReviewModal = false;
  selectedRating = 5;
  hoveredRating = 0;
  reviewComment = '';
  isSubmittingReview = false;
  reviewTags: string[] = [
    'Clear Explanations',
    'Practical Real-World Code',
    'Great Architecture',
    'Well Structured',
    'Highly Recommended',
    'Beginner Friendly'
  ];

  toastMessage = '';
  showToast = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private curriculumService: CurriculumService,
    private reviewService: ReviewService,
    private adminService: AdminService,
    private authService: AuthService,
    private enrollmentService: EnrollmentService,
    private paymentService: PaymentService
  ) {
    this.currentUserId = this.authService.getUserId();
  }

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe((loggedIn: boolean) => {
      this.isLoggedIn = loggedIn;
    });

    this.authService.currentRoles$.subscribe((roles: string[]) => {
      if (Array.isArray(roles)) {
        this.isStudent = roles.includes('Student');
        this.isAdmin = roles.includes('SuperAdmin');
        this.isSubAdmin = roles.includes('SubAdmin');
        this.isApprover = this.isAdmin || this.isSubAdmin || 
          this.authService.hasPermission('Courses.Approve') || 
          this.authService.hasPermission('Courses.ForcePublish');
      } else {
        this.isStudent = false;
        this.isAdmin = false;
        this.isSubAdmin = false;
        this.isApprover = false;
      }
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const courseId = parseInt(idParam, 10);
      this.loadCourse(courseId);
      this.loadCurriculum(courseId);
      this.loadReviews(courseId);
    } else {
      this.error = 'Invalid course ID';
      this.isLoading = false;
    }
  }

  loadCourse(id: number): void {
    this.isLoading = true;
    this.error = null;
    this.courseService.getCourseById(id).subscribe({
      next: (data: Course) => {
        this.course = data;
        this.isLoading = false;
        this.checkUserEnrollment();
      },
      error: (err: any) => {
        console.error('Failed to load course details', err);
        this.error = 'Failed to load course details. It may not exist or has been removed.';
        this.isLoading = false;
      }
    });
  }

  loadCurriculum(courseId: number): void {
    this.isLoadingCurriculum = true;
    this.curriculumService.getCurriculum(courseId).subscribe({
      next: (data: CourseSection[]) => {
        this.sections = data;
        this.isLoadingCurriculum = false;
        if (this.sections.length > 0) {
          this.expandedSections[this.sections[0].id] = true;
        }
      },
      error: (err: any) => {
        console.error('Failed to load curriculum', err);
        this.isLoadingCurriculum = false;
      }
    });
  }

  loadReviews(courseId: number): void {
    this.isLoadingReviews = true;
    this.reviewService.getCourseReviews(courseId).subscribe({
      next: (summary: CourseReviewSummary) => {
        this.reviewSummary = summary;
        this.isLoadingReviews = false;
      },
      error: (err: any) => {
        console.error('Failed to load reviews', err);
        this.isLoadingReviews = false;
      }
    });
  }

  checkUserEnrollment(): void {
    if (this.isLoggedIn && this.course && this.isStudent) {
      this.enrollmentService.checkEnrollment(this.course.id).subscribe({
        next: (isEnrolled: boolean) => {
          this.isEnrolled = isEnrolled;
        },
        error: () => {
          this.isEnrolled = false;
        }
      });
    }
  }

  get isOwner(): boolean {
    return !!(this.course && this.currentUserId && this.course.instructorId === this.currentUserId);
  }

  get totalLessonsCount(): number {
    return this.sections.reduce((acc, sec) => acc + (sec.lessons ? sec.lessons.length : 0), 0);
  }

  get totalDurationMinutes(): number {
    let total = 0;
    for (const sec of this.sections) {
      if (sec.lessons) {
        for (const les of sec.lessons) {
          total += les.durationMinutes || 0;
        }
      }
    }
    return total;
  }

  get totalDurationFormatted(): string {
    const mins = this.totalDurationMinutes;
    if (mins < 60) return `${mins} mins`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
  }

  getRatingPercentage(rating: number): number {
    if (!this.reviewSummary || !this.reviewSummary.ratingPercentages) return 0;
    return this.reviewSummary.ratingPercentages[rating] || 0;
  }

  getRatingCount(rating: number): number {
    if (!this.reviewSummary || !this.reviewSummary.ratingCounts) return 0;
    return this.reviewSummary.ratingCounts[rating] || 0;
  }

  toggleSection(sectionId: number): void {
    this.expandedSections[sectionId] = !this.expandedSections[sectionId];
  }

  expandAllSections(): void {
    for (const sec of this.sections) {
      this.expandedSections[sec.id] = true;
    }
  }

  collapseAllSections(): void {
    this.expandedSections = {};
  }

  enroll(): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/courses/${this.course?.id}` } });
      return;
    }

    if (!this.isStudent) {
      alert('Only students can enroll in courses.');
      return;
    }

    if (!this.course) return;

    const priceToPay = (this.course.discountPrice !== null && this.course.discountPrice !== undefined && this.course.discountPrice > 0)
      ? this.course.discountPrice
      : this.course.price;

    this.isEnrolling = true;

    // Paid course: Initiate payment checkout
    if (priceToPay > 0) {
      const successUrl = `${window.location.origin}/enrollment/success?courseId=${this.course.id}`;
      const cancelUrl = `${window.location.origin}/courses/${this.course.id}`;

      this.paymentService.createCheckoutSession(this.course.id, successUrl, cancelUrl).subscribe({
        next: (res) => {
          this.isEnrolling = false;
          if (res && res.sessionUrl) {
            // If live Stripe checkout URL returned, navigate to Stripe hosted gateway
            if (res.sessionUrl.includes('checkout.stripe.com')) {
              window.location.href = res.sessionUrl;
            } else {
              // Simulated Gateway: Open realistic payment gateway UI
              this.router.navigate(['/payment/checkout'], {
                queryParams: {
                  courseId: this.course!.id,
                  sessionId: res.sessionId
                }
              });
            }
          } else {
            alert('Failed to initialize payment checkout.');
          }
        },
        error: (err: any) => {
          this.isEnrolling = false;
          console.error('Payment checkout session creation error:', err);
          alert(err.error?.message || 'Payment initiation failed. Please try again.');
        }
      });
      return;
    }

    // Free course: Direct enrollment
    this.enrollmentService.enroll(this.course.id).subscribe({
      next: () => {
        this.isEnrolling = false;
        this.isEnrolled = true;
        this.router.navigate(['/enrollment/success'], { 
          queryParams: { courseId: this.course!.id, free: 'true' } 
        });
      },
      error: (err: any) => {
        this.isEnrolling = false;
        alert(err.error?.message || 'Enrollment failed.');
      }
    });
  }

  // Admin Direct Approval
  approveCourseDirectly(): void {
    if (!this.course || this.isApproving) return;

    this.isApproving = true;
    this.adminService.approveCourse(this.course.id).subscribe({
      next: () => {
        this.isApproving = false;
        if (this.course) {
          this.course.isPublished = true;
        }
        this.triggerToast('🎉 Course approved successfully and is now publicly live!');
      },
      error: (err: any) => {
        this.isApproving = false;
        console.error('Failed to approve course', err);
        alert(err.error?.message || 'Failed to approve course.');
      }
    });
  }

  // Review Modal Handling
  openReviewModal(): void {
    this.selectedRating = 5;
    this.hoveredRating = 0;
    this.reviewComment = '';
    this.showReviewModal = true;
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.hoveredRating = 0;
  }

  setRating(rating: number): void {
    this.selectedRating = rating;
  }

  setHoverRating(rating: number): void {
    this.hoveredRating = rating;
  }

  clearHoverRating(): void {
    this.hoveredRating = 0;
  }

  getRatingLabel(): string {
    const r = this.hoveredRating || this.selectedRating;
    switch (r) {
      case 5: return '5 of 5 Stars • Exceptional, Masterpiece! 🏆';
      case 4: return '4 of 5 Stars • Very Good, Highly Recommended 👍';
      case 3: return '3 of 5 Stars • Good, Met Expectations 😊';
      case 2: return '2 of 5 Stars • Fair, Needs Improvement 😐';
      case 1: return '1 of 5 Stars • Poor, Did Not Meet Expectations ⚠️';
      default: return 'Select your rating';
    }
  }

  addReviewTag(tag: string): void {
    const current = this.reviewComment.trim();
    if (!current) {
      this.reviewComment = tag;
    } else if (!current.includes(tag)) {
      this.reviewComment = current + (current.endsWith('.') ? ' ' : '. ') + tag + '.';
    }
  }

  submitReview(): void {
    if (!this.course || this.isSubmittingReview) return;

    this.isSubmittingReview = true;
    this.reviewService.submitReview({
      courseId: this.course.id,
      rating: this.selectedRating,
      reviewText: this.reviewComment.trim()
    }).subscribe({
      next: () => {
        this.isSubmittingReview = false;
        this.showReviewModal = false;
        this.triggerToast('⭐ Your review has been published!');
        this.loadReviews(this.course!.id);
      },
      error: (err: any) => {
        this.isSubmittingReview = false;
        console.error('Failed to submit review', err);
        alert(err.error?.message || 'Failed to submit review.');
      }
    });
  }

  triggerToast(msg: string): void {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }

  getDiscountPercentage(price: number, discountPrice: number | null | undefined): number {
    if (!discountPrice || price <= 0 || discountPrice >= price) return 0;
    return Math.round(((price - discountPrice) / price) * 100);
  }
}
