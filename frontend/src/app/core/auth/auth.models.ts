export type UserRole = 'DEVELOPER' | 'TESTER' | 'ADMIN';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;

  studioName?: string;
  bio?: string;
  websiteUrl?: string;

  platforms?: string[];
  favoriteGenres?: string[];
  experienceLevel?: 'BEGINNER' | 'CASUAL' | 'EXPERIENCED' | 'QA_ORIENTED';
}