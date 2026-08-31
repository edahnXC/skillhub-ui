import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CourseService } from '../services/course.service';
import { CurriculumService } from '../services/curriculum.service';
import { CourseCategory } from '../models/course-category.model';
import { CourseSection, CourseLesson, CreateSectionRequest, CreateLessonRequest, CreateLessonResourceRequest } from '../models/curriculum.model';

@Component({
  selector: 'app-course-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './course-edit.html',
  styleUrl: './course-edit.scss'
})
export class CourseEdit implements OnInit {
  activeTab: 'details' | 'curriculum' = 'details';
  courseForm: FormGroup;
  categories: CourseCategory[] = [];
  sections: CourseSection[] = [];
  
  isSubmitting = false;
  isLoading = true;
  isLoadingCurriculum = false;
  error = '';
  successMessage = '';
  courseId: number | null = null;
  
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isUploading = false;

  // New Section Form State
  newSectionTitle = '';
  isAddingSection = false;

  // New Lesson Form State
  activeAddingLessonSectionId: number | null = null;
  newLessonTitle = '';
  newLessonVideoUrl = '';
  newLessonDuration = 15;
  isAddingLesson = false;

  // New Resource Form State
  activeAddingResourceLessonId: number | null = null;
  newResourceFileName = '';
  newResourceFileUrl = '';
  isAddingResource = false;

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private curriculumService: CurriculumService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.courseForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      categoryId: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      discountPrice: [null, [Validators.min(0)]],
      description: ['', [Validators.required, Validators.maxLength(4000)]],
      isPublished: [false]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.courseId = parseInt(idParam, 10);
      this.loadCourse(this.courseId);
      this.loadCurriculum(this.courseId);
    } else {
      this.error = 'Invalid course ID';
      this.isLoading = false;
    }
  }

  setTab(tab: 'details' | 'curriculum'): void {
    this.activeTab = tab;
    this.error = '';
    this.successMessage = '';
  }

  loadCategories(): void {
    this.courseService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => {
        console.error('Failed to load categories', err);
      }
    });
  }

  loadCourse(id: number): void {
    this.courseService.getCourseById(id).subscribe({
      next: (course) => {
        this.courseService.getCategories().subscribe(categories => {
          const cat = categories.find(c => c.name === course.categoryName);
          
          this.courseForm.patchValue({
            title: course.title,
            categoryId: cat?.id || '',
            price: course.price,
            discountPrice: course.discountPrice,
            description: course.description,
            isPublished: course.isPublished
          });
          
          if (course.thumbnailUrl) {
            this.imagePreview = course.thumbnailUrl;
          }
          this.isLoading = false;
        });
      },
      error: (err) => {
        console.error('Failed to load course details', err);
        this.error = 'Failed to load course details.';
        this.isLoading = false;
      }
    });
  }

  loadCurriculum(courseId: number): void {
    this.isLoadingCurriculum = true;
    this.curriculumService.getCurriculum(courseId).subscribe({
      next: (data) => {
        this.sections = data;
        this.isLoadingCurriculum = false;
      },
      error: (err) => {
        console.error('Failed to load curriculum', err);
        this.isLoadingCurriculum = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.courseForm.invalid || !this.courseId) return;

    this.isSubmitting = true;
    this.error = '';
    this.successMessage = '';

    if (this.selectedFile) {
      this.isUploading = true;
      this.courseService.uploadImage(this.selectedFile).subscribe({
        next: (response) => {
          this.isUploading = false;
          this.submitCourse(response.url);
        },
        error: (err) => {
          this.isUploading = false;
          this.isSubmitting = false;
          this.error = 'Failed to upload image. Please try again.';
          console.error(err);
        }
      });
    } else {
      this.submitCourse(this.imagePreview || '');
    }
  }

  private submitCourse(thumbnailUrl: string): void {
    if (!this.courseId) return;
    
    const formValues = this.courseForm.value;
    const request = {
      id: this.courseId,
      ...formValues,
      categoryId: parseInt(formValues.categoryId, 10),
      thumbnailUrl: thumbnailUrl
    };

    this.courseService.updateCourse(request).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Course basic information updated successfully!';
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = 'Failed to update course. Please try again.';
        console.error(err);
      }
    });
  }

  /* ── Curriculum Management Actions ───────────────── */

  addSection(): void {
    if (!this.newSectionTitle.trim() || !this.courseId || this.isAddingSection) return;

    this.isAddingSection = true;
    const req: CreateSectionRequest = {
      courseId: this.courseId,
      title: this.newSectionTitle.trim(),
      displayOrder: this.sections.length + 1
    };

    this.curriculumService.createSection(req).subscribe({
      next: (newSec) => {
        this.sections.push({ ...newSec, lessons: [] });
        this.newSectionTitle = '';
        this.isAddingSection = false;
      },
      error: (err) => {
        console.error('Failed to create section', err);
        alert(err.error?.message || 'Failed to create section.');
        this.isAddingSection = false;
      }
    });
  }

  deleteSection(sectionId: number): void {
    if (!confirm('Are you sure you want to delete this section and all of its lectures?')) return;

    this.curriculumService.deleteSection(sectionId).subscribe({
      next: () => {
        this.sections = this.sections.filter(s => s.id !== sectionId);
      },
      error: (err) => {
        console.error('Failed to delete section', err);
        alert('Failed to delete section.');
      }
    });
  }

  openAddLesson(sectionId: number): void {
    this.activeAddingLessonSectionId = sectionId;
    this.newLessonTitle = '';
    this.newLessonVideoUrl = '';
    this.newLessonDuration = 15;
  }

  cancelAddLesson(): void {
    this.activeAddingLessonSectionId = null;
  }

  addLesson(sectionId: number): void {
    if (!this.newLessonTitle.trim() || this.isAddingLesson) return;

    this.isAddingLesson = true;
    const req: CreateLessonRequest = {
      sectionId: sectionId,
      title: this.newLessonTitle.trim(),
      videoUrl: this.newLessonVideoUrl.trim() || null,
      durationMinutes: this.newLessonDuration || 15
    };

    this.curriculumService.createLesson(req).subscribe({
      next: (newLesson) => {
        const section = this.sections.find(s => s.id === sectionId);
        if (section) {
          if (!section.lessons) section.lessons = [];
          section.lessons.push({ ...newLesson, resources: [] });
        }
        this.activeAddingLessonSectionId = null;
        this.isAddingLesson = false;
      },
      error: (err) => {
        console.error('Failed to create lesson', err);
        alert(err.error?.message || 'Failed to create lesson.');
        this.isAddingLesson = false;
      }
    });
  }

  deleteLesson(sectionId: number, lessonId: number): void {
    if (!confirm('Are you sure you want to delete this lecture?')) return;

    this.curriculumService.deleteLesson(lessonId).subscribe({
      next: () => {
        const section = this.sections.find(s => s.id === sectionId);
        if (section && section.lessons) {
          section.lessons = section.lessons.filter(l => l.id !== lessonId);
        }
      },
      error: (err) => {
        console.error('Failed to delete lesson', err);
        alert('Failed to delete lesson.');
      }
    });
  }

  openAddResource(lessonId: number): void {
    this.activeAddingResourceLessonId = lessonId;
    this.newResourceFileName = '';
    this.newResourceFileUrl = '';
  }

  cancelAddResource(): void {
    this.activeAddingResourceLessonId = null;
  }

  addResource(sectionId: number, lessonId: number): void {
    if (!this.newResourceFileName.trim() || !this.newResourceFileUrl.trim() || this.isAddingResource) return;

    this.isAddingResource = true;
    const req: CreateLessonResourceRequest = {
      lessonId: lessonId,
      fileName: this.newResourceFileName.trim(),
      fileUrl: this.newResourceFileUrl.trim()
    };

    this.curriculumService.addResource(req).subscribe({
      next: (newRes) => {
        const section = this.sections.find(s => s.id === sectionId);
        const lesson = section?.lessons?.find(l => l.id === lessonId);
        if (lesson) {
          if (!lesson.resources) lesson.resources = [];
          lesson.resources.push(newRes);
        }
        this.activeAddingResourceLessonId = null;
        this.isAddingResource = false;
      },
      error: (err) => {
        console.error('Failed to attach resource', err);
        alert(err.error?.message || 'Failed to attach resource.');
        this.isAddingResource = false;
      }
    });
  }

  deleteResource(sectionId: number, lessonId: number, resourceId: number): void {
    if (!confirm('Are you sure you want to remove this resource file?')) return;

    this.curriculumService.deleteResource(resourceId).subscribe({
      next: () => {
        const section = this.sections.find(s => s.id === sectionId);
        const lesson = section?.lessons?.find(l => l.id === lessonId);
        if (lesson && lesson.resources) {
          lesson.resources = lesson.resources.filter(r => r.id !== resourceId);
        }
      },
      error: (err) => {
        console.error('Failed to delete resource', err);
        alert('Failed to delete resource.');
      }
    });
  }
}
