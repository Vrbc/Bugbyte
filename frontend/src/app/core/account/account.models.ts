import { TesterLevel } from '../testers/testers.models';

interface AccountBase {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface DeveloperAccountProfile extends AccountBase {
  role: 'DEVELOPER';
  developerProfile: { studioName: string; bio: string | null; websiteUrl: string | null };
  testerProfile: null;
}

export interface TesterAccountProfile extends AccountBase {
  role: 'TESTER';
  developerProfile: null;
  testerProfile: {
    platforms: string[];
    favoriteGenres: string[];
    experienceLevel: string;
    rating: number;
    reputationPoints: number;
    level: TesterLevel;
  };
}

export type AccountProfile = DeveloperAccountProfile | TesterAccountProfile;

export type UpdateAccountRequest =
  | { studioName?: string; bio?: string; websiteUrl?: string }
  | { platforms?: string[]; favoriteGenres?: string[] };
