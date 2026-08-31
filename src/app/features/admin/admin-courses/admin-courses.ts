import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService, AdminCourseDto } from '../services/admin.service';

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './admin-courses.html',
  styleUrl: './admin-courses.scss'
})
export class AdminCourses implements OnInit {
  courses: AdminCourseDto[] = [];
  isLoading = true;
  error = '';
  isApprovingId: number | null = null;
  toastMessage = '';
  showToast = false;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.isLoading = true;
    this.adminService.getAllCourses().subscribe({
      next: (data) => {
        this.courses = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load courses.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  deleteCourse(id: number): void {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      this.adminService.deleteCourse(id).subscribe({
        next: () => {
          this.courses = this.courses.filter(c => c.id !== id);
          this.triggerToast('Course deleted successfully.');
        },
        error: (err) => {
          console.error('Error deleting course:', err);
          alert('Failed to delete course.');
        }
      });
    }
  }

  approveCourse(id: number): void {
    this.isApprovingId = id;
    this.adminService.approveCourse(id).subscribe({
      next: () => {
        this.isApprovingId = null;
        const course = this.courses.find(c => c.id === id);
        if (course) {
          course.isPublished = true;
        }
        this.triggerToast(`Course #${id} approved & published!`);
      },
      error: (err) => {
        this.isApprovingId = null;
        console.error('Error approving course:', err);
        alert('Failed to approve course.');
      }
    });
  }

  triggerToast(msg: string): void {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3500);
  }
}
