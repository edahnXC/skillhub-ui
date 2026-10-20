import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CourseService } from '../services/course.service';
import { AuthService } from '../../auth/services/auth.service';
import { Course } from '../course.model';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './course-list.html',
  styleUrl: './course-list.scss',
})
export class CourseList implements OnInit, OnDestroy {
  courses: Course[] = [];
  isLoading = false;
  error: string | null = null;
  isLoggedIn = false;
  canCreateCourse = false;
  isAdmin = false;

  searchQuery = '';
  selectedCategory = 'All';

  categories = ['All', 'Web Development', 'Data Science', 'Design', 'Mobile Dev', 'AI & ML'];

  private authSubscription!: Subscription;
  private rolesSubscription!: Subscription;

  /** Fallback gradients for cards without a thumbnail */
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

  constructor(private courseService: CourseService, private authService: AuthService) {}

  ngOnInit(): void {
    this.authSubscription = this.authService.isLoggedIn$.subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
    });

    this.rolesSubscription = this.authService.currentRoles$.subscribe(roles => {
      if (Array.isArray(roles)) {
        this.canCreateCourse = roles.includes('Instructor');
        this.isAdmin = roles.includes('SuperAdmin') || roles.includes('SubAdmin');
      } else {
        this.canCreateCourse = false;
        this.isAdmin = false;
      }
    });

    this.loadCourses();
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.rolesSubscription) {
      this.rolesSubscription.unsubscribe();
    }
  }


  loadCourses(): void {
    this.isLoading = true;
    this.error = null;

    this.courseService.getAllCourses().subscribe({
      next: (data) => {
        this.courses = data;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Could not load courses. Please make sure the API server is running.';
        this.isLoading = false;
      }
    });
  }

  get filteredCourses(): Course[] {
    return this.courses.filter(course => {
      // Platform Quality Guard: Regular students and visitors must ONLY see approved & published courses.
      if (!this.isAdmin && !course.isPublished) {
        return false;
      }

      const matchesSearch = !this.searchQuery || 
        course.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        course.instructorName?.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesCategory = this.selectedCategory === 'All' || 
        (course.categoryName && course.categoryName.toLowerCase() === this.selectedCategory.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }

  getGradient(id: number): string {
    return this.gradients[id % this.gradients.length];
  }

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  getDiscountPercentage(price: number, discountPrice: number | null | undefined): number {
    if (!discountPrice || price <= 0 || discountPrice >= price) return 0;
    return Math.round(((price - discountPrice) / price) * 100);
  }
}
//to check why we are not able to see the filters