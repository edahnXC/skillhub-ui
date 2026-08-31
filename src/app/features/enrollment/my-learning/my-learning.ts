import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EnrollmentService } from '../services/enrollment.service';
import { Course } from '../../courses/course.model';

@Component({
  selector: 'app-my-learning',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-learning.html',
  styleUrl: './my-learning.scss'
})
export class MyLearning implements OnInit {
  enrolledCourses: Course[] = [];
  isLoading = true;
  error = '';

  constructor(private enrollmentService: EnrollmentService) {}

  ngOnInit(): void {
    this.loadEnrollments();
  }

  loadEnrollments(): void {
    this.isLoading = true;
    this.enrollmentService.getMyLearning().subscribe({
      next: (courses) => {
        this.enrolledCourses = courses;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load your courses. Please try again.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }
}
