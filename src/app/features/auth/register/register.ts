import { Component } from '@angular/core';
import {RouterLink} from '@angular/router'
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone:true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  registerForm:FormGroup;
  errorMessage = '';
  isSubmitting = false;
  showPassword = false;

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  constructor(
    private fb:FormBuilder,
    private router:Router,
    private authService:AuthService){
      this.registerForm=this.fb.group({
        firstName:[
          '',
          Validators.required
        ],
        lastName:[
            '',
            Validators.required
        ],
        email:[
              '',
              [Validators.required,Validators.email]

        ],
        password:[
              '',
          [
                Validators.required,
                Validators.minLength(6)
          ]
        ],
        confirmPassword:[
          '',
          Validators.required
        ]


      });
    }

   register(): void {

  if (this.registerForm.invalid)
    return;

  this.errorMessage = '';
  this.isSubmitting = true;

  this.authService
    .register(this.registerForm.value)
    .subscribe({
      next: response => {

        console.log('SUCCESS');

        console.log(response);

        this.router.navigate(
          ['/home']
        );
      },

      error: error => {

        console.error(error);

        this.isSubmitting = false;
        this.errorMessage = 'Registration failed. This email may already be in use.';
      }
    });
}
}
//barrier token swagger
//base entity me isdelete 