import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CreateFeedbackByteRequest, FeedbackByte } from './feedback-bytes.models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FeedbackBytesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  getFeedbackBytesForSession(sessionId: string): Observable<FeedbackByte[]> {
    return this.http.get<FeedbackByte[]>(
      `${this.apiUrl}/sessions/${sessionId}/feedback-bytes`,
    );
  }

  createFeedbackByte(
    sessionId: string,
    data: CreateFeedbackByteRequest,
  ): Observable<FeedbackByte> {
    
    return this.http.post<FeedbackByte>(
      `${this.apiUrl}/sessions/${sessionId}/feedback-bytes`,
      data,
    );
  }
}
