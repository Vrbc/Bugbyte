import { FeedbackByte } from '../feedback-bytes.models';
import { feedbackBytesActions } from './feedback-bytes.actions';
import { feedbackBytesAdapter, feedbackBytesFeature, initialFeedbackBytesState } from './feedback-bytes.reducer';

const buildByte = (overrides: Partial<FeedbackByte> = {}): FeedbackByte => ({
  id: 'byte-1',
  sessionId: 'session-1',
  testerId: 'tester-1',
  type: 'BUG',
  timestampSeconds: 10,
  comment: 'Looks broken',
  createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  ...overrides,
});

describe('feedbackBytesFeature reducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = feedbackBytesFeature.reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialFeedbackBytesState);
  });

  it('clears the collection up front on a page-1 load, before the response arrives', () => {
    const dirty = feedbackBytesAdapter.setAll(
      [buildByte({ id: 'stale-from-another-session' })],
      { ...initialFeedbackBytesState, total: 1 },
    );

    const state = feedbackBytesFeature.reducer(
      dirty,
      feedbackBytesActions.loadSessionFeedbackBytes({ sessionId: 'session-2', page: 1 }),
    );

    expect(state.ids).toEqual([]);
    expect(state.total).toBe(0);
    expect(state.loading).toBe(true);
  });

  it('does not clear the collection when loading a subsequent page', () => {
    const existing = feedbackBytesAdapter.setAll([buildByte()], { ...initialFeedbackBytesState, page: 1 });

    const state = feedbackBytesFeature.reducer(
      existing,
      feedbackBytesActions.loadSessionFeedbackBytes({ sessionId: 'session-1', page: 2 }),
    );

    expect(state.ids).toEqual(['byte-1']);
    expect(state.loadingMore).toBe(true);
  });

  it('sorts newest first regardless of insertion order', () => {
    const older = buildByte({ id: 'older', createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString() });
    const newer = buildByte({ id: 'newer', createdAt: new Date('2026-01-02T00:00:00.000Z').toISOString() });

    const state = feedbackBytesFeature.reducer(
      initialFeedbackBytesState,
      feedbackBytesActions.loadSessionFeedbackBytesSuccess({
        result: { items: [older, newer], total: 2, page: 1, limit: 20, totalPages: 1 },
      }),
    );

    expect(state.ids).toEqual(['newer', 'older']);
  });

  it('increments total once for a submitted byte later echoed back over the socket', () => {
    const submitted = buildByte();

    const afterSubmit = feedbackBytesFeature.reducer(
      { ...initialFeedbackBytesState, submitting: true },
      feedbackBytesActions.submitFeedbackByteSuccess({ feedbackByte: submitted }),
    );
    expect(afterSubmit.total).toBe(1);
    expect(afterSubmit.submitting).toBe(false);

    const afterEcho = feedbackBytesFeature.reducer(
      afterSubmit,
      feedbackBytesActions.feedbackByteReceived({ feedbackByte: submitted }),
    );
    expect(afterEcho.total).toBe(1);
    expect(afterEcho.ids.length).toBe(1);
  });

  it('records the error message on submitFeedbackByteFailure', () => {
    const state = feedbackBytesFeature.reducer(
      { ...initialFeedbackBytesState, submitting: true },
      feedbackBytesActions.submitFeedbackByteFailure({ error: 'Failed to submit feedback.' }),
    );

    expect(state.submitting).toBe(false);
    expect(state.submitError).toBe('Failed to submit feedback.');
  });

  it('resets to initial state on feedbackBytesCleared', () => {
    const dirty = feedbackBytesAdapter.setAll([buildByte()], {
      ...initialFeedbackBytesState,
      total: 1,
      loading: true,
      error: 'oops',
    });

    expect(feedbackBytesFeature.reducer(dirty, feedbackBytesActions.feedbackBytesCleared())).toEqual(
      initialFeedbackBytesState,
    );
  });
});
