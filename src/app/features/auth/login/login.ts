import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  loginForm: FormGroup;
  errorMessage = '';
  isSubmitting = false;
  showPassword = false;

  // Forgot Password Modal State
  showForgotPasswordModal = false;
  forgotEmail = '';
  resetCode = '';
  newPassword = '';
  forgotStep: 'request' | 'reset' = 'request';
  forgotLoading = false;
  forgotMessage = '';
  forgotError = '';

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  constructor(
    private fb:FormBuilder,
    private authService:AuthService,
    private router:Router
  )
  {
    this.loginForm =
    this.fb.group(
    {
      email:['',
      [
        Validators.required,
        Validators.email
      ]],

      password:['',
      [
        Validators.required
      ]]
    });
  }

  onSubmit()
  {
    if(this.loginForm.invalid)
    {
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;

    this.authService
    .login(this.loginForm.value)
    .subscribe({

      next:(response)=>
      {
        console.log(response);


        this.router.navigate(
          ['/home']
        );
      },

      error:(error)=>
      {
        console.log(error);
        this.isSubmitting = false;
        this.errorMessage = 'Invalid email or password. Please try again.';
      }
    });
  }

  openForgotPassword(): void {
    this.showForgotPasswordModal = true;
    this.forgotEmail = this.loginForm.get('email')?.value || '';
    this.resetCode = '';
    this.newPassword = '';
    this.forgotStep = 'request';
    this.forgotMessage = '';
    this.forgotError = '';
  }

  closeForgotPassword(): void {
    this.showForgotPasswordModal = false;
  }

  onRequestResetCode(): void {
    if (!this.forgotEmail || !this.forgotEmail.includes('@')) {
      this.forgotError = 'Please enter a valid email address.';
      return;
    }
    this.forgotLoading = true;
    this.forgotError = '';
    this.forgotMessage = '';

    this.authService.forgotPassword(this.forgotEmail).subscribe({
      next: (res) => {
        this.forgotLoading = false;
        this.forgotStep = 'reset';
        this.resetCode = '';
        this.forgotMessage = res.message || 'A 6-digit verification code has been dispatched to your email address.';
      },
      error: (err) => {
        this.forgotLoading = false;
        this.forgotError = err.error?.message || 'Failed to request reset code.';
      }
    });
  }

  onResetPassword(): void {
    if (!this.resetCode || !this.newPassword) {
      this.forgotError = 'Please enter the verification code and your new password.';
      return;
    }
    if (this.newPassword.length < 6) {
      this.forgotError = 'New password must be at least 6 characters long.';
      return;
    }

    this.forgotLoading = true;
    this.forgotError = '';
    this.forgotMessage = '';

    this.authService.resetPassword({
      email: this.forgotEmail,
      resetCode: this.resetCode,
      newPassword: this.newPassword
    }).subscribe({
      next: (res) => {
        this.forgotLoading = false;
        this.forgotMessage = res.message || 'Password reset successful!';
        setTimeout(() => {
          this.loginForm.patchValue({ email: this.forgotEmail, password: this.newPassword });
          this.closeForgotPassword();
        }, 1500);
      },
      error: (err) => {
        this.forgotLoading = false;
        this.forgotError = err.error?.message || 'Failed to reset password.';
      }
    });
  }
}