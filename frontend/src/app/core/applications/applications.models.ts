import { CampaignType } from '../campaigns/campaigns.models';
import { TesterLevel } from '../testers/testers.models';

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
    type: CampaignType;
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
      buildUrl?: string | null;
    };
    developer?: {
      id: string;
      username: string;
      developerProfile?: {
        studioName: string;
      } | null;
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
      level: TesterLevel;
    };
  };

  testSession?: {
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
}

export interface UpdateApplicationStatusRequest {
  status: 'ACCEPTED' | 'REJECTED';
}
