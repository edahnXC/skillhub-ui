import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CourseLearning, ToggleLessonCompletionRequest, LessonCompletionResult } from '../models/learning.model';

@Injectable({
  providedIn: 'root'
})
export class LearningService {
  private apiUrl = `${environment.apiUrl}/Learning`;

  constructor(private http: HttpClient) {}

  getCourseLearning(courseId: number): Observable<CourseLearning> {
    return this.http.get<CourseLearning>(`${this.apiUrl}/course/${courseId}`);
  }

  toggleLessonCompletion(request: ToggleLessonCompletionRequest): Observable<LessonCompletionResult> {
    return this.http.post<LessonCompletionResult>(`${this.apiUrl}/toggle-completion`, request);
  }
}
