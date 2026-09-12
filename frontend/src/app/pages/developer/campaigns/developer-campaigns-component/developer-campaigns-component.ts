import { Component, OnInit, signal } from '@angular/core';
import { PlaytestCampaign } from '../../../../core/campaigns/campaigns.models';
import { CampaignsService } from '../../../../core/campaigns/campaigns.service';
import { RouterLink } from '@angular/router';
import { Card } from '../../../../shared/ui/card/card';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { Button, buttonClasses } from '../../../../shared/ui/button/button';
import { Pagination } from '../../../../shared/ui/pagination/pagination';

@Component({
  selector: 'app-developer-campaigns-component',
  imports: [RouterLink, Card, StatusBadge, Button, Pagination],
  templateUrl: './developer-campaigns-component.html',
  styleUrl: './developer-campaigns-component.scss',
})
export class DeveloperCampaignsComponent implements OnInit {
  campaigns = signal<PlaytestCampaign[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  page = signal(1);
  totalPages = signal(1);
  total = signal(0);

  protected readonly primaryLinkClasses = buttonClasses('primary');
  protected readonly secondaryLinkClasses = buttonClasses('secondary');

  constructor(private readonly campaignsService: CampaignsService) {}

  ngOnInit(): void {
    this.loadCampaigns(1);
  }

  loadCampaigns(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.campaignsService.getMyCampaigns(page).subscribe({
      next: (result) => {
        this.campaigns.set(result.items);
        this.page.set(result.page);
        this.totalPages.set(result.totalPages);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load campaigns.');
        this.loading.set(false);
      },
    });
  }

  archiveCampaign(campaign: PlaytestCampaign): void {
    const confirmed = confirm(`Archive "${campaign.title}"?`);

    if (!confirmed) {
      return;
    }

    this.campaignsService.archiveCampaign(campaign.id).subscribe({
      next: () => this.loadCampaigns(this.page()),
      error: () => this.errorMessage.set('Failed to archive campaign.'),
    });
  }
}
