import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Navbar } from './layout/navbar/navbar';

/** Routes where the navbar should be hidden (full-screen auth pages) */
const AUTH_ROUTES = ['/login', '/register'];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  showNavbar = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Initialise from the current URL (handles hard refreshes / direct links)
    this.updateNavbarVisibility(this.router.url);

    // Update on every subsequent navigation
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.updateNavbarVisibility(e.urlAfterRedirects);
      });
  }

  private updateNavbarVisibility(url: string): void {
    this.showNavbar = !AUTH_ROUTES.some(r => url.startsWith(r));
  }
}
