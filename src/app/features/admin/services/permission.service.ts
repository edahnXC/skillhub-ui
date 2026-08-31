import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { 
  PermissionMatrix, 
  Role, 
  RoleDetail, 
  CreateRoleRequest, 
  UpdateRolePermissionsRequest, 
  UserPermissionsResponse,
  SubAdminUserDetail,
  UpdateUserPermissionsRequest
} from '../models/permission.model';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private apiUrl = `${environment.apiUrl}/Permissions`;

  constructor(private http: HttpClient) {}

  getPermissionMatrix(): Observable<PermissionMatrix> {
    return this.http.get<PermissionMatrix>(`${this.apiUrl}/matrix`);
  }

  getUserPermissions(): Observable<UserPermissionsResponse> {
    return this.http.get<UserPermissionsResponse>(`${this.apiUrl}/user-permissions`);
  }

  getAllRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/roles`);
  }

  getRoleById(roleId: number): Observable<RoleDetail> {
    return this.http.get<RoleDetail>(`${this.apiUrl}/roles/${roleId}`);
  }

  createRole(request: CreateRoleRequest): Observable<Role> {
    return this.http.post<Role>(`${this.apiUrl}/roles`, request);
  }

  updateRolePermissions(roleId: number, permissionIds: number[]): Observable<{ message: string }> {
    const body: UpdateRolePermissionsRequest = {
      roleId: roleId,
      permissionIds: permissionIds
    };
    return this.http.put<{ message: string }>(`${this.apiUrl}/roles/${roleId}/permissions`, body);
  }

  getAllSubAdmins(): Observable<SubAdminUserDetail[]> {
    return this.http.get<SubAdminUserDetail[]>(`${this.apiUrl}/subadmins`);
  }

  getUserPermissionsDetail(userId: number): Observable<SubAdminUserDetail> {
    return this.http.get<SubAdminUserDetail>(`${this.apiUrl}/users/${userId}`);
  }

  updateUserPermissions(userId: number, permissionIds: number[]): Observable<{ message: string }> {
    const body: UpdateUserPermissionsRequest = {
      userId: userId,
      permissionIds: permissionIds
    };
    return this.http.put<{ message: string }>(`${this.apiUrl}/users/${userId}/permissions`, body);
  }
}
