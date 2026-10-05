import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../../core/account/account';
import { AccountProfile } from '../../../core/account/account.models';
import { Button } from '../../../shared/ui/button/button';
import { Card } from '../../../shared/ui/card/card';
import { Input } from '../../../shared/ui/input/input';
import { LoadingSpinner } from '../../../shared/ui/loading-spinner/loading-spinner';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { ToggleChipGroup } from '../../../shared/ui/toggle-chip-group/toggle-chip-group';

@Component({
  selector: 'app-account-component',
  imports: [FormsModule, Button, Card, Input, LoadingSpinner, StatusBadge, ToggleChipGroup],
  templateUrl: './account-component.html',
  styleUrl: './account-component.scss',
})
export class AccountComponent {
  readonly account = signal<AccountProfile | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly formErrorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  studioName = '';
  bio = '';
  websiteUrl = '';
  selectedPlatforms: string[] = [];
  selectedGenres: string[] = [];

  readonly availablePlatforms = ['PC', 'Web', 'Android', 'iOS'];
  readonly availableGenres = ['Roguelike', 'RPG', 'Action', 'Puzzle', 'Strategy', 'Platformer'];

  private readonly accountService = inject(AccountService);

  constructor() {
    this.loadAccount();
  }

  loadAccount(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.accountService.getMyAccount().subscribe({
      next: (account) => {
        this.account.set(account);
        this.populateForm(account);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error?.error?.message || 'Failed to load account.');
        this.loading.set(false);
      },
    });
  }

  togglePlatform(platform: string): void {
    this.selectedPlatforms = this.toggleValue(this.selectedPlatforms, platform);
  }

  toggleGenre(genre: string): void {
    this.selectedGenres = this.toggleValue(this.selectedGenres, genre);
  }

  resetForm(): void {
    const account = this.account();
    if (account) this.populateForm(account);
    this.errorMessage.set(null);
    this.formErrorMessage.set(null);
    this.successMessage.set(null);
  }

  save(): void {
    const account = this.account();
    if (!account) return;

    this.errorMessage.set(null);
    this.formErrorMessage.set(null);
    this.successMessage.set(null);

    if (account.role === 'DEVELOPER') {
      if (!this.studioName.trim()) {
        this.formErrorMessage.set('Studio name is required.');
        return;
      }
      this.saving.set(true);
      this.accountService.updateMyAccount({
        studioName: this.studioName,
        bio: this.bio,
        websiteUrl: this.websiteUrl,
      }).subscribe({ next: (value) => this.handleSavedAccount(value), error: (error) => this.handleSaveError(error) });
      return;
    }

    if (!this.selectedPlatforms.length || !this.selectedGenres.length) {
      this.formErrorMessage.set('Choose at least one platform and favorite genre.');
      return;
    }

    this.saving.set(true);
    this.accountService.updateMyAccount({
      platforms: this.selectedPlatforms,
      favoriteGenres: this.selectedGenres,
    }).subscribe({ next: (value) => this.handleSavedAccount(value), error: (error) => this.handleSaveError(error) });
  }

  private handleSavedAccount(account: AccountProfile): void {
    this.account.set(account);
    this.populateForm(account);
    this.saving.set(false);
    this.successMessage.set('Profile updated.');
  }

  private handleSaveError(error: { error?: { message?: string } }): void {
    this.saving.set(false);
    this.errorMessage.set(error?.error?.message || 'Failed to update profile.');
  }

  private populateForm(account: AccountProfile): void {
    if (account.role === 'DEVELOPER') {
      this.studioName = account.developerProfile.studioName;
      this.bio = account.developerProfile.bio || '';
      this.websiteUrl = account.developerProfile.websiteUrl || '';
      return;
    }

    this.selectedPlatforms = [...account.testerProfile.platforms];
    this.selectedGenres = [...account.testerProfile.favoriteGenres];
  }

  private toggleValue(values: string[], value: string): string[] {
    return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
  }
}
