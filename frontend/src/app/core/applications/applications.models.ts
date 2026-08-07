export type ApplicationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface CampaignApplication {
  id: string;
  campaignId: string;
  testerId: string;
  message?: string | null;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;

  campaign?: {
    id: string;
    title: string;
    type: string;
    estimatedMinutes: number;
    status: string;
    game: {
      id: string;
      title: string;
      coverImageUrl?: string | null;
    };
    build: {
      id: string;
      version: string;
    };
    developer?: {
      id: string;
      username: string;
      developerProfile?: {
        studioName: string;
      } | null;
    };
    session?: {
      id: string;
      status: 'LIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
      startedAt: string;
      endedAt?: string | null;
      durationSeconds?: number | null;
      finalFunRating?: number | null;
      finalDifficultyRating?: number | null;
      finalClarityRating?: number | null;
      finalComment?: string | null;
    };
  };

  tester?: {
    id: string;
    username: string;
    email?: string;
    testerProfile?: {
      platforms: string[];
      favoriteGenres: string[];
      experienceLevel: string;
      rating: number;
      reputationPoints: number;
      level: string;
    };
  };
}

export interface UpdateApplicationStatusRequest {
  status: 'ACCEPTED' | 'REJECTED';
}
