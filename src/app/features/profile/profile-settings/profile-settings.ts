import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../services/profile.service';
import { UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '../models/profile.model';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-settings.html',
  styleUrl: './profile-settings.scss'
})
export class ProfileSettings implements OnInit {
  profile: UserProfile | null = null;
  isLoading = true;
  error: string | null = null;

  // Profile Edit Form State
  editForm: UpdateProfileRequest = {
    firstName: '',
    lastName: '',
    phoneNumber: ''
  };
  isUpdatingProfile = false;
  profileSuccessMessage: string | null = null;
  profileErrorMessage: string | null = null;

  // Password Change Form State
  passwordForm: ChangePasswordRequest = {
    currentPassword: '',
    newPassword: ''
  };
  confirmPassword = '';
  isChangingPassword = false;
  passwordSuccessMessage: string | null = null;
  passwordErrorMessage: string | null = null;

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.error = null;
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.editForm = {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phoneNumber: data.phoneNumber || ''
        };
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load user profile details. Please try again.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  onUpdateProfile(): void {
    this.profileSuccessMessage = null;
    this.profileErrorMessage = null;

    if (!this.editForm.firstName.trim() || !this.editForm.lastName.trim()) {
      this.profileErrorMessage = 'First Name and Last Name are required.';
      return;
    }

    this.isUpdatingProfile = true;
    this.profileService.updateProfile(this.editForm).subscribe({
      next: (res) => {
        this.isUpdatingProfile = false;
        this.profileSuccessMessage = res.message || 'Profile updated successfully!';
        if (this.profile) {
          this.profile.firstName = this.editForm.firstName;
          this.profile.lastName = this.editForm.lastName;
          this.profile.phoneNumber = this.editForm.phoneNumber;
        }
      },
      error: (err) => {
        this.isUpdatingProfile = false;
        this.profileErrorMessage = err.error?.message || 'Failed to update profile details.';
        console.error(err);
      }
    });
  }

  onChangePassword(): void {
    this.passwordSuccessMessage = null;
    this.passwordErrorMessage = null;

    if (!this.passwordForm.currentPassword || !this.passwordForm.newPassword) {
      this.passwordErrorMessage = 'Please fill out all password fields.';
      return;
    }

    if (this.passwordForm.newPassword.length < 6) {
      this.passwordErrorMessage = 'New password must be at least 6 characters long.';
      return;
    }

    if (this.passwordForm.newPassword !== this.confirmPassword) {
      this.passwordErrorMessage = 'New password and confirm password do not match.';
      return;
    }

    this.isChangingPassword = true;
    this.profileService.changePassword(this.passwordForm).subscribe({
      next: (res) => {
        this.isChangingPassword = false;
        this.passwordSuccessMessage = res.message || 'Password changed successfully!';
        this.passwordForm = { currentPassword: '', newPassword: '' };
        this.confirmPassword = '';
      },
      error: (err) => {
        this.isChangingPassword = false;
        this.passwordErrorMessage = err.error?.message || 'Failed to change password. Please check your current password.';
        console.error(err);
      }
    });
  }

  getInitials(): string {
    if (!this.profile) return '?';
    const first = this.profile.firstName ? this.profile.firstName.charAt(0) : '';
    const last = this.profile.lastName ? this.profile.lastName.charAt(0) : '';
    return (first + last).toUpperCase() || this.profile.email.charAt(0).toUpperCase();
  }
}
