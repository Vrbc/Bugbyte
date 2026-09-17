import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Button } from '../../shared/ui/button/button';
import { Logo } from '../../shared/ui/logo/logo';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const DEVELOPER_NAV: NavItem[] = [
  { path: '/developer/dashboard', label: 'Dashboard', icon: 'space_dashboard' },
  { path: '/developer/games', label: 'My Games', icon: 'sports_esports' },
  { path: '/developer/campaigns', label: 'Campaigns', icon: 'campaign' },
];

const TESTER_NAV: NavItem[] = [
  { path: '/tester/dashboard', label: 'Dashboard', icon: 'space_dashboard' },
  { path: '/tester/campaigns', label: 'Discover Tests', icon: 'travel_explore' },
  { path: '/tester/applications', label: 'My Applications', icon: 'assignment_turned_in' },
  { path: '/tester/sessions', label: 'My Sessions', icon: 'timeline' },
];

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Button, Logo],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss',
})
export class DashboardLayout {
  readonly authService = inject(AuthService);

  protected readonly navItems = computed<NavItem[]>(() => {
    const role = this.authService.currentUser()?.role;
    if (role === 'DEVELOPER') return DEVELOPER_NAV;
    if (role === 'TESTER') return TESTER_NAV;
    return [];
  });

  logout(): void {
    this.authService.logout();
  }
}
