import { Component, OnInit, signal } from '@angular/core';
import { Game } from '../../../../core/games/games.models';
import { GamesService } from '../../../../core/games/games.service';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ResolveUploadUrlPipe } from '../../../../core/uploads/resolve-upload-url.pipe';

@Component({
  selector: 'app-developer-games-component',
  imports: [NgClass, RouterLink, ResolveUploadUrlPipe],
  templateUrl: './developer-games-component.html',
  styleUrl: './developer-games-component.scss',
})
export class DeveloperGamesComponent implements OnInit {
  games = signal<Game[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  page = signal(1);
  totalPages = signal(1);
  total = signal(0);

  constructor(private readonly gamesService: GamesService) {}

  ngOnInit(): void {
    this.loadGames(1);
  }

  loadGames(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.gamesService.getMyGames(page).subscribe({
      next: (result) => {
        this.games.set(result.items);
        this.page.set(result.page);
        this.totalPages.set(result.totalPages);
        this.total.set(result.total);
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
      next: () => this.loadGames(this.page()),
      error: () => this.errorMessage.set(`Failed to archive game`),
    })
  }
}
