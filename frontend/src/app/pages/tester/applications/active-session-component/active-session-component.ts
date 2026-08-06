import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SessionsService } from '../../../../core/sessions/sessions.service';
import { TestSession } from '../../../../core/sessions/sessions.models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-active-session-component',
  imports: [CommonModule],
  templateUrl: './active-session-component.html',
  styleUrl: './active-session-component.scss',
})
export class ActiveSessionComponent implements OnInit {
  session = signal<TestSession | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  private sessionId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly sessionsService: SessionsService,
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('id') || '';

    this.sessionsService.getSession(this.sessionId).subscribe({
      next: (session) => {
        this.session.set(session);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load session.');
        this.loading.set(false);
      },
    });
  }

}
