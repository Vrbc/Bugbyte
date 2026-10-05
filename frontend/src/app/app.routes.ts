import { RouteConfigLoadStart, Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { Landing } from './pages/landing/landing/landing';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { DeveloperDashboard } from './pages/developer/developer-dashboard/developer-dashboard';
import { TesterDashboard } from './pages/tester/tester-dashboard/tester-dashboard';
import { DashboardLayout } from './layout/dashboard-layout/dashboard-layout';
import { DeveloperGamesComponent } from './pages/developer/games/developer-games-component/developer-games-component';
import { CreateGameComponent } from './pages/developer/games/create-game-component/create-game-component';
import { GameDetailsComponent } from './pages/developer/games/game-details-component/game-details-component';
import { DeveloperCampaignsComponent } from './pages/developer/campaigns/developer-campaigns-component/developer-campaigns-component';
import { CreateCampaignComponent } from './pages/developer/campaigns/create-campaign-component/create-campaign-component';
import { CampaignDetailsComponent } from './pages/developer/campaigns/campaign-details-component/campaign-details-component';
import { TesterCampaignsComponent } from './pages/tester/campaigns/tester-campaigns-component/tester-campaigns-component';
import { TesterCampaignsDetailsComponent } from './pages/tester/campaigns/tester-campaigns-details-component/tester-campaigns-details-component';
import { TesterApplicationsComponent } from './pages/tester/applications/tester-applications-component/tester-applications-component';
import { ActiveSessionComponent } from './pages/tester/applications/active-session-component/active-session-component';
import { DeveloperSessionReviewComponent } from './pages/developer/sessions/developer-session-review-component/developer-session-review-component';
import { TesterSessionsComponent } from './pages/tester/sessions/tester-sessions-component/tester-sessions-component';
import { EditGameComponent } from './pages/developer/games/edit-game-component/edit-game-component';
import { EditCampaignComponent } from './pages/developer/campaigns/edit-campaign-component/edit-campaign-component';
import { AdminUsersComponent } from './pages/admin/users/admin-users-component/admin-users-component';
import { AccountComponent } from './pages/account/account-component/account-component';

export const routes: Routes = [
  {
    path: '',
    component: Landing,
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
      {
        path: 'account',
        component: AccountComponent,
      },
      {
        path: 'games',
        component: DeveloperGamesComponent,
      },
      {
        path: 'games/new',
        component: CreateGameComponent,
      },
      {
        path: 'games/:id/edit',
        component: EditGameComponent,
      },
      {
        path: 'games/:id',
        component: GameDetailsComponent,
      },
      {
        path: 'campaigns',
        component: DeveloperCampaignsComponent,
      },
      {
        path: 'campaigns/new',
        component: CreateCampaignComponent,
      },
      {
        path: 'campaigns/:id/edit',
        component: EditCampaignComponent,
      },
      {
        path: 'sessions/:id/review',
        component: DeveloperSessionReviewComponent,
      },
      {
        path: 'campaigns/:id',
        component: CampaignDetailsComponent,
      }
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
      {
        path: 'account',
        component: AccountComponent,
      },
      {
        path: 'campaigns',
        component: TesterCampaignsComponent,
      },
      {
        path: 'campaigns/:id',
        component: TesterCampaignsDetailsComponent,
      },
      {
        path: 'applications',
        component: TesterApplicationsComponent,
      },
      {
        path: 'sessions',
        component: TesterSessionsComponent,
      },
      {
        path: 'sessions/:id/live',
        component: ActiveSessionComponent,
      },
      
    ],
  },
  {
    path: 'admin',
    component: DashboardLayout,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'users',
      },
      {
        path: 'dashboard',
        redirectTo: 'users',
      },
      {
        path: 'users',
        component: AdminUsersComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
