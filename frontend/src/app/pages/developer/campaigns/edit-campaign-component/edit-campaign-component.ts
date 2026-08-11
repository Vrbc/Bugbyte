import { Component, signal } from '@angular/core';
import { CampaignStatus, CampaignType, PlaytestCampaign } from '../../../../core/campaigns/campaigns.models';
import { Game } from '../../../../core/games/games.models';
import { GameBuild } from '../../../../core/builds/builds.models';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GamesService } from '../../../../core/games/games.service';
import { BuildsService } from '../../../../core/builds/builds.service';
import { CampaignsService } from '../../../../core/campaigns/campaigns.service';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-campaign-component',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './edit-campaign-component.html',
  styleUrl: './edit-campaign-component.scss',
})
export class EditCampaignComponent {
   campaign = signal<PlaytestCampaign | null>(null);

  games = signal<Game[]>([]);
  builds = signal<GameBuild[]>([]);

  campaignId = '';

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

  campaignStatuses: CampaignStatus[] = [
    'DRAFT',
    'ACTIVE',
    'PAUSED',
    'COMPLETED',
    'ARCHIVED',
  ];

  loading = signal(true);
  loadingBuilds = signal(false);
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly gamesService: GamesService,
    private readonly buildsService: BuildsService,
    private readonly campaignsService: CampaignsService,
  ) {}

  ngOnInit(): void {
    this.campaignId = this.route.snapshot.paramMap.get('id') || '';
    this.loadPage();
  }

  loadPage(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      campaign: this.campaignsService.getCampaign(this.campaignId),
      games: this.gamesService.getMyGames(),
    }).subscribe({
      next: ({ campaign, games }) => {
        this.campaign.set(campaign);
        this.games.set(games.filter((game) => game.status !== 'ARCHIVED'));

        this.gameId = campaign.gameId;
        this.buildId = campaign.buildId;
        this.title = campaign.title;
        this.type = campaign.type;
        this.description = campaign.description || '';
        this.instructions = campaign.instructions;
        this.requiredTesters = campaign.requiredTesters;
        this.minTesterRating = campaign.minTesterRating;
        this.estimatedMinutes = campaign.estimatedMinutes;
        this.status = campaign.status;
        this.selectedPlatforms = [...campaign.requiredPlatforms];

        this.loading.set(false);
        this.loadBuildsForSelectedGame(campaign.buildId);
      },
      error: () => {
        this.errorMessage.set('Failed to load campaign.');
        this.loading.set(false);
      },
    });
  }

  onGameChange(): void {
    this.buildId = '';
    this.builds.set([]);

    if (!this.gameId) {
      return;
    }

    this.loadBuildsForSelectedGame();
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

    if (!this.title.trim()) {
      this.errorMessage.set('Campaign title is required.');
      return;
    }

    if (!this.instructions.trim()) {
      this.errorMessage.set('Instructions are required.');
      return;
    }

    if (this.selectedPlatforms.length === 0) {
      this.errorMessage.set('Choose at least one required platform.');
      return;
    }

    this.saving.set(true);

    this.campaignsService.updateCampaign(this.campaignId, {
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
        this.saving.set(false);
        this.router.navigate(['/developer/campaigns', this.campaignId]);
      },
      error: (error) => {
        this.saving.set(false);
        this.errorMessage.set(
          error?.error?.message || 'Failed to update campaign.',
        );
      },
    });
  }

  private loadBuildsForSelectedGame(currentBuildId?: string): void {
    this.loadingBuilds.set(true);

    this.buildsService.getBuildsForGame(this.gameId).subscribe({
      next: (builds) => {
        const availableBuilds = builds.filter((build) => {
          return build.status === 'ACTIVE' || build.id === currentBuildId;
        });

        this.builds.set(availableBuilds);
        this.loadingBuilds.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load builds for selected game.');
        this.loadingBuilds.set(false);
      },
    });
  }

}
