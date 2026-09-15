import { Component, OnInit, signal } from '@angular/core';
import { CampaignApplication } from '../../../../core/applications/applications.models';
import { ApplicationsService } from '../../../../core/applications/applications.service';
import { SessionsService } from '../../../../core/sessions/sessions.service';
import { Router } from '@angular/router';
import { ResolveUploadUrlPipe } from '../../../../core/uploads/resolve-upload-url.pipe';
import { Card } from '../../../../shared/ui/card/card';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { Button } from '../../../../shared/ui/button/button';
import { Pagination } from '../../../../shared/ui/pagination/pagination';
import { ConfirmDialog } from '../../../../shared/ui/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-tester-applications-component',
  imports: [ResolveUploadUrlPipe, Card, StatusBadge, Button, Pagination, ConfirmDialog],
  templateUrl: './tester-applications-component.html',
  styleUrl: './tester-applications-component.scss',
})
export class TesterApplicationsComponent implements OnInit {

  applications = signal<CampaignApplication[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);
  startingApplicationId = signal<string | null>(null);
  pendingCancel = signal<CampaignApplication | null>(null);

  page = signal(1);
  totalPages = signal(1);
  total = signal(0);

  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly sessionsService: SessionsService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadApplications(1);
  }

  loadApplications(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.applicationsService.getMyApplications(page).subscribe({
      next: (result) => {
        this.applications.set(result.items);
        this.page.set(result.page);
        this.totalPages.set(result.totalPages);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load applications.');
        this.loading.set(false);
      },
    });
  }
  goToCampaign(application: CampaignApplication): void {
    this.router.navigate(['/tester/campaigns', application.campaignId]);
  }

  //TODO: Dodaj 'Open build' dugme samo na accepted prijave

  cancelApplication(application: CampaignApplication): void {
    this.pendingCancel.set(application);
  }

  confirmCancel(): void {
    const application = this.pendingCancel();
    if (!application) {
      return;
    }

    this.pendingCancel.set(null);
    this.errorMessage.set(null);

    this.applicationsService.cancelApplication(application.id).subscribe({
      next: () => this.loadApplications(this.page()),
      error: (error) => {
        this.errorMessage.set(
          error?.error?.message || 'Failed to cancel application.',
        );
      },
    });
  }

  startSession(application: CampaignApplication) : void {
    this.errorMessage.set(null);
    this.startingApplicationId.set(application.id);

    this.sessionsService.startSession(application.id).subscribe({
      next: (session) => {
        this.startingApplicationId.set(null);
        this.router.navigate(['/tester/sessions', session.id, 'live']);
      },
      error: (error) => {
        this.errorMessage.set(
          error?.error?.message || 'Failed to start session',
        );
      },
    });
  }
}
