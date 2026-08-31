import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Instructor } from '../instructor.model';

@Injectable({
    providedIn: 'root'
})
export class InstructorService {

    constructor(private http: HttpClient) {}

    getInstructors(): Observable<Instructor[]> {
        return this.http.get<Instructor[]>(`${environment.apiUrl}/instructor`);
    }

    searchInstructors(query: string): Observable<Instructor[]> {
        const params = new HttpParams().set('query', query);
        return this.http.get<Instructor[]>(`${environment.apiUrl}/instructor`, { params });
    }

    getInstructorById(id: number): Observable<Instructor> {
        return this.http.get<Instructor>(`${environment.apiUrl}/instructor/${id}`);
    }
}
