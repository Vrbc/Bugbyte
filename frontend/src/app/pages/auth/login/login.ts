import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Logo } from '../../../shared/ui/logo/logo';
import { Card } from '../../../shared/ui/card/card';
import { Input } from '../../../shared/ui/input/input';
import { Button } from '../../../shared/ui/button/button';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, Logo, Card, Input, Button],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly authService = inject(AuthService);

  email = '';
  password = '';

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  submit(): void {
    this.errorMessage.set(null);
    this.loading.set(true);

    this.authService
      .login({
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.authService.redirectByRole(response.user);
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.errorMessage.set(
            error.status === 401
              ? 'Invalid email or password.'
              : 'Unable to sign in. Please try again.',
          );
        },
      });
  }
}
