import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateGameRequest, Game, UpdateGameRequest } from './games.models';
import { PaginatedResult } from '../shared/pagination.models';

@Injectable({
  providedIn: 'root',
})
export class GamesService {
  private readonly apiUrl = `${environment.apiUrl}`;

  constructor(private readonly http: HttpClient) {}

  getMyGames(page = 1, limit = 20) : Observable<PaginatedResult<Game>> {
    return this.http.get<PaginatedResult<Game>>(`${this.apiUrl}/games/my`, {
      params: { page, limit },
    })
  }

  getGame(id: string) : Observable<Game>{
    return this.http.get<Game>(`${this.apiUrl}/games/${id}`)
  }

  createGame(data: CreateGameRequest) : Observable<Game> {
    return this.http.post<Game>(`${this.apiUrl}/games`, data)
  }

  updateGame(id: string, data: UpdateGameRequest) : Observable<Game> {
    return this.http.patch<Game>(`${this.apiUrl}/games/${id}`, data)
  }

  archiveGame(id: string): Observable<Game> {
    return this.http.delete<Game>(`${this.apiUrl}/games/${id}`);
  }
}
