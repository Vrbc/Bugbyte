import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CampaignApplication, UpdateApplicationStatusRequest } from './applications.models';
import { PaginatedResult } from '../shared/pagination.models';

@Injectable({
  providedIn: 'root',
})
export class ApplicationsService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  getApplicationsForCampaign(campaignId: string, page = 1, limit = 20): Observable<PaginatedResult<CampaignApplication>> {
    return this.http.get<PaginatedResult<CampaignApplication>>(
      `${this.apiUrl}/campaigns/${campaignId}/applications`,
      { params: { page, limit } },
    );
  }

  updateApplicationStatus(
    id: string,
    data: UpdateApplicationStatusRequest,
  ): Observable<CampaignApplication> {
    return this.http.patch<CampaignApplication>(
      `${this.apiUrl}/applications/${id}/status`,
      data,
    );
  }

  applyToCampaign(
    campaignId: string,
    message?: string,
  ): Observable<CampaignApplication> {
    return this.http.post<CampaignApplication>(
      `${this.apiUrl}/campaigns/${campaignId}/apply`,
      {
        message,
      },
    );
  }

  getMyApplicationForCampaign(campaignId: string): Observable<CampaignApplication | null> {
    return this.http.get<CampaignApplication | null>(
      `${this.apiUrl}/campaigns/${campaignId}/my-application`,
    );
  }

  getMyApplications(page = 1, limit = 20): Observable<PaginatedResult<CampaignApplication>> {
    return this.http.get<PaginatedResult<CampaignApplication>>(
      `${this.apiUrl}/applications/my`,
      { params: { page, limit } },
    );
  }
}
