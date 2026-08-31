import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUserDto } from '../services/admin.service';
import { PermissionService } from '../services/permission.service';
import { PermissionCategory, PermissionMatrix, SubAdminUserDetail } from '../models/permission.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss'
})
export class AdminUsers implements OnInit {
  users: AdminUserDto[] = [];
  isLoading = true;
  error = '';

  // Granular SubAdmin Permission Modal State
  selectedSubAdmin: AdminUserDto | null = null;
  showPermissionModal = false;
  isLoadingSubAdminPerms = false;
  isSavingPerms = false;
  categories: PermissionCategory[] = [];
  subAdminPermissionIds = new Set<number>();

  toastMessage = '';
  showToast = false;

  constructor(
    private adminService: AdminService,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadPermissionMatrix();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.adminService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load users.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  loadPermissionMatrix(): void {
    this.permissionService.getPermissionMatrix().subscribe({
      next: (matrix: PermissionMatrix) => {
        this.categories = matrix.categories || [];
      },
      error: (err) => {
        console.error('Failed to load permission matrix', err);
      }
    });
  }

  isSubAdmin(user: AdminUserDto): boolean {
    return user.roles.includes('SubAdmin');
  }

  openPermissionModal(user: AdminUserDto): void {
    this.selectedSubAdmin = user;
    this.showPermissionModal = true;
    this.isLoadingSubAdminPerms = true;
    this.subAdminPermissionIds.clear();

    this.permissionService.getUserPermissionsDetail(user.id).subscribe({
      next: (detail: SubAdminUserDetail) => {
        this.isLoadingSubAdminPerms = false;
        if (detail && detail.configuredPermissionIds) {
          for (const pid of detail.configuredPermissionIds) {
            this.subAdminPermissionIds.add(pid);
          }
        }
      },
      error: (err) => {
        console.error('Failed to fetch user permissions', err);
        this.isLoadingSubAdminPerms = false;
      }
    });
  }

  closePermissionModal(): void {
    this.showPermissionModal = false;
    this.selectedSubAdmin = null;
  }

  isPermissionSelected(id: number): boolean {
    return this.subAdminPermissionIds.has(id);
  }

  togglePermission(id: number): void {
    if (this.subAdminPermissionIds.has(id)) {
      this.subAdminPermissionIds.delete(id);
    } else {
      this.subAdminPermissionIds.add(id);
    }
  }

  isCategoryAllSelected(cat: PermissionCategory): boolean {
    if (!cat.permissions || cat.permissions.length === 0) return false;
    return cat.permissions.every(p => this.subAdminPermissionIds.has(p.id));
  }

  toggleCategory(cat: PermissionCategory): void {
    const allSelected = this.isCategoryAllSelected(cat);
    for (const p of cat.permissions) {
      if (allSelected) {
        this.subAdminPermissionIds.delete(p.id);
      } else {
        this.subAdminPermissionIds.add(p.id);
      }
    }
  }

  selectAllModalPermissions(): void {
    for (const cat of this.categories) {
      for (const p of cat.permissions) {
        this.subAdminPermissionIds.add(p.id);
      }
    }
  }

  deselectAllModalPermissions(): void {
    this.subAdminPermissionIds.clear();
  }

  saveSubAdminPermissions(): void {
    if (!this.selectedSubAdmin || this.isSavingPerms) return;

    this.isSavingPerms = true;
    const permissionIds = Array.from(this.subAdminPermissionIds);

    this.permissionService.updateUserPermissions(this.selectedSubAdmin.id, permissionIds).subscribe({
      next: () => {
        this.isSavingPerms = false;
        this.triggerToast(`✅ Granular permissions updated successfully for ${this.selectedSubAdmin?.firstName} ${this.selectedSubAdmin?.lastName}!`);
        this.closePermissionModal();
        this.loadUsers();
      },
      error: (err) => {
        this.isSavingPerms = false;
        console.error('Failed to update permissions', err);
        alert(err.error?.message || 'Failed to update permissions.');
      }
    });
  }

  deleteUser(id: number): void {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      this.adminService.deleteUser(id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== id);
          this.triggerToast('User removed successfully.');
        },
        error: (err) => {
          console.error('Error deleting user:', err);
          alert('Failed to delete user.');
        }
      });
    }
  }

  triggerToast(msg: string): void {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }
}
