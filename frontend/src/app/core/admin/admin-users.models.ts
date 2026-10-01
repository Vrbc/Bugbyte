import { PaginatedResult } from '../shared/pagination.models';

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: 'DEVELOPER' | 'TESTER';
  developerProfile: { id: string } | null;
  testerProfile: { id: string; rating: number; level: string } | null;
  createdAt: string;
}

export interface AdminUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'DEVELOPER' | 'TESTER';
}

export type AdminUsersResponse = PaginatedResult<AdminUser>;
