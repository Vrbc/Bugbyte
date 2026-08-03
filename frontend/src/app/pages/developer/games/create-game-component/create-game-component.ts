import { Component, OnInit, signal } from '@angular/core';
import { GameStatus } from '../../../../core/games/games.models';
import { GamesService } from '../../../../core/games/games.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-game-component',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-game-component.html',
  styleUrl: './create-game-component.scss',
})
export class CreateGameComponent{ 
  title = '';
  description = '';
  genre = '';
  coverImageUrl = '';
  status: GameStatus = 'DRAFT';

  avalaiblePlatforms = ['PC', 'Web', 'Android', 'iOS', 'Xbox','PlayStation']
  selectedPlatforms: string[] = [];

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private readonly gamesService: GamesService,
    private readonly router: Router,
  ) {}

  togglePlatform(platform: string) : void {
    if(this.selectedPlatforms.includes(platform)) {
      this.selectedPlatforms = this.selectedPlatforms.filter((item) => item !== platform);
      return;
    }

    this.selectedPlatforms = [... this.selectedPlatforms, platform];
  }

  submit() : void {
    this.errorMessage.set(null);

    if(this.selectedPlatforms.length === 0){
      this.errorMessage.set('Chose at least one platform');
      return;
    }

    this.loading.set(true);

    
    this.gamesService.createGame({
      title: this.title,
      description: this.description,
      genre: this.genre,
      platforms: this.selectedPlatforms,
      coverImageUrl: this.coverImageUrl || undefined,
      status: this.status,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/developer/games']);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error?.error?.errorMessage || 'Failed to create game');
      }
    });
  }
}
