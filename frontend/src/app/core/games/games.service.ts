import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateGameRequest, Game, UpdateGameRequest } from './games.models';

@Injectable({
  providedIn: 'root',
})
export class GamesService {
  private readonly apiUrl = `${environment.apiUrl}`;

  constructor(private readonly http: HttpClient) {}
  
  getMyGames() : Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/games/my`)
  }

  getGame(id: string) : Observable<Game>{
    return this.http.get<Game>(`${this.apiUrl}/games/${id}`)
  }

  createGame(data: CreateGameRequest) : Observable<Game> {
    return this.http.post<Game>(`${this.apiUrl}/games`, data)
  }

  updateGame(data: UpdateGameRequest) : Observable<Game> {
    return this.http.patch<Game>(`${this.apiUrl}/games`, data)
  }

  archiveGame(id: string): Observable<Game> {
    return this.http.delete<Game>(`${this.apiUrl}/games/${id}`);
  }
}
