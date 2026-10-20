import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUserDto } from '../services/admin.service';
import { PermissionService } from '../services/permission.service';
import { AuthService } from '../../auth/services/auth.service';
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

  // Search & Filter State
  searchTerm = '';
  selectedRole = 'ALL';
  selectedStatus = 'ALL';

  // Pagination State (Default 10 items per page; supports 10, 15, 25, 50)
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 15, 25, 50];

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
    private permissionService: PermissionService,
    private authService: AuthService
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

  // Role & Permission Security Checks
  get isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  get currentUserId(): number | null {
    return this.authService.getUserId();
  }

  canDeleteUser(user: AdminUserDto): boolean {
    // 1. SuperAdmin accounts can never be deleted
    if (user.roles.includes('SuperAdmin')) {
      return false;
    }

    // 2. User cannot delete their own account
    if (this.currentUserId !== null && user.id === this.currentUserId) {
      return false;
    }

    // 3. SubAdmin deletion restriction:
    // "no SubAdmin should have a permission to delete any other admin... only the SuperAdmin can delete the SubAdmins."
    if (user.roles.includes('SubAdmin')) {
      return this.isSuperAdmin;
    }

    // 4. Students and Instructors can be deleted by SuperAdmin or authorized SubAdmin
    return true;
  }

  getDeleteTooltip(user: AdminUserDto): string {
    if (user.roles.includes('SuperAdmin')) {
      return 'SuperAdmin accounts are protected and cannot be deleted.';
    }
    if (this.currentUserId !== null && user.id === this.currentUserId) {
      return 'You cannot delete your own account.';
    }
    if (user.roles.includes('SubAdmin') && !this.isSuperAdmin) {
      return 'SubAdmins cannot delete other administrators. Only the SuperAdmin can delete SubAdmins.';
    }
    return 'Delete this user account';
  }

  // Filter & Search Logic
  get filteredUsers(): AdminUserDto[] {
    return this.users.filter(u => {
      // Text search in name or email
      if (this.searchTerm.trim()) {
        const term = this.searchTerm.toLowerCase().trim();
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
        const emailMatch = u.email.toLowerCase().includes(term);
        const nameMatch = fullName.includes(term);
        if (!emailMatch && !nameMatch) return false;
      }

      // Role filter
      if (this.selectedRole !== 'ALL') {
        if (!u.roles.includes(this.selectedRole)) return false;
      }

      // Status filter
      if (this.selectedStatus !== 'ALL') {
        const isActive = this.selectedStatus === 'ACTIVE';
        if (u.isActive !== isActive) return false;
      }

      return true;
    });
  }

  // Dynamic role counts for filter badges
  get countAll(): number { return this.users.length; }
  get countStudents(): number { return this.users.filter(u => u.roles.includes('Student')).length; }
  get countInstructors(): number { return this.users.filter(u => u.roles.includes('Instructor')).length; }
  get countSubAdmins(): number { return this.users.filter(u => u.roles.includes('SubAdmin')).length; }
  get countSuperAdmins(): number { return this.users.filter(u => u.roles.includes('SuperAdmin')).length; }

  // Pagination Logic
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize));
  }

  get pagedUsers(): AdminUserDto[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(startIndex, startIndex + this.pageSize);
  }

  get paginationStartIndex(): number {
    if (this.filteredUsers.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredUsers.length);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
      range.push(i);
    }
    return range;
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  firstPage(): void {
    this.currentPage = 1;
  }

  lastPage(): void {
    this.currentPage = this.totalPages;
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedRole = 'ALL';
    this.selectedStatus = 'ALL';
    this.currentPage = 1;
  }

  deleteUser(id: number): void {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      this.adminService.deleteUser(id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== id);
          if (this.currentPage > this.totalPages) {
            this.currentPage = Math.max(1, this.totalPages);
          }
          this.triggerToast('User removed successfully.');
        },
        error: (err) => {
          console.error('Error deleting user:', err);
          alert(err.error?.message || 'Failed to delete user.');
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
