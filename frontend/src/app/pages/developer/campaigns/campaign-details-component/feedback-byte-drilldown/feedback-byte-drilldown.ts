import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FeedbackByte, FeedbackType } from '../../../../../core/feedback-bytes/feedback-bytes.models';
import { FeedbackBytesService } from '../../../../../core/feedback-bytes/feedback-bytes.service';
import { Button } from '../../../../../shared/ui/button/button';
import { FeedbackByteItem } from '../../../../../shared/ui/feedback-byte-item/feedback-byte-item';
import { StatusBadge } from '../../../../../shared/ui/status-badge/status-badge';

@Component({
  selector: 'app-feedback-byte-drilldown',
  imports: [Button, FeedbackByteItem, StatusBadge],
  templateUrl: './feedback-byte-drilldown.html',
  styleUrl: './feedback-byte-drilldown.scss',
})
export class FeedbackByteDrilldown {
  private readonly feedbackBytesService = inject(FeedbackBytesService);

  open = input(false);
  campaignId = input.required<string>();
  type = input<FeedbackType | null>(null);
  fromSeconds = input(0);
  toSeconds = input(0);

  closed = output<void>();

  protected readonly items = signal<FeedbackByte[]>([]);
  protected readonly page = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly loadingMore = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly formattedRange = computed(
    () => `${this.formatTime(this.fromSeconds())}–${this.formatTime(this.toSeconds())}`,
  );

  constructor() {
    effect(() => {
      const isOpen = this.open();
      const campaignId = this.campaignId();
      const type = this.type();
      const fromSeconds = this.fromSeconds();
      const toSeconds = this.toSeconds();

      if (!isOpen || !type) {
        return;
      }

      this.fetchPage(campaignId, type, fromSeconds, toSeconds, 1);
    });
  }

  close(): void {
    this.closed.emit();
  }

  loadMore(): void {
    const type = this.type();
    if (this.loadingMore() || !type || this.page() >= this.totalPages()) {
      return;
    }

    this.fetchPage(this.campaignId(), type, this.fromSeconds(), this.toSeconds(), this.page() + 1);
  }

  private fetchPage(
    campaignId: string,
    type: FeedbackType,
    fromSeconds: number,
    toSeconds: number,
    page: number,
  ): void {
    if (page === 1) {
      this.loading.set(true);
    } else {
      this.loadingMore.set(true);
    }
    this.errorMessage.set(null);

    this.feedbackBytesService
      .getFeedbackBytesForCampaign(campaignId, type, fromSeconds, toSeconds, page)
      .subscribe({
        next: (result) => {
          this.items.update((items) => (page === 1 ? result.items : [...items, ...result.items]));
          this.page.set(result.page);
          this.totalPages.set(result.totalPages);
          this.total.set(result.total);
          this.loading.set(false);
          this.loadingMore.set(false);
        },
        error: () => {
          this.errorMessage.set('Failed to load feedback.');
          this.loading.set(false);
          this.loadingMore.set(false);
        },
      });
  }

  private formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}
