import { Component } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
}
from '@angular/forms';

import { Router, RouterLink } from '@angular/router';

import { AuthService }
from '../services/auth.service';

@Component({
  selector:'app-login',
  standalone:true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl:'./login.html',
  styleUrl: './login.scss'
})
export class Login
{
  loginForm:FormGroup;
  errorMessage = '';
  isSubmitting = false;
  showPassword = false;

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
}