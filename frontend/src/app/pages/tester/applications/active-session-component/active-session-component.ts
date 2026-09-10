import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionsService } from '../../../../core/sessions/sessions.service';
import { TestSession } from '../../../../core/sessions/sessions.models';
import { CommonModule } from '@angular/common';
import { FeedbackByte, FeedbackSeverity, FeedbackType } from '../../../../core/feedback-bytes/feedback-bytes.models';
import { interval, Observable, of, Subscription, switchMap } from 'rxjs';
import { FeedbackBytesService } from '../../../../core/feedback-bytes/feedback-bytes.service';
import { FormsModule } from '@angular/forms';
import { SessionSocketService } from '../../../../core/realtime/session-socket.service';
import { UploadImageResponse, UploadsService } from '../../../../core/uploads/uploads.service';
import { extractImageFromClipboard } from '../../../../core/uploads/clipboard-image.util';

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

  selectedScreenshotFile: File | null = null;
  screenshotPreviewUrl = signal<string | null>(null);

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

  feedbackPage = signal(1);
  feedbackTotalPages = signal(1);
  feedbackTotal = signal(0);
  loadingMoreFeedback = signal(false);

  private sessionId = '';
  private timerSubscription?: Subscription;
  private readonly socketSubscriptions = new Subscription();


  constructor(
    private readonly route: ActivatedRoute,
    private readonly sessionsService: SessionsService,
    private readonly feedbackBytesService: FeedbackBytesService,
    private readonly uploadsService: UploadsService,
    private readonly router: Router,
    private readonly sessionSocket: SessionSocketService,
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('id') || '';
    this.loadSession();
    this.loadFeedbackBytes(1);
    this.connectToLiveUpdates();
  }

  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe();
    this.socketSubscriptions.unsubscribe();
    this.sessionSocket.leaveSession(this.sessionId);
    this.revokeScreenshotPreview();
  }

  selectType(type: FeedbackType): void {
    this.selectedType.set(type);
    this.errorMessage.set(null);
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

    const upload$: Observable<UploadImageResponse | null> = this.selectedScreenshotFile
      ? this.uploadsService.uploadImage(this.selectedScreenshotFile)
      : of(null);

    upload$.pipe(
      switchMap((uploadResult) =>
        this.feedbackBytesService.createFeedbackByte(this.sessionId, {
          type: this.selectedType(),
          timestampSeconds: this.elapsedSeconds(),
          severity: this.selectedType() === 'BUG' ? this.severity : undefined,
          comment: this.comment,
          reproductionSteps:
          this.selectedType() === 'BUG' ? this.reproductionSteps || undefined : undefined,
          screenshotUrl: uploadResult?.url,
        }),
      ),
    ).subscribe({
      next: (feedbackByte) => {
        this.prependFeedbackByte(feedbackByte);

        this.comment = '';
        this.reproductionSteps = '';
        this.severity = 'LOW';
        this.revokeScreenshotPreview();
        this.selectedScreenshotFile = null;
        this.screenshotPreviewUrl.set(null);

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

  private loadFeedbackBytes(page: number): void {
    this.feedbackBytesService.getFeedbackBytesForSession(this.sessionId, page).subscribe({
      next: (result) => {
        this.feedbackBytes.set(result.items);
        this.feedbackPage.set(result.page);
        this.feedbackTotalPages.set(result.totalPages);
        this.feedbackTotal.set(result.total);
      },
      error: () => {
        this.errorMessage.set('Failed to load feedback bytes.');
      },
    });
  }

  private prependFeedbackByte(feedbackByte: FeedbackByte): void {
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
  }

  private connectToLiveUpdates(): void {
    this.sessionSocket.joinSession(this.sessionId);

    this.socketSubscriptions.add(
      this.sessionSocket.onNewFeedback().subscribe((feedbackByte) => {
        if (feedbackByte.sessionId !== this.sessionId) {
          return;
        }

        this.prependFeedbackByte(feedbackByte);
      }),
    );

    this.socketSubscriptions.add(
      this.sessionSocket.onSessionUpdate().subscribe((session) => {
        if (session.id !== this.sessionId) {
          return;
        }

        this.session.set(session);
        if (session.status !== 'LIVE') {
          this.timerSubscription?.unsubscribe();
        }
      }),
    );

    this.socketSubscriptions.add(
      this.sessionSocket.onReconnect().subscribe(() => {
        this.sessionSocket.joinSession(this.sessionId);
        this.loadFeedbackBytes(1);
      }),
    );
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
