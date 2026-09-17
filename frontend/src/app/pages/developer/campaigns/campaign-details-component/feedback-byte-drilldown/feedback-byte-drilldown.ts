import { Component, computed, effect, inject, input, output } from '@angular/core';
import { Store } from '@ngrx/store';
import { FeedbackType } from '../../../../../core/feedback-bytes/feedback-bytes.models';
import { feedbackBytesActions } from '../../../../../core/feedback-bytes/state/feedback-bytes.actions';
import {
  selectAllFeedbackBytes,
  selectFeedbackBytesError,
  selectFeedbackBytesLoading,
  selectFeedbackBytesLoadingMore,
  selectFeedbackBytesPage,
  selectFeedbackBytesTotal,
  selectFeedbackBytesTotalPages,
} from '../../../../../core/feedback-bytes/state/feedback-bytes.selectors';
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
  private readonly store = inject(Store);

  open = input(false);
  campaignId = input.required<string>();
  type = input<FeedbackType | null>(null);
  fromSeconds = input(0);
  toSeconds = input(0);

  closed = output<void>();

  protected readonly items = this.store.selectSignal(selectAllFeedbackBytes);
  protected readonly page = this.store.selectSignal(selectFeedbackBytesPage);
  protected readonly totalPages = this.store.selectSignal(selectFeedbackBytesTotalPages);
  protected readonly total = this.store.selectSignal(selectFeedbackBytesTotal);
  protected readonly loading = this.store.selectSignal(selectFeedbackBytesLoading);
  protected readonly loadingMore = this.store.selectSignal(selectFeedbackBytesLoadingMore);
  protected readonly errorMessage = this.store.selectSignal(selectFeedbackBytesError);

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

      this.store.dispatch(
        feedbackBytesActions.loadCampaignFeedbackBytes({
          campaignId,
          feedbackType: type,
          fromSeconds,
          toSeconds,
          page: 1,
        }),
      );
    });
  }

  close(): void {
    this.store.dispatch(feedbackBytesActions.feedbackBytesCleared());
    this.closed.emit();
  }

  loadMore(): void {
    const type = this.type();
    if (this.loadingMore() || !type || this.page() >= this.totalPages()) {
      return;
    }

    this.store.dispatch(
      feedbackBytesActions.loadCampaignFeedbackBytes({
        campaignId: this.campaignId(),
        feedbackType: type,
        fromSeconds: this.fromSeconds(),
        toSeconds: this.toSeconds(),
        page: this.page() + 1,
      }),
    );
  }

  private formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}
