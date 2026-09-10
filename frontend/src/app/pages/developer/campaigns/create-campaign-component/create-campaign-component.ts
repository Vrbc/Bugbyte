import { Component, OnInit, signal } from '@angular/core';
import { CampaignStatus, CampaignType } from '../../../../core/campaigns/campaigns.models';
import { Game } from '../../../../core/games/games.models';
import { GameBuild } from '../../../../core/builds/builds.models';
import { GamesService } from '../../../../core/games/games.service';
import { BuildsService } from '../../../../core/builds/builds.service';
import { CampaignsService } from '../../../../core/campaigns/campaigns.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-campaign-component',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './create-campaign-component.html',
  styleUrl: './create-campaign-component.scss',
})
export class CreateCampaignComponent implements OnInit {
  games = signal<Game[]>([]);
  builds = signal<GameBuild[]>([]);
  loadingGames = signal(true);
  loadingBuilds = signal(false);
  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  gameId = '';
  buildId = '';
  title = '';
  type: CampaignType = 'FIRST_IMPRESSION';
  description = '';
  instructions = '';
  requiredTesters = 5;
  minTesterRating = 0;
  estimatedMinutes = 30;
  status: CampaignStatus = 'DRAFT';

  availablePlatforms = ['PC', 'Web', 'Android', 'iOS'];
  selectedPlatforms: string[] = [];

  campaignTypes: CampaignType[] = [
    'FIRST_IMPRESSION',
    'BUG_HUNT',
    'BALANCE_TEST',
    'TUTORIAL_CLARITY',
    'PERFORMANCE_CHECK',
    'UX_FEEDBACK',
  ];
  constructor(
    private readonly gamesService: GamesService,
    private readonly buildsService: BuildsService,
    private readonly campaignsService: CampaignsService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.gamesService.getMyGames(1, 100).subscribe({
      next: (result) => {
        this.games.set(result.items.filter((game) => game.status !== 'ARCHIVED'));
        this.loadingGames.set(false);
      }, error: () => {
        this.errorMessage.set('Failed to load games.');
        this.loadingGames.set(false);
      },
    });
  }

  onGameChange(): void {
    this.buildId = '';
    this.builds.set([]);

    if (!this.gameId) {
      return;
    }

    this.loadingBuilds.set(true);
    this.buildsService.getBuildsForGame(this.gameId).subscribe({
      next: (builds) => {
        this.builds.set(builds.filter((build) => build.status === 'ACTIVE'));
        this.loadingBuilds.set(false);
      }, error: () => {
        this.errorMessage.set('Failed to load builds for selected game.');
        this.loadingBuilds.set(false);
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

    if (!this.gameId || !this.buildId) {
      this.errorMessage.set('Choose a game and build.');
      return;
    }

    if (this.selectedPlatforms.length === 0) {
      this.errorMessage.set('Choose at least one required platform.');
      return;
    }

    this.submitting.set(true);

    this.campaignsService.createCampaign({
      gameId: this.gameId,
      buildId: this.buildId,
      title: this.title,
      type: this.type,
      description: this.description || undefined,
      instructions: this.instructions,
      requiredTesters: Number(this.requiredTesters),
      minTesterRating: Number(this.minTesterRating),
      requiredPlatforms: this.selectedPlatforms,
      estimatedMinutes: Number(this.estimatedMinutes),
      status: this.status,
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/developer/campaigns']);
      },
      error: (error) => {
        this.submitting.set(false);
        this.errorMessage.set(
          error?.error?.message || 'Failed to create campaign.',
        );
      },
    });
  }
}
