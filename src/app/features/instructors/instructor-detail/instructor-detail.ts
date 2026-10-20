import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { InstructorService } from '../services/instructor.service';
import { CourseService } from '../../courses/services/course.service';
import { AuthService } from '../../auth/services/auth.service';
import { Instructor } from '../instructor.model';
import { Course } from '../../courses/course.model';

@Component({
  selector: 'app-instructor-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './instructor-detail.html',
  styleUrl: './instructor-detail.scss'
})
export class InstructorDetail implements OnInit {
  instructor: Instructor | null = null;
  courses: Course[] = [];
  isLoading = true;
  error: string | null = null;
  isAdmin = false;
  currentUserId: number | null = null;

  private readonly gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #fda085 0%, #f6d365 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  ];

  constructor(
    private route: ActivatedRoute,
    private instructorService: InstructorService,
    private courseService: CourseService,
    private authService: AuthService
  ) {
    this.isAdmin = this.authService.isAdmin();
    this.currentUserId = this.authService.getUserId();
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const instructorId = parseInt(idParam, 10);
      this.loadInstructorData(instructorId);
    } else {
      this.error = 'Invalid instructor ID.';
      this.isLoading = false;
    }
  }

  loadInstructorData(instructorId: number): void {
    this.isLoading = true;
    this.error = null;

    // Fetch instructor
    this.instructorService.getInstructorById(instructorId).subscribe({
      next: (instructor) => {
        this.instructor = instructor;
        
        // Fetch courses for this instructor
        this.courseService.getCoursesByInstructorId(instructorId).subscribe({
          next: (courses) => {
            // Quality Guard: Regular students/users must ONLY see approved/published courses.
            // Admins or the authoring instructor themselves can see unpublished drafts.
            const canViewDrafts = this.isAdmin || (this.currentUserId === instructorId);
            this.courses = canViewDrafts ? courses : courses.filter(c => c.isPublished);
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Failed to load courses', err);
            this.isLoading = false;
            // Not a hard error if courses fail, just show 0 courses
          }
        });
      },
      error: (err) => {
        console.error('Failed to load instructor', err);
        this.error = 'Instructor not found or could not be loaded.';
        this.isLoading = false;
      }
    });
  }

  getGradient(id: number): string {
    return this.gradients[id % this.gradients.length];
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  getDiscountPercentage(price: number, discountPrice: number | null | undefined): number {
    if (!discountPrice || price <= 0 || discountPrice >= price) return 0;
    return Math.round(((price - discountPrice) / price) * 100);
  }
}
