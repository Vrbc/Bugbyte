import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { ReviewsService } from '../../../../core/reviews/reviews.service';
import { sessionActions } from '../../../../core/sessions/state/session.actions';
import {
  selectSession,
  selectSessionError,
  selectSessionLoading,
} from '../../../../core/sessions/state/session.selectors';
import { feedbackBytesActions } from '../../../../core/feedback-bytes/state/feedback-bytes.actions';
import {
  selectAllFeedbackBytes,
  selectFeedbackBytesError,
  selectFeedbackBytesLoading,
  selectFeedbackBytesLoadingMore,
  selectFeedbackBytesPage,
  selectFeedbackBytesTotal,
  selectFeedbackBytesTotalPages,
} from '../../../../core/feedback-bytes/state/feedback-bytes.selectors';
import { FormsModule } from '@angular/forms';
import { SessionSocketService } from '../../../../core/realtime/session-socket.service';
import { Card } from '../../../../shared/ui/card/card';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { Button } from '../../../../shared/ui/button/button';
import { Input } from '../../../../shared/ui/input/input';
import { FeedbackByteItem } from '../../../../shared/ui/feedback-byte-item/feedback-byte-item';

@Component({
  selector: 'app-developer-session-review-component',
  imports: [FormsModule, RouterLink, Card, StatusBadge, Button, Input, FeedbackByteItem],
  templateUrl: './developer-session-review-component.html',
  styleUrl: './developer-session-review-component.scss',
})
export class DeveloperSessionReviewComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);

  session = this.store.selectSignal(selectSession);
  private readonly sessionLoading = this.store.selectSignal(selectSessionLoading);
  private readonly sessionError = this.store.selectSignal(selectSessionError);

  feedbackBytes = this.store.selectSignal(selectAllFeedbackBytes);
  feedbackPage = this.store.selectSignal(selectFeedbackBytesPage);
  feedbackTotalPages = this.store.selectSignal(selectFeedbackBytesTotalPages);
  feedbackTotal = this.store.selectSignal(selectFeedbackBytesTotal);
  loadingMoreFeedback = this.store.selectSignal(selectFeedbackBytesLoadingMore);
  private readonly feedbackBytesLoading = this.store.selectSignal(selectFeedbackBytesLoading);
  private readonly feedbackError = this.store.selectSignal(selectFeedbackBytesError);

  loading = computed(() => this.sessionLoading() || this.feedbackBytesLoading());
  submittingReview = signal(false);
  reviewSubmitted = signal(false);
  localErrorMessage = signal<string | null>(null);
  errorMessage = computed(() => this.sessionError() ?? this.feedbackError() ?? this.localErrorMessage());
  successMessage = signal<string | null>(null);

  rating = 5;
  helpful = true;
  comment = '';

  private sessionId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly reviewsService: ReviewsService,
    private readonly sessionSocket: SessionSocketService,
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('id') || '';
    this.store.dispatch(sessionActions.loadSession({ sessionId: this.sessionId }));
    this.store.dispatch(feedbackBytesActions.loadSessionFeedbackBytes({ sessionId: this.sessionId, page: 1 }));
    this.sessionSocket.joinSession(this.sessionId);
  }

  ngOnDestroy(): void {
    this.sessionSocket.leaveSession(this.sessionId);
    this.store.dispatch(sessionActions.sessionCleared());
    this.store.dispatch(feedbackBytesActions.feedbackBytesCleared());
  }

  loadMoreFeedbackBytes(): void {
    const page = this.feedbackPage();
    if (this.loadingMoreFeedback() || page >= this.feedbackTotalPages()) {
      return;
    }

    this.store.dispatch(
      feedbackBytesActions.loadSessionFeedbackBytes({ sessionId: this.sessionId, page: page + 1 }),
    );
  }

  submitReview(): void {
    this.localErrorMessage.set(null);
    this.successMessage.set(null);

    if (this.session()?.status !== 'COMPLETED') {
      this.localErrorMessage.set('Only completed sessions can be reviewed.');
      return;
    }

    this.submittingReview.set(true);

    this.reviewsService.createTesterReview(this.sessionId, {
      rating: Number(this.rating),
      helpful: Boolean(this.helpful),
      comment: this.comment || undefined,
    }).subscribe({
      next: () => {
        this.submittingReview.set(false);
        this.reviewSubmitted.set(true);
        this.successMessage.set('Tester review submitted successfully.');
      },
      error: (error) => {
        this.submittingReview.set(false);
        this.localErrorMessage.set(
          error?.error?.message || 'Failed to submit tester review.',
        );
      },
    });
  }

  formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  formatDuration(seconds?: number | null): string {
    if (!seconds) {
      return '—';
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}m ${remainingSeconds}s`;
  }
}
