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

  showRequirementModal = false;

  openRequirementModal(): void {
    this.showRequirementModal = true;
  }

  closeRequirementModal(): void {
    this.showRequirementModal = false;
  }

  get isCertificateReady(): boolean {
    return !!(this.learningData && this.learningData.certificate);
  }

  get isQuizPassed(): boolean {
    return !!(this.quizResult && this.quizResult.isPassed && this.quizResult.scorePercentage >= 70);
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
          this.learningData.certificate = res.certificate || null;
          if (res.isCertificateEligible !== undefined) {
            this.learningData.isCertificateEligible = res.isCertificateEligible;
          }
          if (res.certificateRequirementMessage) {
            this.learningData.certificateRequirementMessage = res.certificateRequirementMessage;
          }
        }

        this.isToggling = false;

        if (newStatus) {
          if (res.certificate) {
            this.triggerToast('🎓 Outstanding! Course completed and official Certificate unlocked!');
            this.showCertificateModal = true;
          } else if (res.isCourseCompleted) {
            this.triggerToast('🎉 All lectures completed! Pass the assessment with ≥70% to unlock your certificate.');
          } else {
            this.triggerToast('🎉 Lecture marked as complete!');
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

        if (result.isCertificateAwarded && result.certificate) {
          if (this.learningData) {
            this.learningData.certificate = result.certificate;
            this.learningData.isCertificateEligible = true;
          }
          this.triggerToast(`🎓 Brilliant! You scored ${result.scorePercentage}% and unlocked your Official Certificate of Completion!`);
          this.showCertificateModal = true;
        } else if (result.isPassed && result.scorePercentage >= 70) {
          this.triggerToast(`🏆 Assessment passed with ${result.scorePercentage}%! Complete all lectures to claim your certificate.`);
        } else {
          this.triggerToast(`Assessment score: ${result.scorePercentage}%. 70% or higher is required to unlock your certificate.`);
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
    const certElem = document.getElementById('printable-certificate');
    if (!certElem) {
      window.print();
      return;
    }

    const studentName = this.learningData?.certificate?.studentName || 'Student';
    const certNumber = this.learningData?.certificate?.certificateNumber || 'CERT';
    const cleanDocTitle = `SkillHub-Certificate-${studentName.replace(/[^a-zA-Z0-9]/g, '_')}-${certNumber}`;
    const originalTitle = document.title;
    document.title = cleanDocTitle;

    // Create an isolated hidden iframe for printing ONLY the certificate
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.id = 'certificate-print-frame';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      window.print();
      document.title = originalTitle;
      return;
    }

    // Collect all stylesheets and style definitions from the main document
    let styles = '';
    document.querySelectorAll('link[rel="stylesheet"], style').forEach(el => {
      styles += el.outerHTML;
    });

    const certHtml = certElem.outerHTML;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>${cleanDocTitle}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Dancing+Script:wght@700&family=Great+Vibes&family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
          ${styles}
          <style>
            @page {
              size: landscape;
              margin: 0;
            }
            *, *::before, *::after {
              box-sizing: border-box;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 100vw !important;
              height: 100vh !important;
              background: #ffffff !important;
              overflow: hidden !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            #printable-certificate {
              position: relative !important;
              width: 100vw !important;
              height: 100vh !important;
              max-width: 100vw !important;
              max-height: 100vh !important;
              margin: 0 !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              border: 14px solid #0f172a !important;
              outline: 3px solid #d97706 !important;
              outline-offset: -8px !important;
              padding: 12px !important;
              background: radial-gradient(ellipse at center, #ffffff 0%, #fdfcf7 60%, #f7f1e5 100%) !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: center !important;
              box-sizing: border-box !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .cert-inner-border {
              height: 100% !important;
              box-sizing: border-box !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              padding: 24px 36px 20px !important;
            }
          </style>
        </head>
        <body>
          ${certHtml}
        </body>
      </html>
    `);
    doc.close();

    // Trigger printing once parsed
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Print failed', err);
        window.print();
      } finally {
        document.title = originalTitle;
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }
    }, 400);
  }

  triggerToast(msg: string): void {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3500);
  }
}
