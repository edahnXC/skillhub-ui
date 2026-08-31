import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminService, CreateUserRequestDto } from '../services/admin.service';
import { PermissionService } from '../services/permission.service';
import { PermissionCategory, PermissionMatrix } from '../models/permission.model';

@Component({
  selector: 'app-admin-create-user',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-create-user.html',
  styleUrl: './admin-create-user.scss'
})
export class AdminCreateUser implements OnInit {
  user: CreateUserRequestDto = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'SubAdmin',
    permissionIds: []
  };

  roles = [
    { value: 'SubAdmin', label: 'Sub Admin (Granular Permissions)' },
    { value: 'Instructor', label: 'Instructor' },
    { value: 'Student', label: 'Student' }
  ];

  categories: PermissionCategory[] = [];
  selectedPermissionIds = new Set<number>();
  isLoadingPermissions = false;
  isSubmitting = false;
  error = '';

  constructor(
    private adminService: AdminService,
    private permissionService: PermissionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPermissionMatrix();
  }

  loadPermissionMatrix(): void {
    this.isLoadingPermissions = true;
    this.permissionService.getPermissionMatrix().subscribe({
      next: (matrix: PermissionMatrix) => {
        this.categories = matrix.categories || [];
        this.isLoadingPermissions = false;
        this.initDefaultSubAdminPermissions(matrix);
      },
      error: (err) => {
        console.error('Failed to load permissions matrix', err);
        this.isLoadingPermissions = false;
      }
    });
  }

  initDefaultSubAdminPermissions(matrix: PermissionMatrix): void {
    this.selectedPermissionIds.clear();
    // Pre-populate with SubAdmin default permissions from system matrix if available
    const subAdminRole = matrix.roles?.find(r => r.name === 'SubAdmin');
    if (subAdminRole && matrix.rolePermissions[subAdminRole.id]) {
      for (const pid of matrix.rolePermissions[subAdminRole.id]) {
        this.selectedPermissionIds.add(pid);
      }
    } else {
      // Fallback default selection
      for (const cat of this.categories) {
        for (const p of cat.permissions) {
          if (p.name.startsWith('Tabs.') || p.name.includes('View') || p.name.includes('Approve')) {
            this.selectedPermissionIds.add(p.id);
          }
        }
      }
    }
  }

  onRoleChange(): void {
    if (this.user.role !== 'SubAdmin') {
      this.selectedPermissionIds.clear();
    }
  }

  isPermissionSelected(id: number): boolean {
    return this.selectedPermissionIds.has(id);
  }

  togglePermission(id: number): void {
    if (this.selectedPermissionIds.has(id)) {
      this.selectedPermissionIds.delete(id);
    } else {
      this.selectedPermissionIds.add(id);
    }
  }

  isCategoryAllSelected(cat: PermissionCategory): boolean {
    if (!cat.permissions || cat.permissions.length === 0) return false;
    return cat.permissions.every(p => this.selectedPermissionIds.has(p.id));
  }

  toggleCategory(cat: PermissionCategory): void {
    const allSelected = this.isCategoryAllSelected(cat);
    for (const p of cat.permissions) {
      if (allSelected) {
        this.selectedPermissionIds.delete(p.id);
      } else {
        this.selectedPermissionIds.add(p.id);
      }
    }
  }

  selectAllPermissions(): void {
    for (const cat of this.categories) {
      for (const p of cat.permissions) {
        this.selectedPermissionIds.add(p.id);
      }
    }
  }

  deselectAllPermissions(): void {
    this.selectedPermissionIds.clear();
  }

  get selectedPermissionsCount(): number {
    return this.selectedPermissionIds.size;
  }

  onSubmit(): void {
    if (!this.user.firstName || !this.user.lastName || !this.user.email || !this.user.password || !this.user.role) {
      this.error = 'All fields are required.';
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    if (this.user.role === 'SubAdmin') {
      this.user.permissionIds = Array.from(this.selectedPermissionIds);
    } else {
      this.user.permissionIds = [];
    }

    this.adminService.createUser(this.user).subscribe({
      next: () => {
        this.isSubmitting = false;
        const count = this.user.permissionIds?.length || 0;
        alert(`User '${this.user.firstName} ${this.user.lastName}' created successfully with ${count} permissions configured!`);
        this.router.navigate(['/admin/users']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err.error?.message || 'Failed to create user. Ensure email is unique.';
        console.error(err);
      }
    });
  }
}
