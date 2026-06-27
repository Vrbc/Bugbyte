import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthUser, LoginRequest, LoginResponse, RegisterRequest } from './auth.models';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import { AUTH_TOKEN_KEY } from './auth.constants';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly tokenKey = AUTH_TOKEN_KEY;
  private readonly currentUserSignal = signal<AuthUser | null>(null);

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.currentUserSignal());

  register(data: RegisterRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/register`, data)
      .pipe(tap((response) => this.setSession(response)));
  }

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, data)
      .pipe(tap((response) => this.setSession(response)));
  }

  loadCurrentUser(): Observable<AuthUser> {
    return this.http
      .get<AuthUser>(`${this.apiUrl}/auth/me`)
      .pipe(tap((user) => this.currentUserSignal.set(user)));
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  redirectByRole(user: AuthUser): void {
    if (user.role === 'DEVELOPER') {
      this.router.navigate(['/developer/dashboard']);
      return;
    }

    if (user.role === 'TESTER') {
      this.router.navigate(['/tester/dashboard']);
      return;
    }

    if (user.role === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    this.router.navigate(['/auth/login']);
  }

  private setSession(response: LoginResponse): void {
    localStorage.setItem(this.tokenKey, response.accessToken);
    this.currentUserSignal.set(response.user);
  }
}
