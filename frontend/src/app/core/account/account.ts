import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AccountProfile, UpdateAccountRequest } from './account.models';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getMyAccount(): Observable<AccountProfile> {
    return this.http.get<AccountProfile>(`${this.apiUrl}/account/me`);
  }

  updateMyAccount(data: UpdateAccountRequest): Observable<AccountProfile> {
    return this.http.patch<AccountProfile>(`${this.apiUrl}/account/me`, data);
  }
}
