import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TestSession } from '../../../../core/sessions/sessions.models';
import { sessionActions } from '../../../../core/sessions/state/session.actions';
import {
  selectSession,
  selectSessionEnding,
  selectSessionError,
  selectSessionLoading,
} from '../../../../core/sessions/state/session.selectors';
import { FeedbackSeverity, FeedbackType } from '../../../../core/feedback-bytes/feedback-bytes.models';
import { feedbackBytesActions } from '../../../../core/feedback-bytes/state/feedback-bytes.actions';
import {
  selectAllFeedbackBytes,
  selectFeedbackBytesError,
  selectFeedbackBytesLoadingMore,
  selectFeedbackBytesPage,
  selectFeedbackBytesSubmitError,
  selectFeedbackBytesSubmitting,
  selectFeedbackBytesTotal,
  selectFeedbackBytesTotalPages,
} from '../../../../core/feedback-bytes/state/feedback-bytes.selectors';
import { combineLatest, filter, interval, map, Observable, of, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { SessionSocketService } from '../../../../core/realtime/session-socket.service';
import { UploadImageResponse, UploadsService } from '../../../../core/uploads/uploads.service';
import { extractImageFromClipboard } from '../../../../core/uploads/clipboard-image.util';
import { Card } from '../../../../shared/ui/card/card';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { Button, buttonClasses } from '../../../../shared/ui/button/button';
import { Input } from '../../../../shared/ui/input/input';
import { Select } from '../../../../shared/ui/select/select';
import { FeedbackByteItem } from '../../../../shared/ui/feedback-byte-item/feedback-byte-item';
import { ConfirmDialog } from '../../../../shared/ui/confirm-dialog/confirm-dialog';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';

export interface FeedbackTypeMeta {
  icon: string;
  neutralClasses: string;
  selectedClasses: string;
}

const NEUTRAL_CLASSES = 'border-border bg-level-1 text-on-surface-variant hover:border-cyan';

export const FEEDBACK_TYPE_META: Record<FeedbackType, FeedbackTypeMeta> = {
  BUG: {
    icon: 'bug_report',
    neutralClasses: NEUTRAL_CLASSES,
    selectedClasses: 'border-bug/40 bg-bug/10 text-bug hover:border-bug',
  },
  CONFUSION: {
    icon: 'help_center',
    neutralClasses: NEUTRAL_CLASSES,
    selectedClasses: 'border-confused/40 bg-confused/10 text-confused hover:border-confused',
  },
  SUGGESTION: {
    icon: 'lightbulb',
    neutralClasses: NEUTRAL_CLASSES,
    selectedClasses: 'border-purple/40 bg-purple/10 text-purple hover:border-purple',
  },
  POSITIVE: {
    icon: 'thumb_up',
    neutralClasses: NEUTRAL_CLASSES,
    selectedClasses: 'border-positive/40 bg-positive/10 text-positive hover:border-positive',
  },
  DIFFICULTY_SPIKE: {
    icon: 'trending_up',
    neutralClasses: NEUTRAL_CLASSES,
    selectedClasses: 'border-warning/40 bg-warning/10 text-warning hover:border-warning',
  },
  COMMENT: {
    icon: 'chat_bubble',
    neutralClasses: NEUTRAL_CLASSES,
    selectedClasses: NEUTRAL_CLASSES,
  },
};

const COMMENT_REQUIRED_TYPES: FeedbackType[] = ['BUG', 'SUGGESTION', 'DIFFICULTY_SPIKE'];

@Component({
  selector: 'app-active-session-component',
  imports: [FormsModule, Card, StatusBadge, Button, Input, Select, FeedbackByteItem, ConfirmDialog, LoadingSpinner],
  templateUrl: './active-session-component.html',
  styleUrl: './active-session-component.scss',
})
export class ActiveSessionComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);

  protected readonly feedbackTypeMeta = FEEDBACK_TYPE_META;
  protected readonly commentRequiredTypes = COMMENT_REQUIRED_TYPES;
  protected readonly secondaryLinkClasses = buttonClasses('secondary');

  session = this.store.selectSignal(selectSession);
  private readonly session$ = this.store.select(selectSession);
  loading = this.store.selectSignal(selectSessionLoading);
  ending = this.store.selectSignal(selectSessionEnding);
  private readonly sessionError = this.store.selectSignal(selectSessionError);

  feedbackBytes = this.store.selectSignal(selectAllFeedbackBytes);
  feedbackPage = this.store.selectSignal(selectFeedbackBytesPage);
  feedbackTotalPages = this.store.selectSignal(selectFeedbackBytesTotalPages);
  feedbackTotal = this.store.selectSignal(selectFeedbackBytesTotal);
  loadingMoreFeedback = this.store.selectSignal(selectFeedbackBytesLoadingMore);
  private readonly feedbackError = this.store.selectSignal(selectFeedbackBytesError);
  private readonly feedbackSubmitError = this.store.selectSignal(selectFeedbackBytesSubmitError);
  private readonly submitting = this.store.selectSignal(selectFeedbackBytesSubmitting);
  private readonly uploading = signal(false);
  sending = computed(() => this.uploading() || this.submitting());

  localErrorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  errorMessage = computed(
    () => this.localErrorMessage() ?? this.sessionError() ?? this.feedbackError() ?? this.feedbackSubmitError(),
  );

  selectedType = signal<FeedbackType>('COMMENT');

  comment = '';
  severity: FeedbackSeverity = 'LOW';
  reproductionSteps = '';

  selectedScreenshotFile: File | null = null;
  screenshotPreviewUrl = signal<string | null>(null);

  elapsedSeconds = signal(0);

  confirmingEndSession = signal(false);

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
    private readonly uploadsService: UploadsService,
    private readonly router: Router,
    private readonly sessionSocket: SessionSocketService,
  ) {
    this.actions$
      .pipe(ofType(sessionActions.endSessionSuccess), takeUntilDestroyed())
      .subscribe(() => this.successMessage.set('Session completed successfully.'));

    this.actions$
      .pipe(ofType(feedbackBytesActions.submitFeedbackByteSuccess), takeUntilDestroyed())
      .subscribe(() => {
        this.comment = '';
        this.reproductionSteps = '';
        this.severity = 'LOW';
        this.revokeScreenshotPreview();
        this.selectedScreenshotFile = null;
        this.screenshotPreviewUrl.set(null);
        this.successMessage.set('Feedback byte submitted.');
      });
  }

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('id') || '';
    this.setUpTimer();
    this.store.dispatch(sessionActions.loadSession({ sessionId: this.sessionId }));
    this.store.dispatch(feedbackBytesActions.loadSessionFeedbackBytes({ sessionId: this.sessionId, page: 1 }));
    this.sessionSocket.joinSession(this.sessionId);
  }

  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe();
    this.sessionSocket.leaveSession(this.sessionId);
    this.store.dispatch(sessionActions.sessionCleared());
    this.store.dispatch(feedbackBytesActions.feedbackBytesCleared());
    this.revokeScreenshotPreview();
  }

  selectType(type: FeedbackType): void {
    this.selectedType.set(type);
    this.localErrorMessage.set(null);
    this.successMessage.set(null);
  }

  onScreenshotFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.setScreenshotFile(file);
  }

  onScreenshotPaste(event: ClipboardEvent): void {
    const file = extractImageFromClipboard(event);
    if (!file) {
      return;
    }

    event.preventDefault();
    this.setScreenshotFile(file);
  }

  private setScreenshotFile(file: File): void {
    this.revokeScreenshotPreview();
    this.selectedScreenshotFile = file;
    this.screenshotPreviewUrl.set(URL.createObjectURL(file));
  }

  submitFeedback() : void {

    this.localErrorMessage.set(null);
    this.successMessage.set(null);

    if (this.session()?.status !== 'LIVE') {
      this.localErrorMessage.set('Only live sessions can receive feedback.');
      return;
    }

    if (COMMENT_REQUIRED_TYPES.includes(this.selectedType()) && !this.comment.trim()) {
      this.localErrorMessage.set('Comment is required for this feedback type.');
      return;
    }

    this.uploading.set(true);

    const upload$: Observable<UploadImageResponse | null> = this.selectedScreenshotFile
      ? this.uploadsService.uploadImage(this.selectedScreenshotFile)
      : of(null);

    upload$.subscribe({
      next: (uploadResult) => {
        this.uploading.set(false);
        this.store.dispatch(
          feedbackBytesActions.submitFeedbackByte({
            sessionId: this.sessionId,
            request: {
              type: this.selectedType(),
              timestampSeconds: this.elapsedSeconds(),
              severity: this.selectedType() === 'BUG' ? this.severity : undefined,
              comment: this.comment.trim() || undefined,
              reproductionSteps:
                this.selectedType() === 'BUG' ? this.reproductionSteps || undefined : undefined,
              screenshotUrl: uploadResult?.url,
            },
          }),
        );
      },
      error: (error) => {
        this.uploading.set(false);
        this.localErrorMessage.set(
          error?.error?.message || 'Failed to submit feedback.',
        );
      },
    });
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

  endSession(): void {
    this.confirmingEndSession.set(true);
  }

  confirmEndSession(): void {
    this.confirmingEndSession.set(false);
    this.successMessage.set(null);

    this.store.dispatch(
      sessionActions.endSession({
        sessionId: this.sessionId,
        request: {
          finalFunRating: Number(this.finalFunRating),
          finalDifficultyRating: Number(this.finalDifficultyRating),
          finalClarityRating: Number(this.finalClarityRating),
          finalComment: this.finalComment || undefined,
        },
      }),
    );
  }

  pauseSession(): void {
    this.localErrorMessage.set(null);
    this.store.dispatch(sessionActions.pauseSession({ sessionId: this.sessionId }));
  }

  resumeSession(): void {
    this.localErrorMessage.set(null);
    this.store.dispatch(sessionActions.resumeSession({ sessionId: this.sessionId }));
  }

  private setUpTimer(): void {
    this.timerSubscription = combineLatest([interval(1000), this.session$])
      .pipe(
        map(([, session]) => session),
        filter((session): session is TestSession => !!session),
      )
      .subscribe((session) => {
        this.elapsedSeconds.set(this.computeElapsed(session));
      });
  }

  private computeElapsed(session: TestSession): number {
    const paused = session.pausedDurationSeconds ?? 0;
    const startedAtMs = new Date(session.startedAt).getTime();

    if (session.status === 'LIVE') {
      return Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000) - paused);
    }

    if (session.status === 'PAUSED' && session.pausedAt) {
      const pausedAtMs = new Date(session.pausedAt).getTime();
      return Math.max(0, Math.floor((pausedAtMs - startedAtMs) / 1000) - paused);
    }

    return session.durationSeconds ?? 0;
  }

  private revokeScreenshotPreview(): void {
    const previewUrl = this.screenshotPreviewUrl();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }

  formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }
}
