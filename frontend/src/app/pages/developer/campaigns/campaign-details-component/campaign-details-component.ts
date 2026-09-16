import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CampaignTimelineStats, PlaytestCampaign } from '../../../../core/campaigns/campaigns.models';
import { CampaignApplication } from '../../../../core/applications/applications.models';
import { CampaignsService } from '../../../../core/campaigns/campaigns.service';
import { ApplicationsService } from '../../../../core/applications/applications.service';
import { debounceTime, forkJoin, Observable, Subscription } from 'rxjs';
import { Card } from '../../../../shared/ui/card/card';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { Button, buttonClasses } from '../../../../shared/ui/button/button';
import { Pagination } from '../../../../shared/ui/pagination/pagination';
import { SessionSocketService } from '../../../../core/realtime/session-socket.service';
import { CampaignTimeline } from './campaign-timeline/campaign-timeline';
import { ConfirmDialog } from '../../../../shared/ui/confirm-dialog/confirm-dialog';

type PendingCampaignAction = 'complete' | 'archive';

@Component({
  selector: 'app-campaign-details-component',
  imports: [RouterLink, Card, StatusBadge, Button, Pagination, CampaignTimeline, ConfirmDialog],
  templateUrl: './campaign-details-component.html',
  styleUrl: './campaign-details-component.scss',
})
export class CampaignDetailsComponent implements OnInit, OnDestroy {
  campaign = signal<PlaytestCampaign | null>(null);
  applications = signal<CampaignApplication[]>([]);
  timeline = signal<CampaignTimelineStats | null>(null);

  loading = signal(true);
  errorMessage = signal<string | null>(null);
  actionMessage = signal<string | null>(null);
  updatingApplicationId = signal<string | null>(null);
  campaignActionInProgress = signal(false);
  pendingAction = signal<PendingCampaignAction | null>(null);

  page = signal(1);
  totalPages = signal(1);
  total = signal(0);

  protected readonly primaryLinkClasses = buttonClasses('primary');
  protected readonly secondaryLinkClasses = buttonClasses('secondary');

  campaignId = '';
  private readonly socketSubscriptions = new Subscription();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly campaignsService: CampaignsService,
    private readonly applicationService: ApplicationsService,
    private readonly sessionSocket: SessionSocketService,
  ) {}

  ngOnInit() : void {
    this.campaignId = this.route.snapshot.paramMap.get('id') || '';
    this.loadPage(1);
    this.connectToLiveUpdates();
  }

  ngOnDestroy(): void {
    this.socketSubscriptions.unsubscribe();
    this.sessionSocket.leaveCampaignTimeline(this.campaignId);
  }

  private connectToLiveUpdates(): void {
    this.sessionSocket.joinCampaignTimeline(this.campaignId);

    this.socketSubscriptions.add(
      this.sessionSocket
        .onCampaignTimelineChanged()
        .pipe(debounceTime(2500))
        .subscribe(() => this.reloadTimeline()),
    );

    this.socketSubscriptions.add(
      this.sessionSocket.onReconnect().subscribe(() => {
        this.sessionSocket.joinCampaignTimeline(this.campaignId);
        this.reloadTimeline();
      }),
    );
  }

  private reloadTimeline(): void {
    this.campaignsService.getCampaignTimeline(this.campaignId).subscribe({
      next: (timeline) => this.timeline.set(timeline),
      error: () => this.errorMessage.set('Failed to refresh campaign timeline.'),
    });
  }

  loadPage(page: number) : void {
    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      campaign: this.campaignsService.getCampaign(this.campaignId),
      applications: this.applicationService.getApplicationsForCampaign(this.campaignId, page),
      timeline: this.campaignsService.getCampaignTimeline(this.campaignId),
    }).subscribe({
      next: ({campaign, applications, timeline}) => {
        this.campaign.set(campaign);
        this.applications.set(applications.items);
        this.page.set(applications.page);
        this.totalPages.set(applications.totalPages);
        this.total.set(applications.total);
        this.timeline.set(timeline);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set('Failed to load campaign details');
        this.loading.set(false);
      },
    });
  }

  publishCampaign(): void {
    this.runCampaignAction(this.campaignsService.publishCampaign(this.campaignId), 'Campaign published.');
  }

  pauseCampaign(): void {
    this.runCampaignAction(this.campaignsService.pauseCampaign(this.campaignId), 'Campaign paused.');
  }

  resumeCampaign(): void {
    this.runCampaignAction(this.campaignsService.resumeCampaign(this.campaignId), 'Campaign resumed.');
  }

  completeCampaign(): void {
    this.pendingAction.set('complete');
  }

  archiveCampaign(): void {
    this.pendingAction.set('archive');
  }

  confirmPendingAction(): void {
    const action = this.pendingAction();
    this.pendingAction.set(null);

    if (action === 'complete') {
      this.runCampaignAction(this.campaignsService.completeCampaign(this.campaignId), 'Campaign completed.');
    } else if (action === 'archive') {
      this.runCampaignAction(this.campaignsService.archiveCampaign(this.campaignId), 'Campaign archived.');
    }
  }

  private runCampaignAction(action$: Observable<PlaytestCampaign>, successMessage: string): void {
    this.errorMessage.set(null);
    this.actionMessage.set(null);
    this.campaignActionInProgress.set(true);

    action$.subscribe({
      next: () => {
        this.campaignActionInProgress.set(false);
        this.actionMessage.set(successMessage);
        this.loadPage(this.page());
      },
      error: (error) => {
        this.campaignActionInProgress.set(false);
        this.errorMessage.set(error?.error?.message || 'Failed to update campaign.');
      },
    });
  }

  acceptApplication(application: CampaignApplication): void {
    this.updateStatus(application, 'ACCEPTED');
  }

  rejectApplication(application: CampaignApplication): void {
    this.updateStatus(application, 'REJECTED');
  }

  private updateStatus(
    application : CampaignApplication,
    status: 'ACCEPTED' | 'REJECTED',
  ): void {
    this.actionMessage.set(null);
    this.updatingApplicationId.set(application.id);

    this.applicationService.updateApplicationStatus(application.id, {
      status,
    }).subscribe({
      next: () => {
        this.updatingApplicationId.set(null);
        this.actionMessage.set(`Application ${status.toLocaleLowerCase()}.`);
        this.reloadApplications();
      },
      error: (error) => {
        this.updatingApplicationId.set(null);
        this.errorMessage.set(
          error?.error?.message || 'Failed to update application.',
        );
      },
    })
  }
  private reloadApplications(): void {
    this.applicationService.getApplicationsForCampaign(this.campaignId, this.page()).subscribe({
      next: (applications) => {
        this.applications.set(applications.items);
        this.page.set(applications.page);
        this.totalPages.set(applications.totalPages);
        this.total.set(applications.total);
      },
      error: () => this.errorMessage.set('Failed to reload applications.'),
    });
  }

}
