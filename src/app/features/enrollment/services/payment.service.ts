import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CheckoutSessionResponse {
  sessionUrl: string;
  sessionId: string;
}

export interface ConfirmPaymentResponse {
  message: string;
  courseId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly apiUrl = `${environment.apiUrl}/payment`;

  constructor(private http: HttpClient) {}

  createCheckoutSession(courseId: number, successUrl: string, cancelUrl: string): Observable<CheckoutSessionResponse> {
    return this.http.post<CheckoutSessionResponse>(`${this.apiUrl}/create-checkout`, {
      courseId,
      successUrl,
      cancelUrl
    });
  }

  confirmPayment(sessionId: string): Observable<ConfirmPaymentResponse> {
    return this.http.post<ConfirmPaymentResponse>(`${this.apiUrl}/confirm`, {
      sessionId
    });
  }
}
