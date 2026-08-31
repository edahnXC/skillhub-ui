import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Quiz, SubmitQuizAttemptRequest, QuizAttemptResult } from '../models/quiz.model';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private apiUrl = `${environment.apiUrl}/Quizzes`;

  constructor(private http: HttpClient) {}

  getCourseQuizzes(courseId: number): Observable<Quiz[]> {
    return this.http.get<Quiz[]>(`${this.apiUrl}/course/${courseId}`);
  }

  getQuizById(quizId: number): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.apiUrl}/${quizId}`);
  }

  submitQuizAttempt(request: SubmitQuizAttemptRequest): Observable<QuizAttemptResult> {
    return this.http.post<QuizAttemptResult>(`${this.apiUrl}/submit`, request);
  }
}
