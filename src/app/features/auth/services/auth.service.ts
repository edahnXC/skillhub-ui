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

        // Refresh permissions from server in background
        this.refreshUserPermissions().subscribe();
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
    
    const userInfo = {
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

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshRequest = { token: refreshToken };
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh-token`, request)
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
      this.http.post(`${environment.apiUrl}/auth/revoke-token`, { refreshToken }).subscribe({
        next: () => {},
        error: (err) => console.error('Error revoking token', err)
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
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub ? parseInt(payload.sub, 10) : (payload.nameid ? parseInt(payload.nameid, 10) : null);
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
