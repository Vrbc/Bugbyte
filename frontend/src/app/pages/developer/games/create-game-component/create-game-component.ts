import { Component, OnDestroy, signal } from '@angular/core';
import { GameStatus } from '../../../../core/games/games.models';
import { GamesService } from '../../../../core/games/games.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable, of, switchMap } from 'rxjs';
import { UploadImageResponse, UploadsService } from '../../../../core/uploads/uploads.service';
import { extractImageFromClipboard } from '../../../../core/uploads/clipboard-image.util';

@Component({
  selector: 'app-create-game-component',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-game-component.html',
  styleUrl: './create-game-component.scss',
})
export class CreateGameComponent implements OnDestroy {
  title = '';
  description = '';
  genre = '';
  status: GameStatus = 'DRAFT';

  avalaiblePlatforms = ['PC', 'Web', 'Android', 'iOS', 'Xbox','PlayStation']
  selectedPlatforms: string[] = [];

  selectedCoverFile: File | null = null;
  coverPreviewUrl = signal<string | null>(null);

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private readonly gamesService: GamesService,
    private readonly uploadsService: UploadsService,
    private readonly router: Router,
  ) {}

  ngOnDestroy(): void {
    const previewUrl = this.coverPreviewUrl();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }

  togglePlatform(platform: string) : void {
    if(this.selectedPlatforms.includes(platform)) {
      this.selectedPlatforms = this.selectedPlatforms.filter((item) => item !== platform);
      return;
    }

    this.selectedPlatforms = [... this.selectedPlatforms, platform];
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

  submit() : void {
    this.errorMessage.set(null);

    if(this.selectedPlatforms.length === 0){
      this.errorMessage.set('Chose at least one platform');
      return;
    }

    this.loading.set(true);

    const upload$: Observable<UploadImageResponse | null> = this.selectedCoverFile
      ? this.uploadsService.uploadImage(this.selectedCoverFile)
      : of(null);

    upload$.pipe(
      switchMap((uploadResult) =>
        this.gamesService.createGame({
          title: this.title,
          description: this.description,
          genre: this.genre,
          platforms: this.selectedPlatforms,
          coverImageUrl: uploadResult?.url,
          status: this.status,
        }),
      ),
    ).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/developer/games']);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error?.error?.message || 'Failed to create game');
      }
    });
  }
}
