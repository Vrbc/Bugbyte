import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { CreateBuildRequest, GameBuild, UpdateBuildRequest } from './builds.models';

@Injectable({
  providedIn: 'root',
})
export class BuildsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  getBuildsForGame(gameId: string) : Observable<GameBuild[]> {
    return this.http.get<GameBuild[]>(`${this.apiUrl}/games/${gameId}/builds`);
  }

  createBuild(gameId: string, data : CreateBuildRequest): Observable<GameBuild> {
    return this.http.post<GameBuild>(
      `${this.apiUrl}/games/${gameId}/builds`,
      data,
    );
  }

  updateBuild(id: string, data: UpdateBuildRequest): Observable<GameBuild> {
    return this.http.patch<GameBuild>(`${this.apiUrl}/builds/${id}`, data);
  }

  archiveBuild(id: string): Observable<GameBuild> {
    return this.http.delete<GameBuild>(`${this.apiUrl}/builds/${id}`);
  }
}
