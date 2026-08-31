import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CourseReview, CourseReviewSummary, CreateOrUpdateReviewRequest } from '../models/review.model';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/Reviews`;

  constructor(private http: HttpClient) {}

  getCourseReviews(courseId: number): Observable<CourseReviewSummary> {
    return this.http.get<CourseReviewSummary>(`${this.apiUrl}/course/${courseId}`);
  }

  submitReview(request: CreateOrUpdateReviewRequest): Observable<CourseReview> {
    return this.http.post<CourseReview>(this.apiUrl, request);
  }

  deleteReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${reviewId}`);
  }
}
