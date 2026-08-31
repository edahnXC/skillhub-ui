import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LearningService } from '../services/learning.service';
import { QuizService } from '../services/quiz.service';
import { AuthService } from '../../auth/services/auth.service';
import { CourseLearning, LearningLesson, LearningSection } from '../models/learning.model';
import { Quiz, QuizAttemptResult, SubmitQuizAttemptRequest } from '../models/quiz.model';

@Component({
  selector: 'app-course-player',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './course-player.html',
  styleUrl: './course-player.scss'
})
export class CoursePlayer implements OnInit {
  courseId: number | null = null;
  learningData: CourseLearning | null = null;
  activeLesson: LearningLesson | null = null;
  activeSection: LearningSection | null = null;
  activeTab: 'overview' | 'resources' | 'quiz' = 'overview';
  safeVideoUrl: SafeResourceUrl | null = null;
  
  isLoading = true;
  isToggling = false;
  error = '';
  expandedSections: { [key: number]: boolean } = {};
  showCertificateModal = false;
  
  toastMessage = '';
  showToast = false;

  // Quiz / Assessment State (Stage 4)
  quizzes: Quiz[] = [];
  activeQuiz: Quiz | null = null;
  isLoadingQuizzes = false;
  selectedAnswers: { [questionId: number]: number } = {};
  isSubmittingQuiz = false;
  quizResult: QuizAttemptResult | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private learningService: LearningService,
    private quizService: QuizService,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('courseId');
    if (idParam) {
      this.courseId = parseInt(idParam, 10);
      this.loadCourseLearning(this.courseId);
      this.loadQuizzes(this.courseId);
    } else {
      this.error = 'Invalid course ID.';
      this.isLoading = false;
    }
  }

  loadCourseLearning(courseId: number): void {
    this.isLoading = true;
    this.error = '';

    this.learningService.getCourseLearning(courseId).subscribe({
      next: (data) => {
        this.learningData = data;
        this.isLoading = false;

        // Auto-expand all sections
        if (data.sections && data.sections.length > 0) {
          data.sections.forEach(s => {
            this.expandedSections[s.id] = true;
          });

          // Select first incomplete lesson, or the first lesson
          let targetSection: LearningSection | null = null;
          let targetLesson: LearningLesson | null = null;

          for (const sec of data.sections) {
            if (sec.lessons && sec.lessons.length > 0) {
              const incomplete = sec.lessons.find(l => !l.isCompleted);
              if (incomplete) {
                targetSection = sec;
                targetLesson = incomplete;
                break;
              }
            }
          }

          if (!targetLesson && data.sections[0].lessons.length > 0) {
            targetSection = data.sections[0];
            targetLesson = data.sections[0].lessons[0];
          }

          if (targetSection && targetLesson) {
            this.selectLesson(targetSection, targetLesson);
          }
        }
      },
      error: (err) => {
        console.error('Failed to load classroom', err);
        if (err.status === 401 || err.status === 403) {
          this.error = 'You must be enrolled in this course to access the classroom.';
        } else {
          this.error = 'Failed to load course classroom. Please try again later.';
        }
        this.isLoading = false;
      }
    });
  }

  loadQuizzes(courseId: number): void {
    this.isLoadingQuizzes = true;
    this.quizService.getCourseQuizzes(courseId).subscribe({
      next: (quizzes) => {
        this.quizzes = quizzes;
        this.isLoadingQuizzes = false;
        if (quizzes.length > 0) {
          this.activeQuiz = quizzes[0];
          if (this.activeQuiz.bestAttempt) {
            this.quizResult = this.activeQuiz.bestAttempt;
          }
        }
      },
      error: (err) => {
        console.error('Failed to load course quizzes', err);
        this.isLoadingQuizzes = false;
      }
    });
  }

  selectLesson(section: LearningSection, lesson: LearningLesson): void {
    this.activeSection = section;
    this.activeLesson = lesson;
    this.updateSafeVideoUrl(lesson.videoUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateSafeVideoUrl(url?: string | null): void {
    if (!url) {
      this.safeVideoUrl = null;
      return;
    }

    let finalUrl = url;
    if (url.includes('youtube.com/watch?v=')) {
      finalUrl = url.replace('youtube.com/watch?v=', 'youtube.com/embed/');
    } else if (url.includes('youtu.be/')) {
      finalUrl = url.replace('youtu.be/', 'youtube.com/embed/');
    }

    this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(finalUrl);
  }

  toggleSection(sectionId: number): void {
    this.expandedSections[sectionId] = !this.expandedSections[sectionId];
  }

  toggleCompletion(): void {
    if (!this.courseId || !this.activeLesson || this.isToggling) return;

    this.isToggling = true;
    const newStatus = !this.activeLesson.isCompleted;

    this.learningService.toggleLessonCompletion({
      courseId: this.courseId,
      lessonId: this.activeLesson.id,
      isCompleted: newStatus
    }).subscribe({
      next: (res) => {
        if (this.activeLesson) {
          this.activeLesson.isCompleted = res.isCompleted;
        }

        if (this.learningData) {
          this.learningData.progressPercentage = res.updatedProgressPercentage;
          this.learningData.completedLessonsCount = res.completedLessonsCount;
          this.learningData.totalLessonsCount = res.totalLessonsCount;
          if (res.certificate) {
            this.learningData.certificate = res.certificate;
          }
        }

        this.isToggling = false;

        if (newStatus) {
          this.triggerToast('🎉 Lecture marked as complete!');
          if (res.isCourseCompleted) {
            this.showCertificateModal = true;
          }
        }
      },
      error: (err) => {
        console.error('Failed to toggle completion', err);
        this.isToggling = false;
        alert('Failed to update progress.');
      }
    });
  }

  /* ── Quiz Methods (Stage 4) ───────────────────────── */

  selectQuiz(quiz: Quiz): void {
    this.activeQuiz = quiz;
    this.selectedAnswers = {};
    if (quiz.bestAttempt) {
      this.quizResult = quiz.bestAttempt;
    } else {
      this.quizResult = null;
    }
  }

  chooseOption(questionId: number, optionId: number): void {
    this.selectedAnswers[questionId] = optionId;
  }

  get answeredCount(): number {
    return Object.keys(this.selectedAnswers).length;
  }

  submitQuiz(): void {
    if (!this.activeQuiz || this.isSubmittingQuiz) return;

    const answersList = Object.keys(this.selectedAnswers).map(qId => ({
      questionId: parseInt(qId, 10),
      selectedOptionId: this.selectedAnswers[parseInt(qId, 10)]
    }));

    if (answersList.length < this.activeQuiz.questions.length) {
      if (!confirm(`You have answered ${answersList.length} of ${this.activeQuiz.questions.length} questions. Submit anyway?`)) {
        return;
      }
    }

    this.isSubmittingQuiz = true;
    const req: SubmitQuizAttemptRequest = {
      quizId: this.activeQuiz.id,
      answers: answersList
    };

    this.quizService.submitQuizAttempt(req).subscribe({
      next: (result) => {
        this.quizResult = result;
        this.isSubmittingQuiz = false;
        if (result.isPassed) {
          this.triggerToast(`🏆 Congratulations! You passed with ${result.scorePercentage}%!`);
        } else {
          this.triggerToast(`Keep practicing! You scored ${result.scorePercentage}%.`);
        }
      },
      error: (err) => {
        console.error('Failed to submit quiz attempt', err);
        this.isSubmittingQuiz = false;
        alert(err.error?.message || 'Failed to submit quiz.');
      }
    });
  }

  retakeQuiz(): void {
    this.quizResult = null;
    this.selectedAnswers = {};
  }

  /* ── Playlist & Certificate Controls ──────────────── */

  get allLessonsList(): { section: LearningSection; lesson: LearningLesson }[] {
    const list: { section: LearningSection; lesson: LearningLesson }[] = [];
    if (this.learningData && this.learningData.sections) {
      for (const s of this.learningData.sections) {
        if (s.lessons) {
          for (const l of s.lessons) {
            list.push({ section: s, lesson: l });
          }
        }
      }
    }
    return list;
  }

  get currentLessonIndex(): number {
    if (!this.activeLesson) return -1;
    return this.allLessonsList.findIndex(item => item.lesson.id === this.activeLesson?.id);
  }

  get hasNextLesson(): boolean {
    return this.currentLessonIndex >= 0 && this.currentLessonIndex < this.allLessonsList.length - 1;
  }

  get hasPrevLesson(): boolean {
    return this.currentLessonIndex > 0;
  }

  goToNextLesson(): void {
    if (!this.hasNextLesson) return;
    const nextItem = this.allLessonsList[this.currentLessonIndex + 1];
    this.selectLesson(nextItem.section, nextItem.lesson);
  }

  goToPrevLesson(): void {
    if (!this.hasPrevLesson) return;
    const prevItem = this.allLessonsList[this.currentLessonIndex - 1];
    this.selectLesson(prevItem.section, prevItem.lesson);
  }

  openCertificateModal(): void {
    this.showCertificateModal = true;
  }

  closeCertificateModal(): void {
    this.showCertificateModal = false;
  }

  printCertificate(): void {
    window.print();
  }

  triggerToast(msg: string): void {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3500);
  }
}
