import { Component, OnInit, signal } from '@angular/core';
import { DashboardService } from '../../../core/dashboard/dashboard.service';
import {
  DeveloperDashboard as DeveloperDashboardModel,
} from '../../../core/dashboard/dashboard.models';

@Component({
  selector: 'app-developer-dashboard',
  imports: [],
  templateUrl: './developer-dashboard.html',
  styleUrl: './developer-dashboard.scss',
})
export class DeveloperDashboard implements OnInit {
  dashboard = signal<DeveloperDashboardModel | null>(null);
   loading = signal(true);
  errorMessage = signal<string | null>(null);

  constructor(private readonly dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getDeveloperDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load developer dashboard.');
        this.loading.set(false);
      },
    });
  }
}
