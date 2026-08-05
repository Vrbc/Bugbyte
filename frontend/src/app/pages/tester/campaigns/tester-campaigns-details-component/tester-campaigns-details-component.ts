import { Component, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CampaignsService } from '../../../../core/campaigns/campaigns.service';
import { ApplicationsService } from '../../../../core/applications/applications.service';
import { PublicCampaignDetails } from '../../../../core/campaigns/campaigns.models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tester-campaigns-details-component',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tester-campaigns-details-component.html',
  styleUrl: './tester-campaigns-details-component.scss',
})
export class TesterCampaignsDetailsComponent {
  campaign = signal<PublicCampaignDetails | null>(null);
  loading = signal(true);
  applying = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  message = '';
  alreadyApplied = signal(false);

  private campaignId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly campaignsService: CampaignsService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  ngOnInit(): void {
    this.campaignId = this.route.snapshot.paramMap.get('id') || '';

    this.campaignsService.getPublicCampaign(this.campaignId).subscribe({
      next: (campaign) => {
        this.campaign.set(campaign);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load campaign.');
        this.loading.set(false);
      },
    });
  }

  apply(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.applying.set(true);

    this.applicationsService.applyToCampaign(
      this.campaignId,
      this.message || undefined,
    ).subscribe({
      next: () => {
        this.applying.set(false);
        this.alreadyApplied.set(true);
        this.successMessage.set('Application sent. Waiting for developer approval.');
      },
      error: (error) => {
        this.applying.set(false);
        this.errorMessage.set(
          error?.error?.message || 'Failed to apply for campaign.',
        );
      },
    });
  }
}
