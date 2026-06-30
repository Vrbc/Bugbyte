import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DeveloperDashboard,
  TesterDashboard,
} from './dashboard.models';


@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);

  getDeveloperDashboard(): Observable<DeveloperDashboard>{
    return this.http.get<DeveloperDashboard>(`${environment.apiUrl}/dashboard/developer`);
  }

  getTesterDashboard() : Observable<TesterDashboard> {
    return this.http.get<TesterDashboard>(`${environment.apiUrl}/dashboard/tester`);
  }
}
