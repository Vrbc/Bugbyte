import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { DeveloperDashboard } from './pages/developer/developer-dashboard/developer-dashboard';
import { TesterDashboard } from './pages/tester/tester-dashboard/tester-dashboard';
import { DashboardLayout } from './layout/dashboard-layout/dashboard-layout';

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
    path: 'developer',
    component: DashboardLayout,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DEVELOPER'] },
    children: [
      {
        path: 'dashboard',
        component: DeveloperDashboard,
      },
    ],
  },
  {
    path: 'tester',
    component: DashboardLayout,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['TESTER'] },
    children: [
      {
        path: 'dashboard',
        component: TesterDashboard,
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];
