import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CampaignApplication, UpdateApplicationStatusRequest } from './applications.models';

@Injectable({
  providedIn: 'root',
})
export class ApplicationsService {
  
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  getApplicationsForCampaign(campaignId: string): Observable<CampaignApplication[]> {
    return this.http.get<CampaignApplication[]>(
      `${this.apiUrl}/campaigns/${campaignId}/applications`,
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

  getMyApplications(): Observable<CampaignApplication[]> {
    return this.http.get<CampaignApplication[]>(
      `${this.apiUrl}/applications/my`,
    );
  }
}
