import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateCampaignRequest, PlaytestCampaign, PublicCampaign, PublicCampaignDetails, UpdateCampaignRequest } from './campaigns.models';

@Injectable({
  providedIn: 'root',
})
export class CampaignsService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  getMyCampaigns(): Observable<PlaytestCampaign[]> {
    return this.http.get<PlaytestCampaign[]>(`${this.apiUrl}/campaigns/my`);
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

  archiveCampaign(id: string): Observable<PlaytestCampaign> {
    return this.http.delete<PlaytestCampaign>(`${this.apiUrl}/campaigns/${id}`);
  }

  getPublicCampaigns(): Observable<PublicCampaign[]> {
    return this.http.get<PublicCampaign[]>(`${this.apiUrl}/campaigns/public`);
  }

  getPublicCampaign(id: string): Observable<PublicCampaignDetails> {
    return this.http.get<PublicCampaignDetails>(
      `${this.apiUrl}/campaigns/public/${id}`,
    );
  }
}
