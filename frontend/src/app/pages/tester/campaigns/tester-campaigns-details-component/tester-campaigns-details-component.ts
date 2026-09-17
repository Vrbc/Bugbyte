import { Component, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CampaignsService } from '../../../../core/campaigns/campaigns.service';
import { ApplicationsService } from '../../../../core/applications/applications.service';
import { PublicCampaignDetails } from '../../../../core/campaigns/campaigns.models';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ResolveUploadUrlPipe } from '../../../../core/uploads/resolve-upload-url.pipe';
import { Card } from '../../../../shared/ui/card/card';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { Button, buttonClasses } from '../../../../shared/ui/button/button';
import { Input } from '../../../../shared/ui/input/input';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';

@Component({
  selector: 'app-tester-campaigns-details-component',
  imports: [FormsModule, RouterLink, ResolveUploadUrlPipe, Card, StatusBadge, Button, Input, LoadingSpinner],
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

  protected readonly secondaryLinkClasses = buttonClasses('secondary');

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
      application: this.applicationsService.getMyApplicationForCampaign(this.campaignId),
    }).subscribe({
      next: ({ campaign, application }) => {
        this.campaign.set(campaign);

        if (application && application.status !== 'CANCELLED') {
          this.alreadyApplied.set(true);
          this.message = application.message || '';
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
