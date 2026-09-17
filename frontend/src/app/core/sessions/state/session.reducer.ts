import { createFeature, createReducer, on } from '@ngrx/store';
import { TestSession } from '../sessions.models';
import { sessionActions } from './session.actions';

export interface SessionState {
  sessionId: string | null;
  session: TestSession | null;
  loading: boolean;
  ending: boolean;
  error: string | null;
}

export const initialSessionState: SessionState = {
  sessionId: null,
  session: null,
  loading: false,
  ending: false,
  error: null,
};

export const sessionFeature = createFeature({
  name: 'session',
  reducer: createReducer(
    initialSessionState,
    on(sessionActions.loadSession, (_state, { sessionId }): SessionState => ({
      ...initialSessionState,
      sessionId,
      loading: true,
    })),
    on(sessionActions.loadSessionSuccess, (state, { session }): SessionState => ({
      ...state,
      session,
      loading: false,
    })),
    on(sessionActions.loadSessionFailure, (state, { error }): SessionState => ({
      ...state,
      loading: false,
      error,
    })),
    on(sessionActions.pauseSession, sessionActions.resumeSession, (state): SessionState => ({
      ...state,
      error: null,
    })),
    on(sessionActions.endSession, (state): SessionState => ({
      ...state,
      ending: true,
      error: null,
    })),
    on(
      sessionActions.pauseSessionSuccess,
      sessionActions.resumeSessionSuccess,
      sessionActions.endSessionSuccess,
      (state, { session }): SessionState => ({ ...state, session, ending: false }),
    ),
    on(
      sessionActions.pauseSessionFailure,
      sessionActions.resumeSessionFailure,
      sessionActions.endSessionFailure,
      (state, { error }): SessionState => ({ ...state, ending: false, error }),
    ),
    on(sessionActions.sessionUpdated, (state, { session }): SessionState =>
      state.sessionId === session.id ? { ...state, session } : state,
    ),
    on(sessionActions.sessionCleared, (): SessionState => initialSessionState),
  ),
});
