import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { DeveloperDashboard } from './pages/developer/developer-dashboard/developer-dashboard';
import { TesterDashboard } from './pages/tester/tester-dashboard/tester-dashboard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: 'auth/login',
    component: Login,
  },
  {
    path: 'auth/register',
    component: Register,
  },
  {
    path: 'developer/dashboard',
    component: DeveloperDashboard,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DEVELOPER'] },
  },
  {
    path: 'tester/dashboard',
    component: TesterDashboard,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['TESTER'] },
  },
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];
