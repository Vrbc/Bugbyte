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
