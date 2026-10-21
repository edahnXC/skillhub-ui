import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, of, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { RegisterRequest } from '../models/register-request.model';
import { LoginRequest } from '../models/login-request.model';
import { AuthResponse } from '../models/auth-response.model';
import { RefreshRequest } from '../models/refresh-request.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly USER_KEY = 'user';
  private readonly ROLES_KEY = 'roles';
  private readonly PERMISSIONS_KEY = 'permissions';

  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(null);
  private currentRolesSubject = new BehaviorSubject<string[]>([]);
  private currentPermissionsSubject = new BehaviorSubject<string[]>([]);
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public currentRoles$ = this.currentRolesSubject.asObservable();
  public currentPermissions$ = this.currentPermissionsSubject.asObservable();
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadStateFromStorage();
  }

  private loadStateFromStorage(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userRaw = localStorage.getItem(this.USER_KEY);
    const rolesRaw = localStorage.getItem(this.ROLES_KEY);
    const permsRaw = localStorage.getItem(this.PERMISSIONS_KEY);

    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw) as AuthResponse;
        const roles = rolesRaw ? JSON.parse(rolesRaw) : [];
        const perms = permsRaw ? JSON.parse(permsRaw) : [];

        this.currentUserSubject.next(user);
        this.currentRolesSubject.next(roles);
        this.currentPermissionsSubject.next(perms);
        this.isLoggedInSubject.next(true);

        // Refresh permissions from server in background after bootstrap
        setTimeout(() => {
          this.refreshUserPermissions().subscribe({
            error: () => { /* gracefully ignore if backend unavailable */ }
          });
        }, 0);
      } catch {
        this.clearState();
      }
    }
  }

  private saveStateToStorage(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    if (response.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    }
    
    const parsedId = this.getUserIdFromToken(response.token) || (response as any).userId;
    const userInfo = {
      id: parsedId,
      userId: parsedId,
      email: response.email,
      fullName: response.fullName
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(userInfo));
    
    if (response.roles) {
      localStorage.setItem(this.ROLES_KEY, JSON.stringify(response.roles));
    }

    this.currentUserSubject.next(response);
    this.currentRolesSubject.next(response.roles || []);
    this.isLoggedInSubject.next(true);

    // Fetch and store dynamic user permissions
    this.refreshUserPermissions().subscribe();
  }

  public refreshUserPermissions(): Observable<string[]> {
    if (!this.getToken()) {
      return of([]);
    }

    return this.http.get<{ permissions: string[] }>(`${environment.apiUrl}/Permissions/user-permissions`)
      .pipe(
        tap(res => {
          const perms = res.permissions || [];
          localStorage.setItem(this.PERMISSIONS_KEY, JSON.stringify(perms));
          this.currentPermissionsSubject.next(perms);
        }),
        catchError(err => {
          console.warn('Could not refresh permissions from server', err);
          return of([]);
        })
      ) as unknown as Observable<string[]>;
  }

  public hasPermission(permission: string): boolean {
    const currentRoles = this.currentRolesSubject.value || [];
    // SuperAdmin always has full access by default
    if (currentRoles.includes('SuperAdmin')) {
      return true;
    }
    const currentPerms = this.currentPermissionsSubject.value || [];
    return currentPerms.includes(permission);
  }

  public hasAnyPermission(permissions: string[]): boolean {
    const currentRoles = this.currentRolesSubject.value || [];
    if (currentRoles.includes('SuperAdmin')) {
      return true;
    }
    const currentPerms = this.currentPermissionsSubject.value || [];
    return permissions.some(p => currentPerms.includes(p));
  }

  public getPermissions(): string[] {
    return this.currentPermissionsSubject.value || [];
  }

  private clearState(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ROLES_KEY);
    localStorage.removeItem(this.PERMISSIONS_KEY);
    
    this.currentUserSubject.next(null);
    this.currentRolesSubject.next([]);
    this.currentPermissionsSubject.next([]);
    this.isLoggedInSubject.next(false);
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, request)
      .pipe(tap(response => this.saveStateToStorage(response)));
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, request)
      .pipe(tap(response => this.saveStateToStorage(response)));
  }

  forgotPassword(email: string): Observable<{ message: string; resetCode?: string }> {
    return this.http.post<{ message: string; resetCode?: string }>(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(payload: { email: string; resetCode: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/reset-password`, payload);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshRequest = { token: refreshToken };
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, request)
      .pipe(
        tap(response => {
          this.saveStateToStorage(response);
        }),
        catchError(err => {
          this.clearState();
          this.router.navigate(['/login']);
          return throwError(() => err);
        })
      );
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${environment.apiUrl}/auth/logout`, { token: refreshToken }).subscribe({
        next: () => {},
        error: () => {}
      });
    }
    this.clearState();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getAccessToken(): string | null {
    return this.getToken();
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getUserEmail(): string | null {
    const userRaw = localStorage.getItem(this.USER_KEY);
    if (!userRaw) return null;
    try {
      const user = JSON.parse(userRaw);
      return user.email || null;
    } catch {
      return null;
    }
  }

  getUserId(): number | null {
    const userRaw = localStorage.getItem(this.USER_KEY);
    if (userRaw) {
      try {
        const u = JSON.parse(userRaw);
        if (u.id || u.userId) {
          return parseInt(u.id || u.userId, 10);
        }
      } catch {}
    }
    return this.getUserIdFromToken(this.getToken() || '');
  }

  private getUserIdFromToken(token: string): number | null {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(decodeURIComponent(escape(atob(base64))));
      const idVal = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] 
                 || payload.nameid 
                 || payload.sub 
                 || payload.id 
                 || payload.userId;
      return idVal ? parseInt(idVal, 10) : null;
    } catch {
      return null;
    }
  }

  hasRole(role: string): boolean {
    const currentRoles = this.currentRolesSubject.value || [];
    return currentRoles.includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(r => this.hasRole(r));
  }

  isInstructor(): boolean {
    return this.hasRole('Instructor');
  }

  isStudent(): boolean {
    return this.hasRole('Student');
  }

  isAdmin(): boolean {
    return this.hasRole('SuperAdmin') || this.hasRole('SubAdmin');
  }

  isSuperAdmin(): boolean {
    return this.hasRole('SuperAdmin');
  }
}
