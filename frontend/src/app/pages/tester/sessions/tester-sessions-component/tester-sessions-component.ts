import { Component, computed, OnInit, signal } from '@angular/core';
import { TestSession } from '../../../../core/sessions/sessions.models';
import { SessionsService } from '../../../../core/sessions/sessions.service';
import { RouterLink } from '@angular/router';
import { ResolveUploadUrlPipe } from '../../../../core/uploads/resolve-upload-url.pipe';
import { Card } from '../../../../shared/ui/card/card';
import { StatusBadge } from '../../../../shared/ui/status-badge/status-badge';
import { buttonClasses } from '../../../../shared/ui/button/button';

type SessionFilter = 'ALL' | 'LIVE' | 'COMPLETED';

@Component({
  selector: 'app-tester-sessions-component',
  imports: [RouterLink, ResolveUploadUrlPipe, Card, StatusBadge],
  templateUrl: './tester-sessions-component.html',
  styleUrl: './tester-sessions-component.scss',
})
export class TesterSessionsComponent implements OnInit {
  sessions = signal<TestSession[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  selectedFilter = signal<SessionFilter>('ALL');
  filters: SessionFilter[] = ['ALL', 'LIVE', 'COMPLETED'];

  protected readonly primaryLinkClasses = buttonClasses('primary');

  filteredSessions = computed(() => {
    const filter = this.selectedFilter();

    if (filter === 'ALL') {
      return this.sessions();
    }

    return this.sessions().filter((session) => session.status === filter);
  });

  constructor(private readonly sessionsService: SessionsService) {}

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.sessionsService.getMySessions().subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load sessions.');
        this.loading.set(false);
      },
    });
  }

  setFilter(filter: SessionFilter): void {
    this.selectedFilter.set(filter);
  }

  formatDuration(seconds?: number | null): string {
    if (!seconds) {
      return '—';
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}m ${remainingSeconds}s`;
  }
}
