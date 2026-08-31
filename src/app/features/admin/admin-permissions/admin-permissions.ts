import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermissionService } from '../services/permission.service';
import { AuthService } from '../../auth/services/auth.service';
import { PermissionMatrix, Role, PermissionCategory, SubAdminUserDetail } from '../models/permission.model';

@Component({
  selector: 'app-admin-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-permissions.html',
  styleUrl: './admin-permissions.scss'
})
export class AdminPermissions implements OnInit {
  activeTab: 'matrix' | 'subadmins' = 'matrix';

  matrix: PermissionMatrix | null = null;
  roles: Role[] = [];
  categories: PermissionCategory[] = [];
  
  // Working state: roleId -> Set of Permission IDs
  workingPermissions: { [roleId: number]: Set<number> } = {};
  originalPermissions: { [roleId: number]: Set<number> } = {};

  // SubAdmin Specific Management State
  subAdmins: SubAdminUserDetail[] = [];
  selectedSubAdmin: SubAdminUserDetail | null = null;
  workingSubAdminPermIds = new Set<number>();
  originalSubAdminPermIds = new Set<number>();
  isLoadingSubAdmins = false;
  isSavingSubAdmin = false;
  subAdminSearchQuery = '';

  isLoading = true;
  isSaving = false;
  searchQuery = '';
  selectedCategory = 'ALL';
  
  // Create Role Modal
  showCreateRoleModal = false;
  newRoleName = '';
  newRoleDescription = '';
  isCreatingRole = false;

  // Toast feedback
  toastMessage = '';
  showToast = false;

  constructor(
    private permissionService: PermissionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadMatrix();
    this.loadSubAdmins();
  }

  loadMatrix(): void {
    this.isLoading = true;
    this.permissionService.getPermissionMatrix().subscribe({
      next: (data) => {
        this.matrix = data;
        this.roles = data.roles;
        this.categories = data.categories;

        this.workingPermissions = {};
        this.originalPermissions = {};

        // Populate sets
        for (const role of data.roles) {
          const permList = data.rolePermissions[role.id] || [];
          this.workingPermissions[role.id] = new Set(permList);
          this.originalPermissions[role.id] = new Set(permList);
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load permission matrix', err);
        this.isLoading = false;
      }
    });
  }

  loadSubAdmins(): void {
    this.isLoadingSubAdmins = true;
    this.permissionService.getAllSubAdmins().subscribe({
      next: (data: SubAdminUserDetail[]) => {
        this.subAdmins = data;
        this.isLoadingSubAdmins = false;
      },
      error: (err) => {
        console.error('Failed to load SubAdmins list', err);
        this.isLoadingSubAdmins = false;
      }
    });
  }

  get availableCategoryNames(): string[] {
    return this.categories.map(c => c.categoryName);
  }

  get filteredCategories(): PermissionCategory[] {
    if (!this.categories) return [];

    return this.categories
      .filter(cat => this.selectedCategory === 'ALL' || cat.categoryName === this.selectedCategory)
      .map(cat => {
        const matchingPerms = cat.permissions.filter(p => {
          if (!this.searchQuery.trim()) return true;
          const query = this.searchQuery.toLowerCase();
          return p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
        });

        return {
          categoryName: cat.categoryName,
          permissions: matchingPerms
        };
      })
      .filter(cat => cat.permissions.length > 0);
  }

  get filteredSubAdmins(): SubAdminUserDetail[] {
    if (!this.subAdminSearchQuery.trim()) return this.subAdmins;
    const q = this.subAdminSearchQuery.toLowerCase();
    return this.subAdmins.filter(s => 
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  }

  // ── Role Matrix Actions ──
  hasPermission(roleId: number, permissionId: number): boolean {
    return !!this.workingPermissions[roleId]?.has(permissionId);
  }

  togglePermission(role: Role, permissionId: number): void {
    if (role.name === 'SuperAdmin') {
      return; // SuperAdmin always maintains full access
    }

    if (!this.workingPermissions[role.id]) {
      this.workingPermissions[role.id] = new Set();
    }

    const set = this.workingPermissions[role.id];
    if (set.has(permissionId)) {
      set.delete(permissionId);
    } else {
      set.add(permissionId);
    }
  }

  selectAllForCategory(role: Role, category: PermissionCategory): void {
    if (role.name === 'SuperAdmin') return;
    if (!this.workingPermissions[role.id]) {
      this.workingPermissions[role.id] = new Set();
    }
    for (const p of category.permissions) {
      this.workingPermissions[role.id].add(p.id);
    }
  }

  deselectAllForCategory(role: Role, category: PermissionCategory): void {
    if (role.name === 'SuperAdmin') return;
    if (!this.workingPermissions[role.id]) return;
    for (const p of category.permissions) {
      this.workingPermissions[role.id].delete(p.id);
    }
  }

  get modifiedRoles(): Role[] {
    return this.roles.filter(role => {
      const orig = this.originalPermissions[role.id] || new Set();
      const current = this.workingPermissions[role.id] || new Set();

      if (orig.size !== current.size) return true;
      for (const id of current) {
        if (!orig.has(id)) return true;
      }
      return false;
    });
  }

  get hasUnsavedChanges(): boolean {
    return this.modifiedRoles.length > 0;
  }

  discardChanges(): void {
    if (confirm('Discard all unsaved role permission changes?')) {
      this.loadMatrix();
    }
  }

  saveAllChanges(): void {
    const modified = this.modifiedRoles;
    if (modified.length === 0) return;

    this.isSaving = true;
    let completed = 0;

    for (const role of modified) {
      const permIds = Array.from(this.workingPermissions[role.id] || []);
      this.permissionService.updateRolePermissions(role.id, permIds).subscribe({
        next: () => {
          completed++;
          if (completed === modified.length) {
            this.isSaving = false;
            this.triggerToast('🎉 Role permissions updated successfully!');
            this.authService.refreshUserPermissions().subscribe();
            this.loadMatrix();
          }
        },
        error: (err) => {
          console.error(`Failed to update permissions for role ${role.name}`, err);
          completed++;
          if (completed === modified.length) {
            this.isSaving = false;
            alert('Failed to save some role permissions.');
            this.loadMatrix();
          }
        }
      });
    }
  }

  // ── SubAdmin Specific Granular Management ──
  selectSubAdmin(subAdmin: SubAdminUserDetail): void {
    this.selectedSubAdmin = subAdmin;
    this.workingSubAdminPermIds = new Set(subAdmin.configuredPermissionIds || []);
    this.originalSubAdminPermIds = new Set(subAdmin.configuredPermissionIds || []);
  }

  closeSubAdminDrawer(): void {
    this.selectedSubAdmin = null;
  }

  isSubAdminPermSelected(permId: number): boolean {
    return this.workingSubAdminPermIds.has(permId);
  }

  toggleSubAdminPerm(permId: number): void {
    if (this.workingSubAdminPermIds.has(permId)) {
      this.workingSubAdminPermIds.delete(permId);
    } else {
      this.workingSubAdminPermIds.add(permId);
    }
  }

  selectAllSubAdminCategory(cat: PermissionCategory): void {
    for (const p of cat.permissions) {
      this.workingSubAdminPermIds.add(p.id);
    }
  }

  deselectAllSubAdminCategory(cat: PermissionCategory): void {
    for (const p of cat.permissions) {
      this.workingSubAdminPermIds.delete(p.id);
    }
  }

  selectAllSubAdmin(): void {
    for (const cat of this.categories) {
      for (const p of cat.permissions) {
        this.workingSubAdminPermIds.add(p.id);
      }
    }
  }

  clearAllSubAdmin(): void {
    this.workingSubAdminPermIds.clear();
  }

  get hasSubAdminChanges(): boolean {
    if (!this.selectedSubAdmin) return false;
    if (this.workingSubAdminPermIds.size !== this.originalSubAdminPermIds.size) return true;
    for (const id of this.workingSubAdminPermIds) {
      if (!this.originalSubAdminPermIds.has(id)) return true;
    }
    return false;
  }

  saveSubAdminSpecificPermissions(): void {
    if (!this.selectedSubAdmin || this.isSavingSubAdmin) return;

    this.isSavingSubAdmin = true;
    const permIds = Array.from(this.workingSubAdminPermIds);

    this.permissionService.updateUserPermissions(this.selectedSubAdmin.id, permIds).subscribe({
      next: () => {
        this.isSavingSubAdmin = false;
        this.triggerToast(`✅ Custom permissions updated for SubAdmin ${this.selectedSubAdmin?.firstName} ${this.selectedSubAdmin?.lastName}!`);
        if (this.selectedSubAdmin) {
          this.selectedSubAdmin.configuredPermissionIds = permIds;
        }
        this.originalSubAdminPermIds = new Set(permIds);
        this.loadSubAdmins();
      },
      error: (err) => {
        this.isSavingSubAdmin = false;
        console.error('Failed to update SubAdmin permissions', err);
        alert(err.error?.message || 'Failed to update SubAdmin permissions.');
      }
    });
  }

  openCreateRoleModal(): void {
    this.newRoleName = '';
    this.newRoleDescription = '';
    this.showCreateRoleModal = true;
  }

  closeCreateRoleModal(): void {
    this.showCreateRoleModal = false;
  }

  createRole(): void {
    if (!this.newRoleName.trim() || this.isCreatingRole) return;

    this.isCreatingRole = true;
    this.permissionService.createRole({
      name: this.newRoleName.trim(),
      description: this.newRoleDescription.trim(),
      permissionIds: []
    }).subscribe({
      next: (newRole) => {
        this.isCreatingRole = false;
        this.showCreateRoleModal = false;
        this.triggerToast(`Role '${newRole.name}' created successfully!`);
        this.loadMatrix();
      },
      error: (err) => {
        console.error('Failed to create role', err);
        this.isCreatingRole = false;
        alert(err.error?.message || 'Failed to create role.');
      }
    });
  }

  triggerToast(msg: string): void {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }
}
