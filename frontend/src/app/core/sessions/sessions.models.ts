export type SessionStatus = 'LIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface TestSession {
  id: string;
  campaignId: string;
  applicationId: string;
  testerId: string;
  startedAt: string;
  endedAt?: string | null;
  durationSeconds?: number | null;
  status: SessionStatus;

  finalFunRating?: number | null;
  finalDifficultyRating?: number | null;
  finalClarityRating?: number | null;
  finalComment?: string | null;

  campaign?: {
    id: string;
    title: string;
    type: string;
    instructions?: string;
    status: string;
    game: {
      id: string;
      title: string;
      description?: string;
      genre?: string;
      coverImageUrl?: string | null;
    };
    build: {
      id: string;
      version: string;
      buildUrl?: string;
      changelog?: string | null;
      status: string;
    };
  };

  _count?: {
    feedbackBytes: number;
  };
}

export interface EndSessionRequest {
  finalFunRating: number;
  finalDifficultyRating: number;
  finalClarityRating: number;
  finalComment?: string;
}