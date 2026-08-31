import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CourseSection,
  CourseLesson,
  LessonResource,
  CreateSectionRequest,
  UpdateSectionRequest,
  CreateLessonRequest,
  UpdateLessonRequest,
  CreateLessonResourceRequest
} from '../models/curriculum.model';

@Injectable({
  providedIn: 'root'
})
export class CurriculumService {
  private apiUrl = `${environment.apiUrl}/Curriculum`;

  constructor(private http: HttpClient) {}

  getCurriculum(courseId: number): Observable<CourseSection[]> {
    return this.http.get<CourseSection[]>(`${this.apiUrl}/course/${courseId}`);
  }

  createSection(request: CreateSectionRequest): Observable<CourseSection> {
    return this.http.post<CourseSection>(`${this.apiUrl}/sections`, request);
  }

  updateSection(request: UpdateSectionRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/sections`, request);
  }

  deleteSection(sectionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sections/${sectionId}`);
  }

  createLesson(request: CreateLessonRequest): Observable<CourseLesson> {
    return this.http.post<CourseLesson>(`${this.apiUrl}/lessons`, request);
  }

  updateLesson(request: UpdateLessonRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/lessons`, request);
  }

  deleteLesson(lessonId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/lessons/${lessonId}`);
  }

  addResource(request: CreateLessonResourceRequest): Observable<LessonResource> {
    return this.http.post<LessonResource>(`${this.apiUrl}/resources`, request);
  }

  deleteResource(resourceId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/resources/${resourceId}`);
  }
}
