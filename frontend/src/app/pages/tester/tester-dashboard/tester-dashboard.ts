import { Component, signal } from '@angular/core';
import { DashboardService } from '../../../core/dashboard/dashboard.service';
import {
  TesterDashboard as TesterDashboardModel,
} from '../../../core/dashboard/dashboard.models';

@Component({
  selector: 'app-tester-dashboard',
  imports: [],
  templateUrl: './tester-dashboard.html',
  styleUrl: './tester-dashboard.scss',
})
export class TesterDashboard {
  dashboard = signal<TesterDashboardModel | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  constructor(private readonly dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getTesterDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load tester dashboard.');
        this.loading.set(false);
      },
    });
  }
}
