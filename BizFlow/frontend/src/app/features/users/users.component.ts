import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../core/services/users.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserAccount } from '../../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <div class="admin-badge">
            <span class="material-symbols-outlined badge-icon">admin_panel_settings</span>
            <span>SYSTEM ADMINISTRATOR PORTAL</span>
          </div>
          <h1 class="header-title">User Accounts & Access Control</h1>
          <p class="header-subtitle">Review registered users, monitor workspace signups, and toggle active/deactivated platform access.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="loadUsers()">
            <span class="material-symbols-outlined">refresh</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-grid">
        <div class="bf-card kpi-card">
          <div class="kpi-icon-box total-box">
            <span class="material-symbols-outlined">group</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Total Registered Users</span>
            <span class="kpi-value">{{ totalUsers() }}</span>
            <span class="kpi-subtext">Across all business workspaces</span>
          </div>
        </div>

        <div class="bf-card kpi-card">
          <div class="kpi-icon-box active-box">
            <span class="material-symbols-outlined">check_circle</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Active Accounts</span>
            <span class="kpi-value active-val">{{ activeUsersCount() }}</span>
            <span class="kpi-subtext">Granted full platform access</span>
          </div>
        </div>

        <div class="bf-card kpi-card">
          <div class="kpi-icon-box deact-box">
            <span class="material-symbols-outlined">block</span>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Deactivated Accounts</span>
            <span class="kpi-value deact-val">{{ deactivatedUsersCount() }}</span>
            <span class="kpi-subtext">Access blocked on login</span>
          </div>
        </div>
      </div>

      <!-- Search & Status Filter Toolbar -->
      <div class="bf-card filter-card">
        <div class="search-box">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            class="search-input"
            placeholder="Search by full name, email, or company name..."
            [(ngModel)]="searchQuery"
          />
        </div>

        <div class="status-tabs">
          <button
            class="tab-btn"
            [class.active]="selectedTab === 'all'"
            (click)="selectedTab = 'all'"
          >
            All Accounts ({{ totalUsers() }})
          </button>
          <button
            class="tab-btn"
            [class.active]="selectedTab === 'active'"
            (click)="selectedTab = 'active'"
          >
            Active ({{ activeUsersCount() }})
          </button>
          <button
            class="tab-btn"
            [class.active]="selectedTab === 'deactivated'"
            (click)="selectedTab = 'deactivated'"
          >
            Deactivated ({{ deactivatedUsersCount() }})
          </button>
        </div>
      </div>

      <!-- User Accounts Table -->
      <div class="bf-table-container">
        <table class="bf-table">
          <thead>
            <tr>
              <th>User Account</th>
              <th>Workspace / Business</th>
              <th>Signed Up</th>
              <th>Role</th>
              <th>Access Status</th>
              <th style="text-align: right;">Access Control Action</th>
            </tr>
          </thead>
          <tbody>
            @if (isLoading()) {
              <tr>
                <td colspan="6" class="loading-cell">
                  <div class="spinner-center">
                    <div class="spinner"></div>
                    <span>Loading user accounts from database...</span>
                  </div>
                </td>
              </tr>
            } @else if (filteredUsers().length === 0) {
              <tr>
                <td colspan="6" class="empty-cell">
                  <div class="empty-state">
                    <span class="material-symbols-outlined empty-icon">person_search</span>
                    <h3>No matching user accounts</h3>
                    <p>No user accounts matched your search criteria or filter.</p>
                  </div>
                </td>
              </tr>
            } @else {
              @for (user of filteredUsers(); track user.id) {
                <tr [class.deactivated-row]="user.status === 'deactivated'">
                  <td>
                    <div class="user-cell">
                      <div class="user-avatar" [class.admin-avatar]="isPrimaryAdmin(user)">
                        {{ getInitials(user.full_name) }}
                      </div>
                      <div class="user-meta">
                        <span class="user-name">
                          {{ user.full_name }}
                          @if (isCurrentUser(user)) {
                            <span class="self-tag">(You)</span>
                          }
                        </span>
                        <span class="user-email">{{ user.email }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="business-cell">
                      <span class="biz-title">{{ user.business_name || 'Individual Workspace' }}</span>
                      <span class="biz-meta">Currency: {{ user.currency || 'INR' }} ({{ user.currency_symbol || '₹' }})</span>
                    </div>
                  </td>
                  <td>
                    <span class="date-text">{{ formatDate(user.created_at) }}</span>
                  </td>
                  <td>
                    <span class="role-badge" [class.role-admin]="isPrimaryAdmin(user)">
                      {{ isPrimaryAdmin(user) ? 'Primary Admin' : 'Customer Account' }}
                    </span>
                  </td>
                  <td>
                    @if (user.status === 'active') {
                      <span class="status-pill status-active">
                        <span class="status-dot"></span>
                        <span>Active</span>
                      </span>
                    } @else {
                      <span class="status-pill status-deactivated">
                        <span class="status-dot"></span>
                        <span>Deactivated</span>
                      </span>
                    }
                  </td>
                  <td style="text-align: right;">
                    @if (isPrimaryAdmin(user)) {
                      <span class="primary-admin-pill" title="Primary administrator account cannot be deactivated">
                        <span class="material-symbols-outlined" style="font-size: 1rem;">verified_user</span>
                        <span>Admin Protected</span>
                      </span>
                    } @else {
                      @if (user.status === 'active') {
                        <button
                          class="btn btn-deactivate btn-sm"
                          [disabled]="updatingId() === user.id"
                          (click)="toggleStatus(user, 'deactivated')"
                          title="Click to deactivate this user account"
                        >
                          @if (updatingId() === user.id) {
                            <span class="spinner-sm"></span>
                          } @else {
                            <span class="material-symbols-outlined" style="font-size: 1.1rem;">block</span>
                          }
                          <span>Deactivate</span>
                        </button>
                      } @else {
                        <button
                          class="btn btn-activate btn-sm"
                          [disabled]="updatingId() === user.id"
                          (click)="toggleStatus(user, 'active')"
                          title="Click to activate this user account"
                        >
                          @if (updatingId() === user.id) {
                            <span class="spinner-sm"></span>
                          } @else {
                            <span class="material-symbols-outlined" style="font-size: 1.1rem;">check_circle</span>
                          }
                          <span>Activate Account</span>
                        </button>
                      }
                    }
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .users-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .admin-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(79, 70, 229, 0.08);
      color: var(--primary);
      border: 1px solid rgba(79, 70, 229, 0.2);
      border-radius: var(--radius-sm);
      padding: 0.2rem 0.5rem;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      margin-bottom: 0.5rem;
    }
    .badge-icon {
      font-size: 0.95rem;
    }
    .header-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0 0 0.25rem 0;
      letter-spacing: -0.02em;
    }
    .header-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0;
    }
    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.25rem;
    }
    .kpi-card {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.25rem 1.5rem;
      border-radius: var(--radius-lg);
    }
    .kpi-icon-box {
      width: 3.25rem;
      height: 3.25rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .kpi-icon-box span {
      font-size: 1.75rem;
    }
    .total-box {
      background: rgba(79, 70, 229, 0.1);
      color: var(--primary);
    }
    .active-box {
      background: rgba(16, 185, 129, 0.1);
      color: var(--success);
    }
    .deact-box {
      background: rgba(239, 68, 68, 0.1);
      color: var(--danger);
    }
    .kpi-content {
      display: flex;
      flex-direction: column;
    }
    .kpi-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
    }
    .kpi-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1.1;
      font-family: var(--font-heading);
    }
    .active-val {
      color: var(--success);
    }
    .deact-val {
      color: var(--danger);
    }
    .kpi-subtext {
      font-size: 0.6875rem;
      color: var(--text-subtle);
      margin-top: 0.25rem;
    }

    /* Filter Toolbar */
    .filter-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 0.875rem 1.25rem;
      border-radius: var(--radius-md);
    }
    .search-box {
      position: relative;
      flex: 1;
      min-width: 280px;
      max-width: 480px;
    }
    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 1.25rem;
    }
    .search-input {
      width: 100%;
      padding: 0.625rem 0.875rem 0.625rem 2.5rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      background: var(--surface-bg);
      color: var(--text-main);
      outline: none;
      transition: all 0.15s ease;
    }
    .search-input:focus {
      border-color: var(--primary);
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
    }
    .status-tabs {
      display: flex;
      background: var(--surface-bg);
      padding: 0.25rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      gap: 0.25rem;
    }
    .tab-btn {
      background: none;
      border: none;
      padding: 0.4rem 0.875rem;
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .tab-btn:hover {
      color: var(--text-main);
    }
    .tab-btn.active {
      background: #ffffff;
      color: var(--primary);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    /* Table & Rows */
    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .user-avatar {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
      color: var(--primary);
      font-weight: 700;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .admin-avatar {
      background: linear-gradient(135deg, #4f46e5, #3730a3);
      color: #ffffff;
    }
    .user-meta {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-weight: 700;
      color: var(--text-main);
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .self-tag {
      font-size: 0.6875rem;
      background: var(--primary-light);
      color: var(--primary);
      padding: 0.1rem 0.35rem;
      border-radius: var(--radius-sm);
      font-weight: 600;
    }
    .user-email {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .business-cell {
      display: flex;
      flex-direction: column;
    }
    .biz-title {
      font-weight: 600;
      color: var(--text-main);
      font-size: 0.8125rem;
    }
    .biz-meta {
      font-size: 0.6875rem;
      color: var(--text-muted);
    }
    .date-text {
      font-size: 0.8125rem;
      color: var(--text-muted);
    }
    .role-badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--surface-bg);
      color: var(--text-body);
      border: 1px solid var(--border-color);
    }
    .role-admin {
      background: rgba(79, 70, 229, 0.08);
      color: var(--primary);
      border-color: rgba(79, 70, 229, 0.25);
    }

    /* Status Pills */
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .status-active {
      background: rgba(16, 185, 129, 0.12);
      color: var(--success);
    }
    .status-active .status-dot {
      background: var(--success);
    }
    .status-deactivated {
      background: rgba(239, 68, 68, 0.12);
      color: var(--danger);
    }
    .status-deactivated .status-dot {
      background: var(--danger);
    }

    .deactivated-row {
      background-color: rgba(254, 242, 242, 0.4);
    }

    /* Action Buttons */
    .btn-deactivate {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #ffffff;
      color: var(--danger);
      border: 1px solid rgba(239, 68, 68, 0.35);
      border-radius: var(--radius-md);
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-deactivate:hover {
      background: rgba(239, 68, 68, 0.08);
      border-color: var(--danger);
    }
    .btn-activate {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: var(--success);
      color: #ffffff;
      border: 1px solid var(--success);
      border-radius: var(--radius-md);
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-activate:hover {
      background: #059669;
    }
    .primary-admin-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      background: var(--surface-bg);
      border: 1px solid var(--border-color);
      padding: 0.3rem 0.6rem;
      border-radius: var(--radius-sm);
    }

    .loading-cell, .empty-cell {
      text-align: center;
      padding: 3rem 1.5rem;
    }
    .spinner-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    .spinner {
      width: 2rem;
      height: 2rem;
      border: 3px solid rgba(79, 70, 229, 0.2);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    .spinner-sm {
      width: 0.875rem;
      height: 0.875rem;
      border: 2px solid rgba(0, 0, 0, 0.2);
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-muted);
    }
    .empty-icon {
      font-size: 3rem;
      color: var(--text-subtle);
    }
  `]
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);
  private authService = inject(AuthService);
  private notify = inject(NotificationService);

  users = signal<UserAccount[]>([]);
  isLoading = signal<boolean>(false);
  updatingId = signal<string | null>(null);

  searchQuery = '';
  selectedTab: 'all' | 'active' | 'deactivated' = 'all';

  totalUsers = computed(() => this.users().length);
  activeUsersCount = computed(() => this.users().filter(u => u.status === 'active').length);
  deactivatedUsersCount = computed(() => this.users().filter(u => u.status === 'deactivated').length);

  filteredUsers = computed(() => {
    let list = this.users();
    const query = this.searchQuery.trim().toLowerCase();

    if (query) {
      list = list.filter(u =>
        u.full_name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.business_name?.toLowerCase().includes(query)
      );
    }

    if (this.selectedTab === 'active') {
      list = list.filter(u => u.status === 'active');
    } else if (this.selectedTab === 'deactivated') {
      list = list.filter(u => u.status === 'deactivated');
    }

    return list;
  });

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    this.usersService.getUsers().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.users.set(res.data);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notify.error(err.error?.error || 'Failed to load user accounts');
      }
    });
  }

  toggleStatus(user: UserAccount, targetStatus: 'active' | 'deactivated') {
    this.updatingId.set(user.id);
    this.usersService.updateUserStatus(user.id, targetStatus).subscribe({
      next: (res) => {
        this.updatingId.set(null);
        if (res.success) {
          // Update in local signal state
          this.users.update(list =>
            list.map(u => u.id === user.id ? { ...u, status: targetStatus } : u)
          );
          if (targetStatus === 'active') {
            this.notify.success(`Account for ${user.full_name} (${user.email}) has been activated.`);
          } else {
            this.notify.warning(`Account for ${user.full_name} (${user.email}) has been deactivated.`);
          }
        }
      },
      error: (err) => {
        this.updatingId.set(null);
        this.notify.error(err.error?.error || 'Failed to update account status');
      }
    });
  }

  isCurrentUser(user: UserAccount): boolean {
    return this.authService.currentUser()?.id === user.id;
  }

  isPrimaryAdmin(user: UserAccount): boolean {
    return user.email?.toLowerCase().trim() === 'elanselvan1997@gmail.com' || this.isCurrentUser(user);
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }
}
