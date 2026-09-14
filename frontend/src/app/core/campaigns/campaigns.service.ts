import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CampaignTimelineStats, CreateCampaignRequest, PlaytestCampaign, PublicCampaign, PublicCampaignDetails, UpdateCampaignRequest } from './campaigns.models';
import { PaginatedResult } from '../shared/pagination.models';

@Injectable({
  providedIn: 'root',
})
export class CampaignsService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  getMyCampaigns(page = 1, limit = 20): Observable<PaginatedResult<PlaytestCampaign>> {
    return this.http.get<PaginatedResult<PlaytestCampaign>>(`${this.apiUrl}/campaigns/my`, {
      params: { page, limit },
    });
  }

  getCampaign(id: string): Observable<PlaytestCampaign> {
    return this.http.get<PlaytestCampaign>(`${this.apiUrl}/campaigns/${id}`);
  }

  createCampaign(data: CreateCampaignRequest): Observable<PlaytestCampaign> {
    return this.http.post<PlaytestCampaign>(`${this.apiUrl}/campaigns`, data);
  }

  updateCampaign(
    id: string,
    data: UpdateCampaignRequest,
  ): Observable<PlaytestCampaign> {
    return this.http.patch<PlaytestCampaign>(
      `${this.apiUrl}/campaigns/${id}`,
      data,
    );
  }

  getCampaignTimeline(id: string): Observable<CampaignTimelineStats> {
    return this.http.get<CampaignTimelineStats>(`${this.apiUrl}/campaigns/${id}/timeline`);
  }

  publishCampaign(id: string): Observable<PlaytestCampaign> {
    return this.http.patch<PlaytestCampaign>(`${this.apiUrl}/campaigns/${id}/publish`, {});
  }

  pauseCampaign(id: string): Observable<PlaytestCampaign> {
    return this.http.patch<PlaytestCampaign>(`${this.apiUrl}/campaigns/${id}/pause`, {});
  }

  resumeCampaign(id: string): Observable<PlaytestCampaign> {
    return this.http.patch<PlaytestCampaign>(`${this.apiUrl}/campaigns/${id}/resume`, {});
  }

  completeCampaign(id: string): Observable<PlaytestCampaign> {
    return this.http.patch<PlaytestCampaign>(`${this.apiUrl}/campaigns/${id}/complete`, {});
  }

  archiveCampaign(id: string): Observable<PlaytestCampaign> {
    return this.http.patch<PlaytestCampaign>(`${this.apiUrl}/campaigns/${id}/archive`, {});
  }

  getPublicCampaigns(
    page = 1,
    limit = 20,
    search?: string,
    platform?: string,
  ): Observable<PaginatedResult<PublicCampaign>> {
    const params: Record<string, string | number> = { page, limit };
    if (search) {
      params['search'] = search;
    }
    if (platform) {
      params['platform'] = platform;
    }

    return this.http.get<PaginatedResult<PublicCampaign>>(`${this.apiUrl}/campaigns/public`, {
      params,
    });
  }

  getPublicCampaign(id: string): Observable<PublicCampaignDetails> {
    return this.http.get<PublicCampaignDetails>(
      `${this.apiUrl}/campaigns/public/${id}`,
    );
  }
}
