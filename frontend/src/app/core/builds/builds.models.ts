export type BuildStatus = 'ACTIVE' | 'ARCHIVED';

export interface GameBuild {
  id: string;
  gameId: string;
  version: string;
  buildUrl: string;
  changelog?: string | null;
  status: BuildStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBuildRequest {
  version: string;
  buildUrl: string;
  changelog?: string;
}

export interface UpdateBuildRequest {
  version?: string;
  buildUrl?: string;
  changelog?: string;
  status?: BuildStatus;
}
