import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, takeUntil } from 'rxjs';
import { SessionSocketService } from '../../realtime/session-socket.service';
import { SessionsService } from '../sessions.service';
import { sessionActions } from './session.actions';

@Injectable()
export class SessionEffects {
  private readonly actions$ = inject(Actions);
  private readonly sessionsService = inject(SessionsService);
  private readonly sessionSocket = inject(SessionSocketService);

  loadSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(sessionActions.loadSession),
      switchMap(({ sessionId }) =>
        this.sessionsService.getSession(sessionId).pipe(
          map((session) => sessionActions.loadSessionSuccess({ session })),
          catchError(() => of(sessionActions.loadSessionFailure({ error: 'Failed to load session.' }))),
        ),
      ),
    ),
  );

  pauseSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(sessionActions.pauseSession),
      switchMap(({ sessionId }) =>
        this.sessionsService.pauseSession(sessionId).pipe(
          map((session) => sessionActions.pauseSessionSuccess({ session })),
          catchError((error) =>
            of(sessionActions.pauseSessionFailure({
              error: error?.error?.message || 'Failed to pause session.',
            })),
          ),
        ),
      ),
    ),
  );

  resumeSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(sessionActions.resumeSession),
      switchMap(({ sessionId }) =>
        this.sessionsService.resumeSession(sessionId).pipe(
          map((session) => sessionActions.resumeSessionSuccess({ session })),
          catchError((error) =>
            of(sessionActions.resumeSessionFailure({
              error: error?.error?.message || 'Failed to resume session.',
            })),
          ),
        ),
      ),
    ),
  );

  endSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(sessionActions.endSession),
      switchMap(({ sessionId, request }) =>
        this.sessionsService.endSession(sessionId, request).pipe(
          map((session) => sessionActions.endSessionSuccess({ session })),
          catchError((error) =>
            of(sessionActions.endSessionFailure({
              error: error?.error?.message || 'Failed to end session.',
            })),
          ),
        ),
      ),
    ),
  );

  // bridges the sockets session update push into the store, scoped to the
  // session currently being watched
  sessionUpdated$ = createEffect(() =>
    this.actions$.pipe(
      ofType(sessionActions.loadSession),
      switchMap(() =>
        this.sessionSocket.onSessionUpdate().pipe(
          takeUntil(this.actions$.pipe(ofType(sessionActions.sessionCleared))),
        ),
      ),
      map((session) => sessionActions.sessionUpdated({ session })),
    ),
  );
}
