export type GameStatus = 'DRAFT' | 'TESTING' | 'ARCHIVED';

export interface Game {
  id: string;
  developerId: string;
  title: string;
  description: string;
  genre: string;
  platforms: string[];
  coverImageUrl?: string | null;
  status: GameStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGameRequest {
  title: string;
  description: string;
  genre: string;
  platforms: string[];
  coverImageUrl?: string;
  status?: GameStatus;
}

export interface UpdateGameRequest {
  title?: string;
  description?: string;
  genre?: string;
  platforms?: string[];
  coverImageUrl?: string;
  status?: GameStatus;
}
