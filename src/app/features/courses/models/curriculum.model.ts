export interface LessonResource {
  id: number;
  lessonId: number;
  fileName: string;
  fileUrl: string;
}

export interface CourseLesson {
  id: number;
  sectionId: number;
  title: string;
  videoUrl?: string | null;
  durationMinutes: number;
  resources: LessonResource[];
}

export interface CourseSection {
  id: number;
  courseId: number;
  title: string;
  displayOrder: number;
  lessons: CourseLesson[];
}

export interface CreateSectionRequest {
  courseId: number;
  title: string;
  displayOrder: number;
}

export interface UpdateSectionRequest {
  id: number;
  title: string;
  displayOrder: number;
}

export interface CreateLessonRequest {
  sectionId: number;
  title: string;
  videoUrl?: string | null;
  durationMinutes: number;
}

export interface UpdateLessonRequest {
  id: number;
  title: string;
  videoUrl?: string | null;
  durationMinutes: number;
}

export interface CreateLessonResourceRequest {
  lessonId: number;
  fileName: string;
  fileUrl: string;
}
