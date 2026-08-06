export type FeedbackType =
  | 'BUG'
  | 'CONFUSION'
  | 'SUGGESTION'
  | 'POSITIVE'
  | 'DIFFICULTY_SPIKE'
  | 'COMMENT';

export type FeedbackSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface FeedbackByte {
  id: string;
  sessionId: string;
  testerId: string;
  type: FeedbackType;
  timestampSeconds: number;
  severity?: FeedbackSeverity | null;
  comment: string;
  reproductionSteps?: string | null;
  screenshotUrl?: string | null;
  createdAt: string;

  tester?: {
    id: string;
    username: string;
  };
}

export interface CreateFeedbackByteRequest {
  type: FeedbackType;
  timestampSeconds: number;
  severity?: FeedbackSeverity;
  comment: string;
  reproductionSteps?: string;
  screenshotUrl?: string;
}
