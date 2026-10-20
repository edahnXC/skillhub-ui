import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CourseService } from '../services/course.service';
import { CurriculumService } from '../services/curriculum.service';
import { QuizService } from '../../enrollment/services/quiz.service';
import { Quiz } from '../../enrollment/models/quiz.model';
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
  activeTab: 'details' | 'curriculum' | 'quizzes' = 'details';
  courseForm: FormGroup;
  categories: CourseCategory[] = [];
  sections: CourseSection[] = [];
  
  isSubmitting = false;
  isLoading = true;
  isLoadingCurriculum = false;
  error = '';
  successMessage = '';
  courseId: number | null = null;
  newlyCreated = false;
  
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

  // Quiz / Assessment State
  quizzes: Quiz[] = [];
  isLoadingQuizzes = false;
  showCreateQuizModal = false;
  isSavingQuiz = false;
  quizError = '';

  newQuizTitle = '';
  newQuizDescription = '';
  newQuizPassingScore = 70;
  newQuizSectionId: number | null = null;
  newQuizQuestions: Array<{
    questionText: string;
    explanation: string;
    options: Array<{ optionText: string; isCorrect: boolean }>;
  }> = [];

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private curriculumService: CurriculumService,
    private quizService: QuizService,
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

    const queryTab = this.route.snapshot.queryParamMap.get('tab');
    if (queryTab === 'curriculum' || queryTab === 'quizzes') {
      this.activeTab = queryTab;
    }
    if (this.route.snapshot.queryParamMap.get('created') === 'true') {
      this.newlyCreated = true;
    }
    
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.courseId = parseInt(idParam, 10);
      this.loadCourse(this.courseId);
      this.loadCurriculum(this.courseId);
      this.loadQuizzes(this.courseId);
    } else {
      this.error = 'Invalid course ID';
      this.isLoading = false;
    }
  }

  setTab(tab: 'details' | 'curriculum' | 'quizzes'): void {
    this.activeTab = tab;
    this.error = '';
    this.successMessage = '';
  }

  /* ── Course Publishing Readiness Getters ────────── */
  get totalLessonsCount(): number {
    return this.sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0);
  }

  get totalLessonsWithVideo(): number {
    return this.sections.reduce((acc, s) => {
      const videoLessons = (s.lessons || []).filter(l => !!l.videoUrl && l.videoUrl.trim().length > 0);
      return acc + videoLessons.length;
    }, 0);
  }

  get hasSyllabus(): boolean {
    return this.sections.length > 0;
  }

  get hasVideoContent(): boolean {
    return this.totalLessonsWithVideo > 0;
  }

  get hasAssessments(): boolean {
    return this.quizzes.length > 0;
  }

  get canPublish(): boolean {
    return this.hasSyllabus && this.hasVideoContent && this.hasAssessments;
  }

  get isPublished(): boolean {
    return !!this.courseForm.get('isPublished')?.value;
  }

  togglePublish(publish: boolean): void {
    if (publish && !this.canPublish) {
      this.error = 'Cannot publish course yet. All readiness requirements (curriculum sections, video lectures, and mastery quizzes) must be satisfied first.';
      this.courseForm.patchValue({ isPublished: false });
      return;
    }
    this.courseForm.patchValue({ isPublished: publish });
    this.onSubmit();
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

    if (this.courseForm.get('isPublished')?.value && !this.canPublish) {
      this.error = 'Cannot publish course yet. You must add at least 1 section, 1 video lesson, and 1 quiz assessment before publishing.';
      this.courseForm.patchValue({ isPublished: false });
      return;
    }

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
        if (formValues.isPublished) {
          this.successMessage = '🎉 Course published live! It is now visible in the public catalog for student enrollment.';
        } else {
          this.successMessage = 'Course information saved successfully (Draft mode).';
        }
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

  // ── Quiz Builder Methods ─────────────────────────────────
  loadQuizzes(courseId: number): void {
    this.isLoadingQuizzes = true;
    this.quizService.getCourseQuizzes(courseId).subscribe({
      next: (data) => {
        this.quizzes = data;
        this.isLoadingQuizzes = false;
      },
      error: (err) => {
        console.error('Failed to load quizzes', err);
        this.isLoadingQuizzes = false;
      }
    });
  }

  openCreateQuizModal(): void {
    this.newQuizTitle = '';
    this.newQuizDescription = '';
    this.newQuizPassingScore = 70;
    this.newQuizSectionId = null;
    this.quizError = '';
    this.newQuizQuestions = [
      {
        questionText: '',
        explanation: '',
        options: [
          { optionText: '', isCorrect: true },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false }
        ]
      }
    ];
    this.showCreateQuizModal = true;
  }

  closeCreateQuizModal(): void {
    this.showCreateQuizModal = false;
    this.quizError = '';
  }

  addQuestionToQuiz(): void {
    this.newQuizQuestions.push({
      questionText: '',
      explanation: '',
      options: [
        { optionText: '', isCorrect: true },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false }
      ]
    });
  }

  removeQuestionFromQuiz(index: number): void {
    if (this.newQuizQuestions.length > 1) {
      this.newQuizQuestions.splice(index, 1);
    }
  }

  setCorrectOption(qIdx: number, oIdx: number): void {
    this.newQuizQuestions[qIdx].options.forEach((opt, idx) => {
      opt.isCorrect = (idx === oIdx);
    });
  }

  addOptionToQuestion(qIdx: number): void {
    if (this.newQuizQuestions[qIdx].options.length < 6) {
      this.newQuizQuestions[qIdx].options.push({
        optionText: '',
        isCorrect: false
      });
    }
  }

  removeOptionFromQuestion(qIdx: number, oIdx: number): void {
    if (this.newQuizQuestions[qIdx].options.length > 2) {
      const wasCorrect = this.newQuizQuestions[qIdx].options[oIdx].isCorrect;
      this.newQuizQuestions[qIdx].options.splice(oIdx, 1);
      if (wasCorrect) {
        this.newQuizQuestions[qIdx].options[0].isCorrect = true;
      }
    }
  }

  saveQuiz(): void {
    if (!this.courseId) return;
    if (!this.newQuizTitle.trim()) {
      this.quizError = 'Please provide a quiz title.';
      return;
    }

    for (let i = 0; i < this.newQuizQuestions.length; i++) {
      const q = this.newQuizQuestions[i];
      if (!q.questionText.trim()) {
        this.quizError = `Question ${i + 1} cannot be empty.`;
        return;
      }
      const hasCorrect = q.options.some(o => o.isCorrect && o.optionText.trim());
      if (!hasCorrect) {
        this.quizError = `Question ${i + 1} must have a marked correct option with text.`;
        return;
      }
      for (const opt of q.options) {
        if (!opt.optionText.trim()) {
          this.quizError = `All options in Question ${i + 1} must have text.`;
          return;
        }
      }
    }

    this.isSavingQuiz = true;
    this.quizError = '';

    const payload = {
      courseId: this.courseId,
      sectionId: this.newQuizSectionId || null,
      title: this.newQuizTitle.trim(),
      description: this.newQuizDescription.trim() || null,
      passingScorePercentage: this.newQuizPassingScore || 70,
      questions: this.newQuizQuestions.map((q, idx) => ({
        questionText: q.questionText.trim(),
        explanation: q.explanation.trim() || null,
        displayOrder: idx + 1,
        options: q.options.map(opt => ({
          optionText: opt.optionText.trim(),
          isCorrect: opt.isCorrect
        }))
      }))
    };

    this.quizService.createQuiz(payload).subscribe({
      next: () => {
        this.isSavingQuiz = false;
        this.closeCreateQuizModal();
        this.successMessage = 'Mastery Quiz created successfully!';
        if (this.courseId) {
          this.loadQuizzes(this.courseId);
        }
      },
      error: (err) => {
        console.error('Failed to create quiz', err);
        this.isSavingQuiz = false;
        this.quizError = err.error?.message || 'Failed to create quiz. Please verify all fields.';
      }
    });
  }
}
