import { Component, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CampaignsService } from '../../../../core/campaigns/campaigns.service';
import { ApplicationsService } from '../../../../core/applications/applications.service';
import { PublicCampaignDetails } from '../../../../core/campaigns/campaigns.models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

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

    forkJoin({
      campaign: this.campaignsService.getPublicCampaign(this.campaignId),
      applications: this.applicationsService.getMyApplications(),
    }).subscribe({
      next: ({ campaign, applications }) => {
        this.campaign.set(campaign);

        const existingApplication = applications.find(
          (application) => application.campaignId === this.campaignId,
        );

        if (existingApplication) {
          this.alreadyApplied.set(true);
          this.message = existingApplication.message || '';
          this.successMessage.set('You already applied for this campaign.');
        }

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

        if (error?.status === 409) {
          this.alreadyApplied.set(true);
          this.successMessage.set('You already applied for this campaign.');
          return;
        }

        this.errorMessage.set(
          error?.error?.message || 'Failed to apply for campaign.',
        );
      },
    });
  }
}
