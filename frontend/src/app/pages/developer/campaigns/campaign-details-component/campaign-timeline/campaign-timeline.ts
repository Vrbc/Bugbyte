import { Component, computed, input, signal } from '@angular/core';
import { CampaignTimelineBucket, CampaignTimelineStats } from '../../../../../core/campaigns/campaigns.models';
import { FeedbackType } from '../../../../../core/feedback-bytes/feedback-bytes.models';
import { StatusBadge } from '../../../../../shared/ui/status-badge/status-badge';
import { FeedbackByteDrilldown } from '../feedback-byte-drilldown/feedback-byte-drilldown';

interface PendingDrilldown {
  type: FeedbackType;
  fromSeconds: number;
  toSeconds: number;
}

const ALL_FEEDBACK_TYPES: FeedbackType[] = [
  'BUG',
  'DIFFICULTY_SPIKE',
  'POSITIVE',
  'CONFUSION',
  'SUGGESTION',
  'COMMENT',
];

const TYPE_LABELS: Record<FeedbackType, string> = {
  BUG: 'Bug',
  CONFUSION: 'Confused',
  SUGGESTION: 'Suggestion',
  POSITIVE: 'Positive',
  DIFFICULTY_SPIKE: 'Difficulty spike',
  COMMENT: 'Comment',
};

const COLOR_TOKENS: Record<FeedbackType, string> = {
  BUG: 'bug',
  CONFUSION: 'confused',
  SUGGESTION: 'purple',
  POSITIVE: 'positive',
  DIFFICULTY_SPIKE: 'warning',
  COMMENT: 'on-surface-variant',
};

const MIN_CELL_OPACITY = 0.08;
const NO_DATA_OPACITY = 0.05;

@Component({
  selector: 'app-campaign-timeline',
  imports: [StatusBadge, FeedbackByteDrilldown],
  templateUrl: './campaign-timeline.html',
  styleUrl: './campaign-timeline.scss',
})
export class CampaignTimeline {
  stats = input<CampaignTimelineStats | null>(null);
  campaignId = input.required<string>();

  protected readonly feedbackTypes = ALL_FEEDBACK_TYPES;

  protected readonly pendingDrilldown = signal<PendingDrilldown | null>(null);

  protected onCellClick(bucket: CampaignTimelineBucket, type: FeedbackType): void {
    const bucketSeconds = this.stats()?.bucketSeconds ?? 0;
    this.pendingDrilldown.set({
      type,
      fromSeconds: bucket.bucketStart,
      toSeconds: bucket.bucketStart + bucketSeconds,
    });
  }

  protected closeDrilldown(): void {
    this.pendingDrilldown.set(null);
  }

  protected readonly gridTemplateColumns = computed(() => {
    const bucketCount = this.stats()?.buckets.length ?? 0;
    return `minmax(130px,auto) repeat(${bucketCount}, minmax(44px,1fr))`;
  });

  protected cellBgClass(type: FeedbackType): string {
    return `bg-${COLOR_TOKENS[type]}`;
  }

  protected cellOpacity(bucket: CampaignTimelineBucket, type: FeedbackType): number {
    if (bucket.activeTesterCount === 0) {
      return NO_DATA_OPACITY;
    }

    const share = (bucket.byTypeTesterCount[type] ?? 0) / bucket.activeTesterCount;
    return Math.max(MIN_CELL_OPACITY, share);
  }

  protected cellTooltip(bucket: CampaignTimelineBucket, type: FeedbackType): string {
    const time = this.formatBucketTime(bucket.bucketStart);

    if (bucket.activeTesterCount === 0) {
      return `${time} — no active testers yet`;
    }

    const count = bucket.byTypeTesterCount[type] ?? 0;
    const percent = Math.round((count / bucket.activeTesterCount) * 100);
    return `${time} — ${count}/${bucket.activeTesterCount} testers (${percent}%) reported ${TYPE_LABELS[type]}`;
  }

  protected formatRating(value: number | null | undefined): string {
    return value != null ? value.toFixed(1) : '—';
  }

  protected formatDuration(seconds: number | null | undefined): string {
    if (!seconds) {
      return '—';
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  }

  protected formatBucketTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}
