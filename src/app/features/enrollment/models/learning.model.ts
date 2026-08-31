import { LessonResource } from '../../courses/models/curriculum.model';

export interface CertificateInfo {
  certificateNumber: string;
  issuedAt: string;
  studentName: string;
  courseTitle: string;
}

export interface LearningLesson {
  id: number;
  sectionId: number;
  title: string;
  videoUrl?: string | null;
  durationMinutes: number;
  isCompleted: boolean;
  completedAt?: string | null;
  resources: LessonResource[];
}

export interface LearningSection {
  id: number;
  title: string;
  displayOrder: number;
  lessons: LearningLesson[];
}

export interface CourseLearning {
  courseId: number;
  courseTitle: string;
  thumbnailUrl?: string | null;
  instructorName: string;
  progressPercentage: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  sections: LearningSection[];
  certificate?: CertificateInfo | null;
}

export interface ToggleLessonCompletionRequest {
  courseId: number;
  lessonId: number;
  isCompleted: boolean;
}

export interface LessonCompletionResult {
  lessonId: number;
  isCompleted: boolean;
  updatedProgressPercentage: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  isCourseCompleted: boolean;
  certificate?: CertificateInfo | null;
}
