import { TestSession } from '../sessions.models';
import { sessionActions } from './session.actions';
import { initialSessionState, sessionFeature } from './session.reducer';

const buildSession = (overrides: Partial<TestSession> = {}): TestSession => ({
  id: 'session-1',
  campaignId: 'campaign-1',
  applicationId: 'application-1',
  testerId: 'tester-1',
  startedAt: new Date().toISOString(),
  status: 'LIVE',
  ...overrides,
});

describe('sessionFeature reducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = sessionFeature.reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialSessionState);
  });

  it('resets state and tracks the requested sessionId on loadSession', () => {
    const dirty: ReturnType<typeof sessionFeature.reducer> = {
      ...initialSessionState,
      session: buildSession(),
      error: 'stale error',
    };

    const state = sessionFeature.reducer(dirty, sessionActions.loadSession({ sessionId: 'session-2' }));

    expect(state).toEqual({ ...initialSessionState, sessionId: 'session-2', loading: true });
  });

  it('stores the session and clears loading on loadSessionSuccess', () => {
    const session = buildSession();
    const state = sessionFeature.reducer(
      { ...initialSessionState, sessionId: session.id, loading: true },
      sessionActions.loadSessionSuccess({ session }),
    );

    expect(state.session).toBe(session);
    expect(state.loading).toBe(false);
  });

  it('applies a sessionUpdated push only when it matches the tracked sessionId', () => {
    const tracked = { ...initialSessionState, sessionId: 'session-1', session: buildSession() };
    const matching = buildSession({ status: 'PAUSED' });
    const fromAnotherSession = buildSession({ id: 'session-2', status: 'COMPLETED' });

    const updated = sessionFeature.reducer(tracked, sessionActions.sessionUpdated({ session: matching }));
    expect(updated.session).toBe(matching);

    const ignored = sessionFeature.reducer(tracked, sessionActions.sessionUpdated({ session: fromAnotherSession }));
    expect(ignored.session).toBe(tracked.session);
  });

  it('sets ending on endSession and clears it again on endSessionSuccess', () => {
    const pending = sessionFeature.reducer(
      { ...initialSessionState, sessionId: 's1' },
      sessionActions.endSession({
        sessionId: 's1',
        request: { finalFunRating: 5, finalDifficultyRating: 3, finalClarityRating: 4 },
      }),
    );
    expect(pending.ending).toBe(true);

    const session = buildSession({ status: 'COMPLETED' });
    const settled = sessionFeature.reducer(pending, sessionActions.endSessionSuccess({ session }));
    expect(settled.ending).toBe(false);
    expect(settled.session).toBe(session);
  });

  it('records the error and clears ending on endSessionFailure', () => {
    const state = sessionFeature.reducer(
      { ...initialSessionState, ending: true },
      sessionActions.endSessionFailure({ error: 'Failed to end session.' }),
    );

    expect(state.ending).toBe(false);
    expect(state.error).toBe('Failed to end session.');
  });

  it('resets to initial state on sessionCleared', () => {
    const dirty = {
      sessionId: 'session-1',
      session: buildSession(),
      loading: true,
      ending: true,
      error: 'oops',
    };

    expect(sessionFeature.reducer(dirty, sessionActions.sessionCleared())).toEqual(initialSessionState);
  });
});
