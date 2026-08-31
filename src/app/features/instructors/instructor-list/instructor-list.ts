import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { InstructorService } from '../services/instructor.service';
import { Instructor } from '../instructor.model';

@Component({
  selector: 'app-instructor-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './instructor-list.html',
  styleUrl: './instructor-list.scss',
})
export class InstructorList implements OnInit {
  instructors: Instructor[] = [];
  isLoading = false;
  error: string | null = null;
  searchQuery = '';

  private searchSubject = new Subject<string>();

  /** Fallback gradient colors for instructor avatars */
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

  constructor(private instructorService: InstructorService) {}

  ngOnInit(): void {
    // Set up debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        this.isLoading = true;
        this.error = null;
        if (query.trim()) {
          return this.instructorService.searchInstructors(query);
        }
        return this.instructorService.getInstructors();
      })
    ).subscribe({
      next: (data) => {
        this.instructors = data;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Could not load instructors. Please make sure the API server is running.';
        this.isLoading = false;
      }
    });

    // Initial load
    this.loadInstructors();
  }

  loadInstructors(): void {
    this.isLoading = true;
    this.error = null;
    this.instructorService.getInstructors().subscribe({
      next: (data) => {
        this.instructors = data;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Could not load instructors. Please make sure the API server is running.';
        this.isLoading = false;
      }
    });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  getGradient(id: number): string {
    return this.gradients[id % this.gradients.length];
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
}
