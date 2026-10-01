import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminUser, AdminUsersQuery } from './admin-users.models';
import { PaginatedResult } from '../shared/pagination.models';

@Injectable({
  providedIn: 'root',
})
export class AdminUsersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  getUsers(query: AdminUsersQuery): Observable<PaginatedResult<AdminUser>> {
    const params: Record<string, string | number> = {};
    if (query.page) params['page'] = query.page;
    if (query.limit) params['limit'] = query.limit;
    if (query.search) params['search'] = query.search;
    if (query.role) params['role'] = query.role;

    return this.http.get<PaginatedResult<AdminUser>>(`${this.apiUrl}/users`, { params });
  }

  deleteUser(id: string): Observable<{ id: string }> {
    return this.http.delete<{ id: string }>(`${this.apiUrl}/users/${id}`);
  }
}
