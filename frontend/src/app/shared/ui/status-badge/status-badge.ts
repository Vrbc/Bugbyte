import { Component, computed, input } from '@angular/core';
import { FeedbackType } from '../../../core/feedback-bytes/feedback-bytes.models';

export type StatusBadgeStatus = FeedbackType | 'LIVE' | 'PENDING' | 'DECLINED' | 'ALPHA';

interface StatusStyle {
  label: string;
  classes: string;
}

// DIFFICULTY_SPIKE and COMMENT have no Stitch mockup reference — colors extrapolated
// (warning-amber and a neutral muted chip) rather than extracted from the design.
const STATUS_STYLES: Record<StatusBadgeStatus, StatusStyle> = {
  BUG: { label: 'Bug', classes: 'bg-bug/20 text-bug border border-bug/40' },
  CONFUSION: { label: 'Confused', classes: 'bg-confused/20 text-confused border border-confused/40' },
  SUGGESTION: { label: 'Suggestion', classes: 'bg-purple/20 text-purple border border-purple/40' },
  POSITIVE: { label: 'Positive', classes: 'bg-positive/20 text-positive border border-positive/40' },
  DIFFICULTY_SPIKE: { label: 'Difficulty spike', classes: 'bg-warning/20 text-warning border border-warning/40' },
  COMMENT: { label: 'Comment', classes: 'bg-border text-on-surface-variant' },
  LIVE: { label: 'Live', classes: 'bg-positive text-level-0' },
  PENDING: { label: 'Pending', classes: 'bg-purple/20 text-purple border border-purple/40' },
  DECLINED: { label: 'Declined', classes: 'bg-bug/20 text-bug border border-bug/40' },
  ALPHA: { label: 'Alpha', classes: 'bg-bug/20 text-bug border border-bug/40' },
};

@Component({
  selector: 'app-status-badge',
  imports: [],
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
})
export class StatusBadge {
  status = input.required<StatusBadgeStatus>();
  label = input<string>();

  protected readonly style = computed(() => STATUS_STYLES[this.status()]);
  protected readonly displayLabel = computed(() => this.label() ?? this.style().label);
  protected readonly isLive = computed(() => this.status() === 'LIVE');

  protected readonly classes = computed(
    () =>
      `inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-label-sm text-label-sm font-bold uppercase tracking-wider ${this.style().classes}`,
  );
}
