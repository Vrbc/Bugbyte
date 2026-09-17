import { sessionFeature } from './session.reducer';

export const {
  selectSessionState,
  selectSessionId,
  selectSession,
  selectLoading: selectSessionLoading,
  selectEnding: selectSessionEnding,
  selectError: selectSessionError,
} = sessionFeature;
