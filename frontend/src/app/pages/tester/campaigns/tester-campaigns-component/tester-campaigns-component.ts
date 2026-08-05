import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CampaignsService } from '../../../../core/campaigns/campaigns.service';
import { PublicCampaign } from '../../../../core/campaigns/campaigns.models';

@Component({
  selector: 'app-tester-campaigns-component',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tester-campaigns-component.html',
  styleUrl: './tester-campaigns-component.scss',
})
export class TesterCampaignsComponent {
  campaigns = signal<PublicCampaign[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  searchTerm = signal('');
  selectedPlatform = signal('');

  platforms = ['PC', 'Web', 'Android', 'iOS'];

  // TODO: Pomeri filtriranje na back sa paginacijom
  filteredCampaigns = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const platform = this.selectedPlatform();

    return this.campaigns().filter((campaign) => {
      const matchesSearch =
        !search ||
        campaign.title.toLowerCase().includes(search) ||
        campaign.game.title.toLowerCase().includes(search) ||
        campaign.game.genre.toLowerCase().includes(search);

      const matchesPlatform =
        !platform || campaign.requiredPlatforms.includes(platform);

      return matchesSearch && matchesPlatform;
    });
  });

  constructor(private readonly campaignsService: CampaignsService) {}

  ngOnInit(): void {
    this.campaignsService.getPublicCampaigns().subscribe({
      next: (campaigns) => {
        this.campaigns.set(campaigns);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load campaigns.');
        this.loading.set(false);
      },
    });
  }

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  setSelectedPlatform(value: string): void {
    this.selectedPlatform.set(value);
  }
}
