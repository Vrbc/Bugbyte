import { TesterLevel } from '../testers/testers.models';

export interface DeveloperDashboard {
  stats: {
    gamesCount: number;
    campaignsCount: number;
    activeCampaignsCount: number;
    pendingApplicationsCount: number;
    liveSessionsCount: number;
    feedbackBytesCount: number;
  };
  recentCampaigns: any[];
  recentApplications: any[];
}

export interface TesterDashboard {
  profile: {
    rating: number;
    reputationPoints: number;
    level: TesterLevel;
    platforms: string[];
    favoriteGenres: string[];
    experienceLevel: string;
  };
  stats: {
    applicationsCount: number;
    pendingApplicationsCount: number;
    acceptedApplicationsCount: number;
    completedSessionsCount: number;
    feedbackBytesCount: number;
  };
  recentApplications: any[];
  recommendedCampaigns: any[];
}