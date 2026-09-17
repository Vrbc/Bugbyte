import { GameBuild } from "../builds/builds.models";
import { Game } from "../games/games.models";
import { FeedbackSeverity, FeedbackType } from "../feedback-bytes/feedback-bytes.models";

export type CampaignType =
  | 'FIRST_IMPRESSION'
  | 'BUG_HUNT'
  | 'BALANCE_TEST'
  | 'TUTORIAL_CLARITY'
  | 'PERFORMANCE_CHECK'
  | 'UX_FEEDBACK';

const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  FIRST_IMPRESSION: 'First Impression',
  BUG_HUNT: 'Bug Hunt',
  BALANCE_TEST: 'Balance Test',
  TUTORIAL_CLARITY: 'Tutorial Clarity',
  PERFORMANCE_CHECK: 'Performance Check',
  UX_FEEDBACK: 'UX Feedback',
};

export function campaignTypeLabel(type: CampaignType | undefined): string {
  return type ? CAMPAIGN_TYPE_LABELS[type] : '';
}

export type CampaignStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ARCHIVED';

export interface PlaytestCampaign {
  id: string;
  gameId: string;
  buildId: string;
  developerId: string;
  title: string;
  type: CampaignType;
  description?: string | null;
  instructions: string;
  requiredTesters: number;
  minTesterRating: number;
  requiredPlatforms: string[];
  estimatedMinutes: number;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;

  game?: Game;
  build?: GameBuild;

  _count?: {
    applications: number;
    sessions: number;
  };
}

export interface CreateCampaignRequest {
  gameId: string;
  buildId: string;
  title: string;
  type: CampaignType;
  description?: string;
  instructions: string;
  requiredTesters: number;
  minTesterRating: number;
  requiredPlatforms: string[];
  estimatedMinutes: number;
  status?: CampaignStatus;
}

export interface UpdateCampaignRequest {
  gameId?: string;
  buildId?: string;
  title?: string;
  type?: CampaignType;
  description?: string;
  instructions?: string;
  requiredTesters?: number;
  minTesterRating?: number;
  requiredPlatforms?: string[];
  estimatedMinutes?: number;
}

export interface CampaignTimelineBucket {
  bucketStart: number;
  feedbackCount: number;
  byType: Partial<Record<FeedbackType, number>>;
  bySeverity: Partial<Record<FeedbackSeverity, number>>;
  byTypeTesterCount: Partial<Record<FeedbackType, number>>;
  activeTesterCount: number;
}

export interface CampaignTimelineStats {
  bucketSeconds: number;
  buckets: CampaignTimelineBucket[];
  summary: {
    testersReporting: number;
    sessionsTotal: number;
    sessionsCompleted: number;
    avgFunRating: number | null;
    avgDifficultyRating: number | null;
    avgClarityRating: number | null;
    avgDurationSeconds: number | null;
    totalFeedbackCount: number;
  };
}

export interface PublicCampaign {
  id: string;
  title: string;
  type: CampaignType;
  requiredPlatforms: string[];
  estimatedMinutes: number;
  minTesterRating: number;
  status: CampaignStatus;
  createdAt: string;

  game: {
    id: string;
    title: string;
    genre: string;
    coverImageUrl?: string | null;
  };

  build: {
    id: string;
    version: string;
  };

  developer: {
    id: string;
    username: string;
    developerProfile?: {
      studioName: string;
    } | null;
  };

  _count?: {
    applications: number;
  };
}

export interface PublicCampaignDetails {
  id: string;
  title: string;
  type: CampaignType;
  description?: string | null;
  instructions: string;
  requiredTesters: number;
  requiredPlatforms: string[];
  estimatedMinutes: number;
  minTesterRating: number;
  status: CampaignStatus;
  createdAt: string;

  game: {
    id: string;
    title: string;
    description: string;
    genre: string;
    platforms: string[];
    coverImageUrl?: string | null;
  };

  build: {
    id: string;
    version: string;
    status: string;
  };

  developer: {
    id: string;
    username: string;
    developerProfile?: {
      studioName: string;
      bio?: string | null;
      websiteUrl?: string | null;
    } | null;
  };

  _count?: {
    applications: number;
    sessions: number;
  };
}
