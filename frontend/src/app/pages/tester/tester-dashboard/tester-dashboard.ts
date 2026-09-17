import { Component, signal } from '@angular/core';
import { DashboardService } from '../../../core/dashboard/dashboard.service';
import {
  TesterDashboard as TesterDashboardModel,
} from '../../../core/dashboard/dashboard.models';
import { Card } from '../../../shared/ui/card/card';
import { StatTile } from '../../../shared/ui/stat-tile/stat-tile';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { LoadingSpinner } from '../../../shared/ui/loading-spinner/loading-spinner';
import { campaignTypeLabel } from '../../../core/campaigns/campaigns.models';

@Component({
  selector: 'app-tester-dashboard',
  imports: [Card, StatTile, StatusBadge, LoadingSpinner],
  templateUrl: './tester-dashboard.html',
  styleUrl: './tester-dashboard.scss',
})
export class TesterDashboard {
  dashboard = signal<TesterDashboardModel | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  protected readonly campaignTypeLabel = campaignTypeLabel;

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
