import { Component, OnInit, signal } from '@angular/core';
import { Game } from '../../../../core/games/games.models';
import { GameBuild } from '../../../../core/builds/builds.models';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GamesService } from '../../../../core/games/games.service';
import { BuildsService } from '../../../../core/builds/builds.service';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-game-details-component',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './game-details-component.html',
  styleUrl: './game-details-component.scss',
})
export class GameDetailsComponent implements OnInit {
  game = signal<Game | null>(null);
  builds = signal<GameBuild[]>([]);

  loading = signal(true);
  errorMessage = signal<string | null>(null);
  buildErrorMessage = signal<string | null>(null);

  version = '';
  buildUrl = '';
  changelog = '';

  creatingBuild = signal(false);

  private gameId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly gamesService: GamesService,
    private readonly buildsService: BuildsService,
  ) {}


  ngOnInit(): void {
    this.gameId = this.route.snapshot.paramMap.get('id') || '';
    this.loadPage();
  }

   loadPage(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      game: this.gamesService.getGame(this.gameId),
      builds: this.buildsService.getBuildsForGame(this.gameId),
    }).subscribe({
      next: ({ game, builds }) => {
        this.game.set(game);
        this.builds.set(builds);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load game details.');
        this.loading.set(false);
      },
    });
  }

  createBuild(): void {
    this.buildErrorMessage.set(null);

    if (!this.version.trim() || !this.buildUrl.trim()) {
      this.buildErrorMessage.set('Version and build URL are required.');
      return;
    }

    this.creatingBuild.set(true);

    this.buildsService.createBuild(this.gameId, {
      version: this.version,
      buildUrl: this.buildUrl,
      changelog: this.changelog || undefined,
    }).subscribe({
      next: () => {
        this.version = '';
        this.buildUrl = '';
        this.changelog = '';
        this.creatingBuild.set(false);
        this.loadBuilds();
      },
      error: (error) => {
        this.creatingBuild.set(false);
        this.buildErrorMessage.set(
          error?.error?.message || 'Failed to create build.',
        );
      },
    });
  }

  archiveBuild(build: GameBuild): void {
    const confirmed = confirm(`Archive build ${build.version}?`);

    if (!confirmed) {
      return;
    }

    this.buildsService.archiveBuild(build.id).subscribe({
      next: () => this.loadBuilds(),
      error: () => this.buildErrorMessage.set('Failed to archive build.'),
    });
  }

  private loadBuilds(): void {
    this.buildsService.getBuildsForGame(this.gameId).subscribe({
      next: (builds) => this.builds.set(builds),
      error: () => this.buildErrorMessage.set('Failed to reload builds.'),
    });
  }

}
