import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AdminUserDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  roles: string[];
  permissions?: string[];
}

export interface AdminCourseDto {
  id: number;
  title: string;
  price: number;
  isPublished: boolean;
  createdAt: string;
  instructorName: string;
  categoryName: string;
}

export interface CreateUserRequestDto {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: string; // "SubAdmin", "Instructor", "Student"
  permissionIds?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<AdminUserDto[]> {
    return this.http.get<AdminUserDto[]>(`${this.apiUrl}/users`);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }

  getAllCourses(): Observable<AdminCourseDto[]> {
    return this.http.get<AdminCourseDto[]>(`${this.apiUrl}/courses`);
  }

  deleteCourse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/courses/${id}`);
  }

  createUser(dto: CreateUserRequestDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/create-user`, dto);
  }

  approveCourse(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/courses/${id}/approve`, {});
  }
}
