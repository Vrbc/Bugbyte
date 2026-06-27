import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { UserRole } from '../../../core/auth/auth.models';

type ExperienceLevel = 'BEGINNER' | 'CASUAL' | 'EXPERIENCED' | 'QA_ORIENTED';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  role: UserRole = 'DEVELOPER';

  username = '';
  email = '';
  password = '';

  studioName = '';
  bio = '';
  websiteUrl = '';

  availablePlatforms = ['PC', 'Web', 'Android', 'iOS'];
  selectedPlatforms: string[] = [];

  availableGenres = ['Roguelike', 'RPG', 'Action', 'Puzzle', 'Strategy', 'Platformer'];
  selectedGenres: string[] = [];

  experienceLevel: ExperienceLevel = 'BEGINNER';

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  private readonly authService = inject(AuthService);

  selectRole(role: UserRole): void {
    this.role = role;
    this.errorMessage.set(null);
  }

  togglePlatform(platform: string): void {
    this.selectedPlatforms = this.toggleValue(this.selectedPlatforms, platform);
  }

  toggleGenre(genre: string): void {
    this.selectedGenres = this.toggleValue(this.selectedGenres, genre);
  }

  submit(): void {
    this.errorMessage.set(null);

    if (this.role === 'DEVELOPER' && !this.studioName.trim()) {
      this.errorMessage.set('Studio name is required for developers.');
      return;
    }

    if (this.role === 'TESTER') {
      if (this.selectedPlatforms.length === 0) {
        this.errorMessage.set('Choose at least one testing platform.');
        return;
      }

      if (this.selectedGenres.length === 0) {
        this.errorMessage.set('Choose at least one favorite genre.');
        return;
      }
    }

    this.loading.set(true);

    const payload =
      this.role === 'DEVELOPER'
        ? {
            username: this.username,
            email: this.email,
            password: this.password,
            role: this.role,
            studioName: this.studioName,
            bio: this.bio,
            websiteUrl: this.websiteUrl || undefined,
          }
        : {
            username: this.username,
            email: this.email,
            password: this.password,
            role: this.role,
            platforms: this.selectedPlatforms,
            favoriteGenres: this.selectedGenres,
            experienceLevel: this.experienceLevel,
          };

    this.authService.register(payload).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.authService.redirectByRole(response.user);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(
          error?.error?.message || 'Registration failed. Please try again.',
        );
      },
    });
  }

  private toggleValue(values: string[], value: string): string[] {
    if (values.includes(value)) {
      return values.filter((item) => item !== value);
    }

    return [...values, value];
  }
}
