import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Game, GameStatus } from '../../../../core/games/games.models';
import { GamesService } from '../../../../core/games/games.service';

@Component({
  selector: 'app-edit-game-component',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './edit-game-component.html',
  styleUrl: './edit-game-component.scss',
})
export class EditGameComponent implements OnInit {
  game = signal<Game | null>(null);

  title = '';
  description = '';
  genre = '';
  coverImageUrl = '';
  status: GameStatus = 'DRAFT';

  availablePlatforms = ['PC', 'Web', 'Android', 'iOS'];
  selectedPlatforms: string[] = [];

  loading = signal(true);
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  gameId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly gamesService: GamesService,
  ) {}

  ngOnInit(): void {
    this.gameId = this.route.snapshot.paramMap.get('id') || '';
    this.loadGame();
  }

  loadGame(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.gamesService.getGame(this.gameId).subscribe({
      next: (game) => {
        this.game.set(game);

        this.title = game.title;
        this.description = game.description;
        this.genre = game.genre;
        this.coverImageUrl = game.coverImageUrl || '';
        this.status = game.status;
        this.selectedPlatforms = [...game.platforms];

        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load game.');
        this.loading.set(false);
      },
    });
  }

  togglePlatform(platform: string): void {
    if (this.selectedPlatforms.includes(platform)) {
      this.selectedPlatforms = this.selectedPlatforms.filter((item) => item !== platform);
      return;
    }

    this.selectedPlatforms = [...this.selectedPlatforms, platform];
  }

  submit(): void {
    this.errorMessage.set(null);

    if (!this.title.trim()) {
      this.errorMessage.set('Title is required.');
      return;
    }

    if (!this.description.trim()) {
      this.errorMessage.set('Description is required.');
      return;
    }

    if (!this.genre.trim()) {
      this.errorMessage.set('Genre is required.');
      return;
    }

    if (this.selectedPlatforms.length === 0) {
      this.errorMessage.set('Choose at least one platform.');
      return;
    }

    this.saving.set(true);

    this.gamesService.updateGame(this.gameId, {
      title: this.title,
      description: this.description,
      genre: this.genre,
      platforms: this.selectedPlatforms,
      coverImageUrl: this.coverImageUrl || undefined,
      status: this.status,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/developer/games', this.gameId]);
      },
      error: (error) => {
        this.saving.set(false);
        this.errorMessage.set(
          error?.error?.message || 'Failed to update game.',
        );
      },
    });
  }
}
