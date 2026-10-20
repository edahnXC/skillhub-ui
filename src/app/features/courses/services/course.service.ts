import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment }
from '../../../../environments/environment';

import { Course }
from '../course.model';

import { CreateCourseRequest }
from '../models/create-course-request.model';

import { CourseCategory } from '../models/course-category.model';

export interface PlatformStats {
    coursesCount: number;
    instructorsCount: number;
    studentsCount: number;
    totalEnrollments: number;
    averageRating: number;
}

@Injectable({
    providedIn:'root'
})
export class CourseService
{
    constructor(
        private http:HttpClient)
    {
    }

    getPlatformStats(): Observable<PlatformStats> {
        return this.http.get<PlatformStats>(`${environment.apiUrl}/course/platform-stats`);
    }
    getAllCourses()
    : Observable<Course[]>
    {
        return this.http.get<Course[]>(
            `${environment.apiUrl}/course`);
    }

    createCourse(
        request:CreateCourseRequest)
    : Observable<Course>
    {
        return this.http.post<Course>(
            `${environment.apiUrl}/course`,
            request);
    }

    getCourseById(id: number): Observable<Course> {
        return this.http.get<Course>(`${environment.apiUrl}/course/${id}`);
    }

    getCoursesByInstructorId(instructorId: number): Observable<Course[]> {
        return this.http.get<Course[]>(`${environment.apiUrl}/course/instructor/${instructorId}`);
    }

    updateCourse(request: any): Observable<void> {
        return this.http.put<void>(`${environment.apiUrl}/course`, request);
    }

    deleteCourse(id: number): Observable<void> {
        return this.http.delete<void>(`${environment.apiUrl}/course/${id}`);
    }

    getCategories(): Observable<CourseCategory[]> {
        return this.http.get<CourseCategory[]>(`${environment.apiUrl}/category`);
    }

    uploadImage(file: File): Observable<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<{ url: string }>(
            `${environment.apiUrl}/upload/image`,
            formData
        );
    }
}