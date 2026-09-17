import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, filter, map, merge, of, switchMap, takeUntil, tap } from 'rxjs';
import { FeedbackBytesService } from '../feedback-bytes.service';
import { SessionSocketService } from '../../realtime/session-socket.service';
import { feedbackBytesActions } from './feedback-bytes.actions';

@Injectable()
export class FeedbackBytesEffects {
  private readonly actions$ = inject(Actions);
  private readonly feedbackBytesService = inject(FeedbackBytesService);
  private readonly sessionSocket = inject(SessionSocketService);

  loadSessionFeedbackBytes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(feedbackBytesActions.loadSessionFeedbackBytes),
      switchMap(({ sessionId, page }) =>
        this.feedbackBytesService.getFeedbackBytesForSession(sessionId, page).pipe(
          map((result) => feedbackBytesActions.loadSessionFeedbackBytesSuccess({ result })),
          catchError(() =>
            of(feedbackBytesActions.loadSessionFeedbackBytesFailure({ error: 'Failed to load feedback bytes.' })),
          ),
        ),
      ),
    ),
  );

  loadCampaignFeedbackBytes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(feedbackBytesActions.loadCampaignFeedbackBytes),
      switchMap(({ campaignId, feedbackType, fromSeconds, toSeconds, page }) =>
        this.feedbackBytesService.getFeedbackBytesForCampaign(campaignId, feedbackType, fromSeconds, toSeconds, page).pipe(
          map((result) => feedbackBytesActions.loadCampaignFeedbackBytesSuccess({ result })),
          catchError(() =>
            of(feedbackBytesActions.loadCampaignFeedbackBytesFailure({ error: 'Failed to load feedback.' })),
          ),
        ),
      ),
    ),
  );

  submitFeedbackByte$ = createEffect(() =>
    this.actions$.pipe(
      ofType(feedbackBytesActions.submitFeedbackByte),
      switchMap(({ sessionId, request }) =>
        this.feedbackBytesService.createFeedbackByte(sessionId, request).pipe(
          map((feedbackByte) => feedbackBytesActions.submitFeedbackByteSuccess({ feedbackByte })),
          catchError((error) =>
            of(feedbackBytesActions.submitFeedbackByteFailure({
              error: error?.error?.message || 'Failed to submit feedback.',
            })),
          ),
        ),
      ),
    ),
  );

  // bridges the live feedback push and the reconnect triggered 
  // reload for whichever sessions feed is currently open
  feedbackSocketBridge$ = createEffect(() =>
    this.actions$.pipe(
      ofType(feedbackBytesActions.loadSessionFeedbackBytes),
      filter(({ page }) => page === 1),
      switchMap(({ sessionId }) =>
        merge(
          this.sessionSocket.onNewFeedback().pipe(
            filter((feedbackByte) => feedbackByte.sessionId === sessionId),
            map((feedbackByte) => feedbackBytesActions.feedbackByteReceived({ feedbackByte })),
          ),
          this.sessionSocket.onReconnect().pipe(
            tap(() => this.sessionSocket.joinSession(sessionId)),
            map(() => feedbackBytesActions.loadSessionFeedbackBytes({ sessionId, page: 1 })),
          ),
        ).pipe(takeUntil(this.actions$.pipe(ofType(feedbackBytesActions.feedbackBytesCleared)))),
      ),
    ),
  );
}
