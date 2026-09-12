import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SessionsService } from '../../../../core/sessions/sessions.service';
import { FeedbackBytesService } from '../../../../core/feedback-bytes/feedback-bytes.service';
import { ReviewsService } from '../../../../core/reviews/reviews.service';
import { FeedbackByte } from '../../../../core/feedback-bytes/feedback-bytes.models';
import { TestSession } from '../../../../core/sessions/sessions.models';
import { forkJoin, Subscription } from 'rxjs';
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
  session = signal<TestSession | null>(null);
  feedbackBytes = signal<FeedbackByte[]>([]);

  loading = signal(true);
  submittingReview = signal(false);
  reviewSubmitted = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  rating = 5;
  helpful = true;
  comment = '';

  feedbackPage = signal(1);
  feedbackTotalPages = signal(1);
  feedbackTotal = signal(0);
  loadingMoreFeedback = signal(false);

  private sessionId = '';
  private readonly socketSubscriptions = new Subscription();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly sessionsService: SessionsService,
    private readonly feedbackBytesService: FeedbackBytesService,
    private readonly reviewsService: ReviewsService,
    private readonly sessionSocket: SessionSocketService,
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('id') || '';
    this.loadPage(1);
    this.connectToLiveUpdates();
  }

  ngOnDestroy(): void {
    this.socketSubscriptions.unsubscribe();
    this.sessionSocket.leaveSession(this.sessionId);
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      session: this.sessionsService.getSession(this.sessionId),
      feedbackBytes: this.feedbackBytesService.getFeedbackBytesForSession(this.sessionId, page),
    }).subscribe({
      next: ({ session, feedbackBytes }) => {
        this.session.set(session);
        this.feedbackBytes.set(feedbackBytes.items);
        this.feedbackPage.set(feedbackBytes.page);
        this.feedbackTotalPages.set(feedbackBytes.totalPages);
        this.feedbackTotal.set(feedbackBytes.total);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load session review.');
        this.loading.set(false);
      },
    });
  }

  loadMoreFeedbackBytes(): void {
    if (this.loadingMoreFeedback() || this.feedbackPage() >= this.feedbackTotalPages()) {
      return;
    }

    const nextPage = this.feedbackPage() + 1;
    this.loadingMoreFeedback.set(true);

    this.feedbackBytesService.getFeedbackBytesForSession(this.sessionId, nextPage).subscribe({
      next: (result) => {
        this.feedbackBytes.update((items) => {
          const existingIds = new Set(items.map((item) => item.id));
          const olderItems = result.items.filter((item) => !existingIds.has(item.id));
          return [...items, ...olderItems];
        });
        this.feedbackPage.set(result.page);
        this.feedbackTotalPages.set(result.totalPages);
        this.feedbackTotal.set(result.total);
        this.loadingMoreFeedback.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load older feedback.');
        this.loadingMoreFeedback.set(false);
      },
    });
  }

  private connectToLiveUpdates(): void {
    this.sessionSocket.joinSession(this.sessionId);

    this.socketSubscriptions.add(
      this.sessionSocket.onNewFeedback().subscribe((feedbackByte) => {
        if (feedbackByte.sessionId !== this.sessionId) {
          return;
        }

        let added = false;
        this.feedbackBytes.update((items) => {
          if (items.some((item) => item.id === feedbackByte.id)) {
            return items;
          }

          added = true;
          return [feedbackByte, ...items];
        });

        if (added) {
          this.feedbackTotal.update((total) => total + 1);
        }
      }),
    );

    this.socketSubscriptions.add(
      this.sessionSocket.onSessionUpdate().subscribe((session) => {
        if (session.id !== this.sessionId) {
          return;
        }

        this.session.set(session);
      }),
    );

    this.socketSubscriptions.add(
      this.sessionSocket.onReconnect().subscribe(() => {
        this.sessionSocket.joinSession(this.sessionId);
        this.loadPage(1);
      }),
    );
  }

  submitReview(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.session()?.status !== 'COMPLETED') {
      this.errorMessage.set('Only completed sessions can be reviewed.');
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
        this.errorMessage.set(
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
