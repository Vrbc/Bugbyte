import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { Game, GameStatus } from '../../../../core/games/games.models';
import { GamesService } from '../../../../core/games/games.service';
import { UploadImageResponse, UploadsService } from '../../../../core/uploads/uploads.service';
import { ResolveUploadUrlPipe } from '../../../../core/uploads/resolve-upload-url.pipe';
import { extractImageFromClipboard } from '../../../../core/uploads/clipboard-image.util';
import { Card } from '../../../../shared/ui/card/card';
import { Input } from '../../../../shared/ui/input/input';
import { Select } from '../../../../shared/ui/select/select';
import { Button, buttonClasses } from '../../../../shared/ui/button/button';
import { ToggleChipGroup } from '../../../../shared/ui/toggle-chip-group/toggle-chip-group';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';

@Component({
  selector: 'app-edit-game-component',
  imports: [FormsModule, RouterLink, ResolveUploadUrlPipe, Card, Input, Select, Button, ToggleChipGroup, LoadingSpinner],
  templateUrl: './edit-game-component.html',
  styleUrl: './edit-game-component.scss',
})
export class EditGameComponent implements OnInit, OnDestroy {
  game = signal<Game | null>(null);

  title = '';
  description = '';
  genre = '';
  coverImageUrl = '';
  status: GameStatus = 'DRAFT';

  availablePlatforms = ['PC', 'Web', 'Android', 'iOS'];
  selectedPlatforms: string[] = [];

  selectedCoverFile: File | null = null;
  coverPreviewUrl = signal<string | null>(null);

  loading = signal(true);
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  protected readonly secondaryLinkClasses = buttonClasses('secondary');

  gameId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly gamesService: GamesService,
    private readonly uploadsService: UploadsService,
  ) {}

  ngOnInit(): void {
    this.gameId = this.route.snapshot.paramMap.get('id') || '';
    this.loadGame();
  }

  ngOnDestroy(): void {
    const previewUrl = this.coverPreviewUrl();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
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

  onCoverFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.setCoverFile(file);
  }

  onCoverPaste(event: ClipboardEvent): void {
    const file = extractImageFromClipboard(event);
    if (!file) {
      return;
    }

    event.preventDefault();
    this.setCoverFile(file);
  }

  private setCoverFile(file: File): void {
    const previewUrl = this.coverPreviewUrl();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    this.selectedCoverFile = file;
    this.coverPreviewUrl.set(URL.createObjectURL(file));
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

    const upload$: Observable<UploadImageResponse | null> = this.selectedCoverFile
      ? this.uploadsService.uploadImage(this.selectedCoverFile)
      : of(null);

    upload$.pipe(
      switchMap((uploadResult) =>
        this.gamesService.updateGame(this.gameId, {
          title: this.title,
          description: this.description,
          genre: this.genre,
          platforms: this.selectedPlatforms,
          coverImageUrl: uploadResult?.url ?? (this.coverImageUrl || undefined),
          status: this.status,
        }),
      ),
    ).subscribe({
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
