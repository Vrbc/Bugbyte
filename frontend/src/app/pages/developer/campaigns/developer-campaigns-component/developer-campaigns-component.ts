import { Component, OnInit, signal } from '@angular/core';
import { PlaytestCampaign } from '../../../../core/campaigns/campaigns.models';
import { CampaignsService } from '../../../../core/campaigns/campaigns.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-developer-campaigns-component',
  imports: [CommonModule, FormsModule, RouterLink],
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
