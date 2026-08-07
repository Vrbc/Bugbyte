export interface CreateTesterReviewRequest {
  rating: number;
  helpful: boolean;
  comment?: string;
}

export interface TesterReview {
  id: string;
  sessionId: string;
  developerId: string;
  testerId: string;
  rating: number;
  helpful: boolean;
  comment?: string | null;
  createdAt: string;
}