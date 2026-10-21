import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
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
  isOnlyProductSupport = false;

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.currentRoles$.subscribe(roles => {
      if (Array.isArray(roles)) {
        this.isSuperAdmin = roles.includes('SuperAdmin');
        this.isOnlyProductSupport = roles.includes('ProductSupport') && !roles.includes('SuperAdmin') && !roles.includes('SubAdmin');
        if (this.isOnlyProductSupport) {
          if (this.router.url === '/admin' || this.router.url === '/admin/users') {
            this.router.navigate(['/admin/support']);
          }
        }
      } else {
        this.isSuperAdmin = false;
        this.isOnlyProductSupport = false;
      }
    });
  }
}
