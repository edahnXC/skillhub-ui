import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { CourseService, PlatformStats } from '../../courses/services/course.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit, OnDestroy {
  isLoggedIn = false;
  canCreateCourse = false;
  private authSubscription!: Subscription;
  private statsSubscription?: Subscription;

  stats: PlatformStats = {
    coursesCount: 7,
    instructorsCount: 1,
    studentsCount: 7,
    totalEnrollments: 17,
    averageRating: 5.0
  };
  isLoadingStats = true;

  constructor(
    private authService: AuthService,
    private courseService: CourseService
  ) {}

  ngOnInit(): void {
    this.authSubscription = this.authService.isLoggedIn$.subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
    });

    this.authService.currentRoles$.subscribe(roles => {
      if (Array.isArray(roles)) {
        this.canCreateCourse = roles.includes('Instructor');
      } else {
        this.canCreateCourse = false;
      }
    });

    this.loadPlatformStats();
  }

  loadPlatformStats(): void {
    this.statsSubscription = this.courseService.getPlatformStats().subscribe({
      next: (data) => {
        if (data) {
          this.stats = data;
        }
        this.isLoadingStats = false;
      },
      error: (err) => {
        console.error('Failed to load platform stats', err);
        this.isLoadingStats = false;
      }
    });
  }

  formatCount(count: number): string {
    if (!count && count !== 0) return '0';
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k+';
    }
    if (count >= 50) {
      return `${count}+`;
    }
    return `${count}`;
  }

  formatRating(rating: number): string {
    if (!rating && rating !== 0) return '5.0 ★';
    return `${Number(rating).toFixed(1)} ★`;
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.statsSubscription) {
      this.statsSubscription.unsubscribe();
    }
  }
}