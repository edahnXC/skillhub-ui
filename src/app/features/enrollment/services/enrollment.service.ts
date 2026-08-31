import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Course } from '../../courses/course.model';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {
  private apiUrl = `${environment.apiUrl}/enrollment`;

  constructor(private http: HttpClient) {}

  enroll(courseId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/enroll/${courseId}`, {});
  }

  getMyLearning(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/my-learning`);
  }

  checkEnrollment(courseId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/check/${courseId}`);
  }
}
