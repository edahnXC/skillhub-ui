import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnInit, OnDestroy {
  isLoggedIn = false;
  userName = '';
  canCreateCourse = false;
  isAdmin = false;
  isStudent = false;
  mobileMenuOpen = false;
  scrolled = false;

  userDropdownOpen = false;

  private authSubscription!: Subscription;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.authSubscription = this.authService.isLoggedIn$.subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
    });

    this.authService.currentRoles$.subscribe(roles => {
      if (Array.isArray(roles)) {
        this.canCreateCourse = roles.includes('Instructor');
        this.isAdmin = roles.includes('SuperAdmin') || roles.includes('SubAdmin') || roles.includes('ProductSupport');
        this.isStudent = roles.includes('Student');
      } else {
        this.canCreateCourse = false;
        this.isAdmin = false;
        this.isStudent = false;
      }
    });

    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userName = user.fullName || user.email || 'User';
      } else {
        this.userName = '';
      }
    });

    // Close mobile menu and user dropdown on every navigation
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.mobileMenuOpen = false;
        this.userDropdownOpen = false;
      });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleUserDropdown(): void {
    this.userDropdownOpen = !this.userDropdownOpen;
  }

  closeUserDropdown(): void {
    this.userDropdownOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.mobileMenuOpen = false;
    this.userDropdownOpen = false;
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 10;
  }
}
