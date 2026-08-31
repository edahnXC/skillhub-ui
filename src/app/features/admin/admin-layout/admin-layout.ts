import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/services/auth.service';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, HasPermissionDirective],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss'
})
export class AdminLayout implements OnInit {
  isSuperAdmin = false;

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentRoles$.subscribe(roles => {
      if (Array.isArray(roles)) {
        this.isSuperAdmin = roles.includes('SuperAdmin');
      } else {
        this.isSuperAdmin = false;
      }
    });
  }
}
