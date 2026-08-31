export interface Permission {
  id: number;
  name: string;
  description: string;
  category: string;
}

export interface PermissionCategory {
  categoryName: string;
  permissions: Permission[];
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissionsCount: number;
  usersCount: number;
  isSystemRole: boolean;
}

export interface RoleDetail {
  id: number;
  name: string;
  description: string;
  permissionIds: number[];
  permissionNames: string[];
}

export interface UpdateRolePermissionsRequest {
  roleId: number;
  permissionIds: number[];
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissionIds: number[];
}

export interface PermissionMatrix {
  roles: Role[];
  categories: PermissionCategory[];
  rolePermissions: { [roleId: number]: number[] };
}

export interface UserPermissionsResponse {
  userId: number;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface SubAdminUserDetail {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  configuredPermissionIds: number[];
  effectivePermissionNames: string[];
}

export interface UpdateUserPermissionsRequest {
  userId: number;
  permissionIds: number[];
}

