import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SessionsService } from '../../../../core/sessions/sessions.service';
import { FeedbackBytesService } from '../../../../core/feedback-bytes/feedback-bytes.service';
import { ReviewsService } from '../../../../core/reviews/reviews.service';
import { FeedbackByte } from '../../../../core/feedback-bytes/feedback-bytes.models';
import { TestSession } from '../../../../core/sessions/sessions.models';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-developer-session-review-component',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './developer-session-review-component.html',
  styleUrl: './developer-session-review-component.scss',
})
export class DeveloperSessionReviewComponent implements OnInit {
  session = signal<TestSession | null>(null);
  feedbackBytes = signal<FeedbackByte[]>([]);

  loading = signal(true);
  submittingReview = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  rating = 5;
  helpful = true;
  comment = '';

  private sessionId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly sessionsService: SessionsService,
    private readonly feedbackBytesService: FeedbackBytesService,
    private readonly reviewsService: ReviewsService,
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('id') || '';
    this.loadPage();
  }

  loadPage(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      session: this.sessionsService.getSession(this.sessionId),
      feedbackBytes: this.feedbackBytesService.getFeedbackBytesForSession(this.sessionId),
    }).subscribe({
      next: ({ session, feedbackBytes }) => {
        this.session.set(session);
        this.feedbackBytes.set(
          feedbackBytes.sort((a, b) => a.timestampSeconds - b.timestampSeconds),
        );
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load session review.');
        this.loading.set(false);
      },
    });
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
