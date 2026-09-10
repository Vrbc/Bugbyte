import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CreateFeedbackByteRequest, FeedbackByte } from './feedback-bytes.models';
import { Observable } from 'rxjs';
import { PaginatedResult } from '../shared/pagination.models';

@Injectable({
  providedIn: 'root',
})
export class FeedbackBytesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  getFeedbackBytesForSession(sessionId: string, page = 1, limit = 20): Observable<PaginatedResult<FeedbackByte>> {
    return this.http.get<PaginatedResult<FeedbackByte>>(
      `${this.apiUrl}/sessions/${sessionId}/feedback-bytes`,
      { params: { page, limit } },
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
