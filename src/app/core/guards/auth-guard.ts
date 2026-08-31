import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../features/auth/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  // Check if token exists
  const token = authService.getAccessToken();
  
  if (token) {
    // Check if route has role requirements
    const expectedRoles = route.data['roles'] as Array<string>;
    
    if (expectedRoles && expectedRoles.length > 0) {
      const hasRequiredRole = authService.hasAnyRole(expectedRoles);
      if (!hasRequiredRole) {
        return router.parseUrl('/home'); // Or a forbidden page if one exists
      }
    }
    
    return true;
  }
  
  return router.parseUrl('/login');
};