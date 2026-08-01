import { Component, OnInit, signal } from '@angular/core';
import { Game } from '../../../../core/games/games.models';
import { GamesService } from '../../../../core/games/games.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-developer-games-component',
  imports: [NgClass],
  templateUrl: './developer-games-component.html',
  styleUrl: './developer-games-component.scss',
})
export class DeveloperGamesComponent implements OnInit {
  games = signal<Game[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  constructor(private readonly gamesService: GamesService) {}

  ngOnInit(): void {
    this.loadGames();
  }

  loadGames(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.gamesService.getMyGames().subscribe({
      next: (games) => {
        this.games.set(games);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load games');
        this.loading.set(false);
      }
    });
  }

  archiveGame(game: Game) : void {
    const confirmed = confirm(`Archive "${game.title}"?`);

    if(!confirmed) return;

    this.gamesService.archiveGame(game.id).subscribe({
      next: () => this.loadGames(),
      error: () => this.errorMessage.set(`Failed to archive game`),
    })
  }
}
