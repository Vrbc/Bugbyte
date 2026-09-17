import { Component, OnInit, signal } from '@angular/core';
import { Game } from '../../../../core/games/games.models';
import { GamesService } from '../../../../core/games/games.service';
import { RouterLink } from '@angular/router';
import { ResolveUploadUrlPipe } from '../../../../core/uploads/resolve-upload-url.pipe';
import { Card } from '../../../../shared/ui/card/card';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { Button, buttonClasses } from '../../../../shared/ui/button/button';
import { Pagination } from '../../../../shared/ui/pagination/pagination';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';

@Component({
  selector: 'app-developer-games-component',
  imports: [RouterLink, ResolveUploadUrlPipe, Card, StatusBadge, Button, Pagination, LoadingSpinner],
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

  protected readonly primaryLinkClasses = buttonClasses('primary');
  protected readonly secondaryLinkClasses = buttonClasses('secondary');

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
