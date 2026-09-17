import { createFeature, createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { FeedbackByte } from '../feedback-bytes.models';
import { feedbackBytesActions } from './feedback-bytes.actions';

export interface FeedbackBytesState extends EntityState<FeedbackByte> {
  page: number;
  totalPages: number;
  total: number;
  loading: boolean;
  loadingMore: boolean;
  submitting: boolean;
  error: string | null;
  submitError: string | null;
}

export const feedbackBytesAdapter = createEntityAdapter<FeedbackByte>({
  sortComparer: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
});

export const initialFeedbackBytesState: FeedbackBytesState = feedbackBytesAdapter.getInitialState({
  page: 1,
  totalPages: 1,
  total: 0,
  loading: false,
  loadingMore: false,
  submitting: false,
  error: null,
  submitError: null,
});

export const feedbackBytesFeature = createFeature({
  name: 'feedbackBytes',
  reducer: createReducer(
    initialFeedbackBytesState,
    on(
      feedbackBytesActions.loadSessionFeedbackBytes,
      feedbackBytesActions.loadCampaignFeedbackBytes,
      (state, { page }): FeedbackBytesState => {
        if (page === 1) {
          return feedbackBytesAdapter.removeAll({
            ...state,
            page: 1,
            totalPages: 1,
            total: 0,
            loading: true,
            loadingMore: false,
            error: null,
          });
        }

        return { ...state, loadingMore: true, error: null };
      },
    ),
    on(
      feedbackBytesActions.loadSessionFeedbackBytesSuccess,
      feedbackBytesActions.loadCampaignFeedbackBytesSuccess,
      (state, { result }): FeedbackBytesState =>
        feedbackBytesAdapter.upsertMany(result.items, {
          ...state,
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
          loading: false,
          loadingMore: false,
        }),
    ),
    on(
      feedbackBytesActions.loadSessionFeedbackBytesFailure,
      feedbackBytesActions.loadCampaignFeedbackBytesFailure,
      (state, { error }): FeedbackBytesState => ({
        ...state,
        loading: false,
        loadingMore: false,
        error,
      }),
    ),
    on(feedbackBytesActions.submitFeedbackByte, (state): FeedbackBytesState => ({
      ...state,
      submitting: true,
      submitError: null,
    })),
    on(feedbackBytesActions.submitFeedbackByteSuccess, (state, { feedbackByte }): FeedbackBytesState => {
      const isNew = !state.entities[feedbackByte.id];
      return feedbackBytesAdapter.upsertOne(feedbackByte, {
        ...state,
        submitting: false,
        total: isNew ? state.total + 1 : state.total,
      });
    }),
    on(feedbackBytesActions.submitFeedbackByteFailure, (state, { error }): FeedbackBytesState => ({
      ...state,
      submitting: false,
      submitError: error,
    })),
    // Pushed from the socket bridge effect - guarded against double-counting
    // `total` for feedback the current tab also just submitted itself, since
    // the server echoes new feedback back to the room its author is in too.
    on(feedbackBytesActions.feedbackByteReceived, (state, { feedbackByte }): FeedbackBytesState => {
      const isNew = !state.entities[feedbackByte.id];
      return feedbackBytesAdapter.upsertOne(feedbackByte, {
        ...state,
        total: isNew ? state.total + 1 : state.total,
      });
    }),
    on(feedbackBytesActions.feedbackBytesCleared, (): FeedbackBytesState => initialFeedbackBytesState),
  ),
});
