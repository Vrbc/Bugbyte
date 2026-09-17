import { createSelector } from '@ngrx/store';
import { feedbackBytesAdapter, feedbackBytesFeature } from './feedback-bytes.reducer';

export const {
  selectFeedbackBytesState,
  selectPage: selectFeedbackBytesPage,
  selectTotalPages: selectFeedbackBytesTotalPages,
  selectTotal: selectFeedbackBytesTotal,
  selectLoading: selectFeedbackBytesLoading,
  selectLoadingMore: selectFeedbackBytesLoadingMore,
  selectSubmitting: selectFeedbackBytesSubmitting,
  selectError: selectFeedbackBytesError,
  selectSubmitError: selectFeedbackBytesSubmitError,
} = feedbackBytesFeature;

const { selectAll } = feedbackBytesAdapter.getSelectors();

export const selectAllFeedbackBytes = createSelector(selectFeedbackBytesState, selectAll);
