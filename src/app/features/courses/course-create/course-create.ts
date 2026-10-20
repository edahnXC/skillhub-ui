import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CourseService } from '../services/course.service';
import { CourseCategory } from '../models/course-category.model';

@Component({
  selector: 'app-course-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './course-create.html',
  styleUrl: './course-create.scss',
})
export class CourseCreate implements OnInit {
  courseForm: FormGroup;
  isSubmitting = false;
  isUploading = false;
  categories: CourseCategory[] = [];

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private router: Router
  ) {
    this.courseForm = this.fb.group({
      title:         ['', [Validators.required, Validators.minLength(3)]],
      description:   ['', [Validators.required, Validators.minLength(10)]],
      price:         [0,  [Validators.required, Validators.min(0)]],
      discountPrice: [null],
      thumbnailUrl:  [''],
      categoryId:    ['', [Validators.required]],
    });
  }

  thumbnailPreviewUrl: string | null = null;

  ngOnInit(): void {
    this.courseService.getCategories().subscribe({
      next: (data) => this.categories = data,
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      setTimeout(() => this.isUploading = true);
      this.courseService.uploadImage(file).subscribe({
        next: (response) => {
          setTimeout(() => {
            this.courseForm.patchValue({ thumbnailUrl: response.url });
            this.thumbnailPreviewUrl = response.url;
            this.isUploading = false;
          });
        },
        error: (err) => {
          console.error('Image upload failed', err);
          alert('Failed to upload image.');
          setTimeout(() => this.isUploading = false);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.courseForm.invalid) return;

    this.isSubmitting = true;

    this.courseService.createCourse(this.courseForm.value).subscribe({
      next: (createdCourse: any) => {
        const id = createdCourse?.id;
        if (id) {
          this.router.navigate(['/courses', id, 'edit'], {
            queryParams: { tab: 'curriculum', created: 'true' }
          });
        } else {
          this.router.navigate(['/courses']);
        }
      },
      error: (err) => {
        console.error(err);
        alert('Failed to create course. Please try again.');
        this.isSubmitting = false;
      }
    });
  }
}
