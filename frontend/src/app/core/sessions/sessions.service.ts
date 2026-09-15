import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CampaignApplication } from '../applications/applications.models';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { EndSessionRequest, TestSession } from './sessions.models';

@Injectable({
  providedIn: 'root',
})
export class SessionsService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  startSession(applicationId: string): Observable<TestSession> {
    return this.http.post<TestSession>(
      `${this.apiUrl}/applications/${applicationId}/start-session`,
      {},
    );
  }

  getMySessions(): Observable<TestSession[]> {
    return this.http.get<TestSession[]>(`${this.apiUrl}/sessions/my`);
  }

  getSession(id: string): Observable<TestSession> {
    return this.http.get<TestSession>(`${this.apiUrl}/sessions/${id}`);
  }

  endSession(id: string, data: EndSessionRequest): Observable<TestSession> {
    return this.http.patch<TestSession>(
      `${this.apiUrl}/sessions/${id}/end`,
      data,
    );
  }

  pauseSession(id: string): Observable<TestSession> {
    return this.http.patch<TestSession>(`${this.apiUrl}/sessions/${id}/pause`, {});
  }

  resumeSession(id: string): Observable<TestSession> {
    return this.http.patch<TestSession>(`${this.apiUrl}/sessions/${id}/resume`, {});
  }

}
