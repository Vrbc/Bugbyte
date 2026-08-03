import { GameBuild } from "../builds/builds.models";
import { Game } from "../games/games.models";

export type CampaignType =
  | 'FIRST_IMPRESSION'
  | 'BUG_HUNT'
  | 'BALANCE_TEST'
  | 'TUTORIAL_CLARITY'
  | 'PERFORMANCE_CHECK'
  | 'UX_FEEDBACK';

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
  status?: CampaignStatus;
}
