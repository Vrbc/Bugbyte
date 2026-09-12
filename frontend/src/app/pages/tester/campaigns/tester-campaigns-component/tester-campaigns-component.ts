import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { CampaignsService } from '../../../../core/campaigns/campaigns.service';
import { PublicCampaign } from '../../../../core/campaigns/campaigns.models';
import { ResolveUploadUrlPipe } from '../../../../core/uploads/resolve-upload-url.pipe';
import { Card } from '../../../../shared/ui/card/card';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { buttonClasses } from '../../../../shared/ui/button/button';
import { Pagination } from '../../../../shared/ui/pagination/pagination';
import { Input } from '../../../../shared/ui/input/input';

@Component({
  selector: 'app-tester-campaigns-component',
  imports: [FormsModule, RouterLink, ResolveUploadUrlPipe, Card, StatusBadge, Pagination, Input],
  templateUrl: './tester-campaigns-component.html',
  styleUrl: './tester-campaigns-component.scss',
})
export class TesterCampaignsComponent implements OnInit, OnDestroy {
  campaigns = signal<PublicCampaign[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  searchTerm = signal('');
  selectedPlatform = signal('');

  page = signal(1);
  totalPages = signal(1);
  total = signal(0);

  platforms = ['PC', 'Web', 'Android', 'iOS'];

  protected readonly primaryLinkClasses = buttonClasses('primary');

  private readonly filterChanged = new Subject<void>();
  private filterSubscription?: Subscription;

  constructor(private readonly campaignsService: CampaignsService) {}

  ngOnInit(): void {
    this.filterSubscription = this.filterChanged
      .pipe(debounceTime(300))
      .subscribe(() => this.loadCampaigns(1));

    this.loadCampaigns(1);
  }

  ngOnDestroy(): void {
    this.filterSubscription?.unsubscribe();
  }

  loadCampaigns(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.campaignsService
      .getPublicCampaigns(
        page,
        20,
        this.searchTerm().trim() || undefined,
        this.selectedPlatform() || undefined,
      )
      .subscribe({
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

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
    this.filterChanged.next();
  }

  setSelectedPlatform(value: string): void {
    this.selectedPlatform.set(value);
    this.filterChanged.next();
  }
}
