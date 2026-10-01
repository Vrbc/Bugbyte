import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { AdminUsersService } from '../../../../core/admin/admin-users.service';
import { AdminUser, AdminUsersQuery } from '../../../../core/admin/admin-users.models';
import { Card } from '../../../../shared/ui/card/card';
import { Input } from '../../../../shared/ui/input/input';
import { Button } from '../../../../shared/ui/button/button';
import { LoadingSpinner } from '../../../../shared/ui/loading-spinner/loading-spinner';
import { Pagination } from '../../../../shared/ui/pagination/pagination';
import { ConfirmDialog } from '../../../../shared/ui/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-admin-users-component',
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    Card,
    Input,
    Button,
    LoadingSpinner,
    Pagination,
    ConfirmDialog,
  ],
  templateUrl: './admin-users-component.html',
  styleUrl: './admin-users-component.scss',
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  private readonly adminUsersService = inject(AdminUsersService);

  readonly users = signal<AdminUser[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly pendingDelete = signal<AdminUser | null>(null);

  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);
  readonly limit = 20;

  readonly search = signal('');
  readonly selectedRole = signal<'DEVELOPER' | 'TESTER' | ''>('');

  private readonly searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.loadUsers(1);
      });

    this.loadUsers(1);
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  loadUsers(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const query: AdminUsersQuery = {
      page,
      limit: this.limit,
      search: this.search().trim() || undefined,
      role: (this.selectedRole() || undefined) as AdminUsersQuery['role'],
    };

    this.adminUsersService.getUsers(query).subscribe({
      next: (result) => {
        this.users.set(result.items);
        this.page.set(result.page);
        this.totalPages.set(result.totalPages);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load users. Please try again.');
        this.loading.set(false);
      },
    });
  }

  onSearchInput(value: string): void {
    this.search.set(value);
    this.searchSubject.next(value);
  }

  onRoleChange(role: string): void {
    this.selectedRole.set(role as 'DEVELOPER' | 'TESTER' | '');
    this.loadUsers(1);
  }

  onClearFilters(): void {
    this.search.set('');
    this.selectedRole.set('');
    this.loadUsers(1);
  }

  onPageChange(newPage: number): void {
    this.loadUsers(newPage);
  }

  openDelete(user: AdminUser): void {
    this.pendingDelete.set(user);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  confirmDelete(): void {
    const user = this.pendingDelete();
    if (!user) return;

    const username = user.username;
    this.pendingDelete.set(null);
    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.adminUsersService.deleteUser(user.id).subscribe({
      next: () => {
        this.successMessage.set(`User "${username}" has been successfully deleted.`);
        const targetPage = this.users().length === 1 && this.page() > 1
          ? this.page() - 1
          : this.page();
        this.loadUsers(targetPage);
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Failed to delete user.';
        this.errorMessage.set(msg);
        this.loading.set(false);
      },
    });
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'DEVELOPER':
        return 'bg-cyan/20 text-cyan border border-cyan/40';
      case 'TESTER':
        return 'bg-purple/20 text-purple border border-purple/40';
      default:
        return 'bg-border text-on-surface-variant';
    }
  }
}
