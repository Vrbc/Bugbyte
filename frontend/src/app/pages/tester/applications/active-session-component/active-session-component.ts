import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionsService } from '../../../../core/sessions/sessions.service';
import { TestSession } from '../../../../core/sessions/sessions.models';
import { CommonModule } from '@angular/common';
import { FeedbackByte, FeedbackSeverity, FeedbackType } from '../../../../core/feedback-bytes/feedback-bytes.models';
import { interval, Subscription } from 'rxjs';
import { FeedbackBytesService } from '../../../../core/feedback-bytes/feedback-bytes.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-active-session-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './active-session-component.html',
  styleUrl: './active-session-component.scss',
})
export class ActiveSessionComponent implements OnInit, OnDestroy {
  session = signal<TestSession | null>(null);
  feedbackBytes = signal<FeedbackByte[]>([])

  loading = signal(true);
  sending = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  selectedType = signal<FeedbackType>('COMMENT');

  comment = '';
  severity: FeedbackSeverity = 'LOW';
  reproductionSteps = '';
  screenshotUrl = '';

  elapsedSeconds = signal(0);

  ending = signal(false);

  finalFunRating = 4;
  finalDifficultyRating = 3;
  finalClarityRating = 4;
  finalComment = '';

  feedbackTypes: FeedbackType[] = [
    'BUG',
    'CONFUSION',
    'SUGGESTION',
    'POSITIVE',
    'DIFFICULTY_SPIKE',
    'COMMENT',
  ];

  severities: FeedbackSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  private sessionId = '';
  private timerSubscription?: Subscription;


  constructor(
    private readonly route: ActivatedRoute,
    private readonly sessionsService: SessionsService,
    private readonly feedbackBytesService: FeedbackBytesService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('id') || '';
    this.loadSession();
    this.loadFeedbackBytes();
  }

  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe();
  }

  selectType(type: FeedbackType): void {
    this.selectedType.set(type);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  submitFeedback() : void {
    
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.session()?.status !== 'LIVE') {
      this.errorMessage.set('Only live sessions can receive feedback.');
      return;
    }

    if(!this.comment.trim()){
      this.errorMessage.set('Comment is required.');
      return;
    }

    this.sending.set(true);

    this.feedbackBytesService.createFeedbackByte(this.sessionId, {
      type: this.selectedType(),
      timestampSeconds: this.elapsedSeconds(),
      severity: this.selectedType() === 'BUG' ? this.severity : undefined,
      comment: this.comment,
      reproductionSteps:
      this.selectedType() === 'BUG' ? this.reproductionSteps || undefined : undefined,
      screenshotUrl: this.screenshotUrl || undefined,
    }).subscribe({
      next: (feedbackByte) => {
        this.feedbackBytes.update(
          (items) => [...items, feedbackByte].sort( 
            (a, b) => a.timestampSeconds - b.timestampSeconds
          ),
        );

        this.comment = '';
        this.reproductionSteps = '';
        this.screenshotUrl = '';
        this.severity = 'LOW';

        this.sending.set(false);
        this.successMessage.set('Feedback byte submitted.');
      },
      error: (error) => {
        this.sending.set(false);
        this.errorMessage.set(
          error?.error?.message || 'Failed to submit feedback.',
        );
      },
    });
  }

  private loadSession() : void {
    this.sessionsService.getSession(this.sessionId).subscribe({
       next: (session) => {
        this.session.set(session);
        this.loading.set(false);
        this.startTimer(session.startedAt);
      },
      error: () => {
        this.errorMessage.set('Failed to load session.');
        this.loading.set(false);
      },
    })
  }

  private loadFeedbackBytes(): void {
    this.feedbackBytesService.getFeedbackBytesForSession(this.sessionId).subscribe({
      next: (feedbackBytes) => {
        this.feedbackBytes.set(
          feedbackBytes.sort((a, b) => a.timestampSeconds - b.timestampSeconds),
        );
      },
      error: () => {
        this.errorMessage.set('Failed to load feedback bytes.');
      },
    });
  }


  endSession(): void {
  this.errorMessage.set(null);
  this.successMessage.set(null);

  const confirmed = confirm('End this test session? You will not be able to send more feedback.');

  if (!confirmed) {
    return;
  }

  this.ending.set(true);

  this.sessionsService.endSession(this.sessionId, {
      finalFunRating: Number(this.finalFunRating),
      finalDifficultyRating: Number(this.finalDifficultyRating),
      finalClarityRating: Number(this.finalClarityRating),
      finalComment: this.finalComment || undefined,
    }).subscribe({
      next: (session) => {
        this.session.set(session);
        this.timerSubscription?.unsubscribe();
        this.ending.set(false);
        this.successMessage.set('Session completed successfully.');
      },
      error: (error) => {
        this.ending.set(false);
        this.errorMessage.set(
          error?.error?.message || 'Failed to end session.',
        );
      },
    });
  }


  private startTimer(startedAt: string): void {
    const startedAtMs = new Date(startedAt).getTime();

    this.timerSubscription = interval(1000).subscribe(() => {
      const nowMs = Date.now();
      const elapsed = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
      this.elapsedSeconds.set(elapsed);
    });
  }

  formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }
}
