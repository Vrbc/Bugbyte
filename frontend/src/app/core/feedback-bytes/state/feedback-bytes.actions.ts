import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { CreateFeedbackByteRequest, FeedbackByte, FeedbackType } from '../feedback-bytes.models';
import { PaginatedResult } from '../../shared/pagination.models';

export const feedbackBytesActions = createActionGroup({
  source: 'FeedbackBytes',
  events: {
    'Load Session Feedback Bytes': props<{ sessionId: string; page: number }>(),
    'Load Session Feedback Bytes Success': props<{ result: PaginatedResult<FeedbackByte> }>(),
    'Load Session Feedback Bytes Failure': props<{ error: string }>(),

    'Load Campaign Feedback Bytes': props<{
      campaignId: string;
      feedbackType: FeedbackType;
      fromSeconds: number;
      toSeconds: number;
      page: number;
    }>(),
    'Load Campaign Feedback Bytes Success': props<{ result: PaginatedResult<FeedbackByte> }>(),
    'Load Campaign Feedback Bytes Failure': props<{ error: string }>(),

    'Submit Feedback Byte': props<{ sessionId: string; request: CreateFeedbackByteRequest }>(),
    'Submit Feedback Byte Success': props<{ feedbackByte: FeedbackByte }>(),
    'Submit Feedback Byte Failure': props<{ error: string }>(),

    'Feedback Byte Received': props<{ feedbackByte: FeedbackByte }>(),
    'Feedback Bytes Cleared': emptyProps(),
  },
});
