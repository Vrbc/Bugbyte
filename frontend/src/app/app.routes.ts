import { RouteConfigLoadStart, Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
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
      {
        path: 'games',
        component: DeveloperGamesComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['DEVELOPER'],
        }
      },
      {
        path: 'games/new',
        component: CreateGameComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['DEVELOPER'],
        },
      },
      {
        path: 'games/:id/edit',
        component: EditGameComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['DEVELOPER'],
        },
      },
      {
        path: 'games/:id',
        component: GameDetailsComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['DEVELOPER'],
        },
      },
      {
        path: 'campaigns',
        component: DeveloperCampaignsComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['DEVELOPER'],
        },
      },
      {
        path: 'campaigns/new',
        component: CreateCampaignComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['DEVELOPER'],
        },
      },
      {
        path: 'campaigns/:id/edit',
        component: EditCampaignComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['DEVELOPER'],
        },
      },
      {
        path: 'sessions/:id/review',
        component: DeveloperSessionReviewComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['DEVELOPER'],
        },
      },
      {
        path: 'campaigns/:id',
        component: CampaignDetailsComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['DEVELOPER'],
        }
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
        path: 'campaigns',
        component: TesterCampaignsComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['TESTER'],
        },
      },
      {
        path: 'campaigns/:id',
        component: TesterCampaignsDetailsComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['TESTER'],
        },
      },
      {
        path: 'applications',
        component: TesterApplicationsComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['TESTER'],
        },
      },
      {
        path: 'sessions',
        component: TesterSessionsComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['TESTER'],
        },
      },
      {
        path: 'sessions/:id/live',
        component: ActiveSessionComponent,
        canActivate: [roleGuard],
        data: {
          roles: ['TESTER'],
        },
      },
      
    ],
  },
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];
