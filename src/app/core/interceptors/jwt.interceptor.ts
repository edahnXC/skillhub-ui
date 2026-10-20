import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../../features/auth/services/auth.service';

let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  // Retrieve token directly from localStorage to prevent circular DI during startup
  const token = localStorage.getItem('token');

  // Skip token attachment for login, register, and refresh endpoints
  const isExcludedEndpoint = req.url.includes('/api/auth/login') 
                          || req.url.includes('/api/auth/register')
                          || req.url.includes('/api/auth/refresh');

  let authReq = req;
  
  // Attach token if it exists and not going to an excluded endpoint
  if (token && !isExcludedEndpoint) {
    authReq = addTokenHeader(req, token);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If error is 401 and not from an excluded endpoint, try to refresh
      if (error.status === 401 && !isExcludedEndpoint) {
        return handle401Error(authReq, next, injector);
      }
      return throwError(() => error);
    })
  );
};

function addTokenHeader(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    headers: request.headers.set('Authorization', `Bearer ${token}`)
  });
}

function handle401Error(request: HttpRequest<unknown>, next: HttpHandlerFn, injector: Injector): Observable<HttpEvent<unknown>> {
  const authService = injector.get(AuthService);

  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((tokenResponse) => {
        isRefreshing = false;
        refreshTokenSubject.next(tokenResponse.token);
        return next(addTokenHeader(request, tokenResponse.token));
      }),
      catchError((err) => {
        isRefreshing = false;
        refreshTokenSubject.error(err); // Fail all queued requests waiting for the token
        refreshTokenSubject = new BehaviorSubject<string | null>(null); // Reset subject for future requests
        authService.logout();
        return throwError(() => err);
      })
    );
  } else {
    // Wait for the refresh to complete before retrying
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => {
        return next(addTokenHeader(request, token as string));
      })
    );
  }
}
