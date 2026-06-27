import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from './auth.models';
import { catchError, map, of } from 'rxjs';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as UserRole[];
  const authorize = (role: UserRole) => {
    if (allowedRoles.includes(role)) {
      return true;
    }

    const dashboard =
      role === 'DEVELOPER'
        ? '/developer/dashboard'
        : role === 'TESTER'
          ? '/tester/dashboard'
          : '/auth/login';

    return router.createUrlTree([dashboard]);
  };

  const currentUser = authService.currentUser();
  if (currentUser) {
    return authorize(currentUser.role);
  }

  return authService.loadCurrentUser().pipe(
    map((user) => authorize(user.role)),
    catchError(() => {
      authService.logout();
      return of(false);
    }),
  );
};
