import { Component, computed, input } from '@angular/core';
import { FeedbackType } from '../../../core/feedback-bytes/feedback-bytes.models';
import { CampaignStatus } from '../../../core/campaigns/campaigns.models';
import { ApplicationStatus } from '../../../core/applications/applications.models';
import { SessionStatus } from '../../../core/sessions/sessions.models';
import { GameStatus } from '../../../core/games/games.models';
import { BuildStatus } from '../../../core/builds/builds.models';
import { TesterLevel } from '../../../core/testers/testers.models';

export type StatusBadgeStatus =
  | FeedbackType
  | CampaignStatus
  | ApplicationStatus
  | SessionStatus
  | GameStatus
  | BuildStatus
  | TesterLevel;

interface StatusStyle {
  label: string;
  classes: string;
}

const TIER_CLASSES = {
  neutral: 'bg-border text-on-surface-variant',
  cyan: 'bg-cyan/20 text-cyan border border-cyan/40',
  warning: 'bg-warning/20 text-warning border border-warning/40',
  confused: 'bg-confused/20 text-confused border border-confused/40',
  positive: 'bg-positive/20 text-positive border border-positive/40',
  purple: 'bg-purple/20 text-purple border border-purple/40',
  bug: 'bg-bug/20 text-bug border border-bug/40',
} as const;

const STATUS_STYLES: Record<StatusBadgeStatus, StatusStyle> = {
  BUG: { label: 'Bug', classes: TIER_CLASSES.bug },
  CONFUSION: { label: 'Confused', classes: TIER_CLASSES.confused },
  SUGGESTION: { label: 'Suggestion', classes: TIER_CLASSES.purple },
  POSITIVE: { label: 'Positive', classes: TIER_CLASSES.positive },
  DIFFICULTY_SPIKE: { label: 'Difficulty spike', classes: TIER_CLASSES.warning },
  COMMENT: { label: 'Comment', classes: TIER_CLASSES.neutral },
  DRAFT: { label: 'Draft', classes: TIER_CLASSES.neutral },
  ACTIVE: { label: 'Active', classes: TIER_CLASSES.cyan },
  TESTING: { label: 'Testing', classes: TIER_CLASSES.cyan },
  PAUSED: { label: 'Paused', classes: TIER_CLASSES.warning },
  COMPLETED: { label: 'Completed', classes: TIER_CLASSES.positive },
  ARCHIVED: { label: 'Archived', classes: TIER_CLASSES.neutral },
  PENDING: { label: 'Pending', classes: TIER_CLASSES.purple },
  ACCEPTED: { label: 'Accepted', classes: TIER_CLASSES.positive },
  REJECTED: { label: 'Rejected', classes: TIER_CLASSES.bug },
  CANCELLED: { label: 'Cancelled', classes: TIER_CLASSES.neutral },
  LIVE: { label: 'Live', classes: 'bg-positive text-level-0' },
  NEW_TESTER: { label: 'New Tester', classes: TIER_CLASSES.neutral },
  RELIABLE_TESTER: { label: 'Reliable Tester', classes: TIER_CLASSES.cyan },
  TRUSTED_TESTER: { label: 'Trusted Tester', classes: TIER_CLASSES.purple },
  EXPERT_TESTER: { label: 'Expert Tester', classes: TIER_CLASSES.positive },
  ELITE_TESTER: { label: 'Elite Tester', classes: TIER_CLASSES.warning },
};

const TESTER_LEVEL_STATUSES = new Set<StatusBadgeStatus>([
  'NEW_TESTER',
  'RELIABLE_TESTER',
  'TRUSTED_TESTER',
  'EXPERT_TESTER',
  'ELITE_TESTER',
]);

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
  protected readonly isTesterLevel = computed(() => TESTER_LEVEL_STATUSES.has(this.status()));

  protected readonly classes = computed(
    () =>
      `inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-label-sm text-label-sm font-bold uppercase tracking-wider ${this.style().classes}`,
  );
}
