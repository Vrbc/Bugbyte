import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CreateTesterReviewRequest, TesterReview } from './reviews.models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReviewsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  createTesterReview(
    sessionId: string,
    data: CreateTesterReviewRequest,
  ): Observable<TesterReview> {
    return this.http.post<TesterReview>(
      `${this.apiUrl}/sessions/${sessionId}/review`,
      data,
    );
  }

}
