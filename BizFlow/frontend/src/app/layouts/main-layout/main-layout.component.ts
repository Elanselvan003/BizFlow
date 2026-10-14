import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, ToastContainerComponent],
  template: `
    <div class="app-layout">
      <!-- Mobile Overlay Backdrop -->
      @if (mobileMenuOpen()) {
        <div class="mobile-backdrop" (click)="toggleMobileMenu()"></div>
      }

      <!-- Sidebar Navigation -->
      <aside class="sidebar" [class.mobile-open]="mobileMenuOpen()">
        <div class="sidebar-header">
          <div class="brand">
            <div class="brand-logo">
              <span class="material-symbols-outlined logo-icon">insights</span>
            </div>
            <div class="brand-info">
              <span class="brand-name">BizFlow</span>
              <span class="brand-sub">Management Suite</span>
            </div>
          </div>
          <button class="mobile-close-btn" (click)="toggleMobileMenu()" aria-label="Close Menu">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav class="nav-menu">
          <div class="nav-section-title">{{ 'nav.operations' | t }}</div>

          <a routerLink="/dashboard" routerLinkActive="active" (click)="closeMobileMenu()" class="nav-item">
            <span class="material-symbols-outlined nav-icon">dashboard</span>
            <span class="nav-label">{{ 'nav.dashboard' | t }}</span>
          </a>

          <a routerLink="/customers" routerLinkActive="active" (click)="closeMobileMenu()" class="nav-item">
            <span class="material-symbols-outlined nav-icon">group</span>
            <span class="nav-label">{{ 'nav.customers' | t }}</span>
          </a>

          <a routerLink="/services" routerLinkActive="active" (click)="closeMobileMenu()" class="nav-item">
            <span class="material-symbols-outlined nav-icon">design_services</span>
            <span class="nav-label">{{ 'nav.services' | t }}</span>
          </a>

          <a routerLink="/bookings" routerLinkActive="active" (click)="closeMobileMenu()" class="nav-item">
            <span class="material-symbols-outlined nav-icon">calendar_month</span>
            <span class="nav-label">{{ 'nav.bookings' | t }}</span>
          </a>

          <div class="nav-section-title">{{ 'nav.finance' | t }}</div>

          <a routerLink="/invoices" routerLinkActive="active" (click)="closeMobileMenu()" class="nav-item">
            <span class="material-symbols-outlined nav-icon">receipt_long</span>
            <span class="nav-label">{{ 'nav.invoices' | t }}</span>
          </a>

          <a routerLink="/reports" routerLinkActive="active" (click)="closeMobileMenu()" class="nav-item">
            <span class="material-symbols-outlined nav-icon">bar_chart</span>
            <span class="nav-label">{{ 'nav.reports' | t }}</span>
          </a>

          <a routerLink="/settings" routerLinkActive="active" (click)="closeMobileMenu()" class="nav-item">
            <span class="material-symbols-outlined nav-icon">settings</span>
            <span class="nav-label">{{ 'nav.settings' | t }}</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="business-pill">
            <div class="business-dot"></div>
            <div class="business-details">
              <span class="biz-name">{{ auth.businessSettings()?.business_name || 'BizFlow — Elanselvan Consulting' }}</span>
              <span class="biz-currency">By Elanselvan • {{ auth.businessSettings()?.currency || 'INR' }} ({{ auth.businessSettings()?.currency_symbol || '₹' }})</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Application Wrapper -->
      <div class="main-wrapper">
        <!-- Topbar Navigation -->
        <header class="topbar">
          <div class="topbar-left">
            <button class="hamburger-btn" (click)="toggleMobileMenu()" aria-label="Toggle Navigation">
              <span class="material-symbols-outlined">menu</span>
            </button>
            <div class="welcome-text">
              <span class="welcome-tag">{{ 'topbar.tag' | t }}</span>
              <h2 class="page-title">{{ getPageTitle() }}</h2>
            </div>
          </div>

          <div class="topbar-right">
            <!-- Language Switcher in Topbar (shown only if multiple languages are enabled) -->
            @if (trans.languages.length > 1) {
              <div class="lang-switcher">
                <span class="material-symbols-outlined lang-icon">translate</span>
                <select
                  class="lang-select"
                  [value]="trans.currentLang()"
                  (change)="onLanguageChange($event)"
                  aria-label="Select display language"
                >
                  @for (lang of trans.languages; track lang.code) {
                    <option [value]="lang.code">{{ lang.flag }} {{ lang.nativeName }}</option>
                  }
                </select>
              </div>
            }

            <!-- Quick Add Shortcuts -->
            <a routerLink="/bookings" class="btn btn-secondary btn-sm quick-btn">
              <span class="material-symbols-outlined">add</span>
              <span>{{ 'topbar.newBooking' | t }}</span>
            </a>
            <a routerLink="/invoices" class="btn btn-primary btn-sm quick-btn">
              <span class="material-symbols-outlined">receipt</span>
              <span>{{ 'topbar.createInvoice' | t }}</span>
            </a>

            <!-- User Menu -->
            <div class="user-profile-menu">
              <div class="user-avatar" title="{{ auth.currentUser()?.full_name || 'Elanselvan' }}">
                {{ getUserInitials() }}
              </div>
              <div class="user-meta">
                <span class="user-name">{{ auth.currentUser()?.full_name || 'Elanselvan' }}</span>
                <span class="user-role">{{ auth.currentUser()?.email || 'elanselvan1997@gmail.com' }}</span>
              </div>
              <button class="logout-btn" (click)="auth.logout()" title="{{ 'nav.logout' | t }}">
                <span class="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </header>

        <!-- Dynamic Content Outlet -->
        <main class="content-area">
          <router-outlet></router-outlet>
          <footer class="app-footer">
            <div class="footer-content">
              <span>BizFlow Business Suite • Engineered by <strong>Elanselvan</strong></span>
              <span class="footer-contact"><a href="mailto:elanselvan1997@gmail.com">elanselvan1997@gmail.com</a></span>
            </div>
          </footer>
        </main>
      </div>

      <!-- Toast Container -->
      <app-toast-container></app-toast-container>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background-color: var(--surface-bg);
    }

    /* Sidebar */
    .sidebar {
      width: 270px;
      background: #ffffff;
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      z-index: 100;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .sidebar-header {
      padding: 1.5rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-light);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-logo {
      width: 2.5rem;
      height: 2.5rem;
      background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      box-shadow: 0 4px 10px rgba(79, 70, 229, 0.35);
    }

    .logo-icon {
      font-size: 1.5rem;
    }

    .brand-name {
      font-family: var(--font-heading);
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-main);
      display: block;
      line-height: 1.1;
      letter-spacing: -0.03em;
    }

    .brand-sub {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-muted);
    }

    .mobile-close-btn {
      display: none;
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
    }

    .nav-menu {
      flex: 1;
      padding: 1.25rem 0.875rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-section-title {
      font-family: var(--font-heading);
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-subtle);
      padding: 0.875rem 0.75rem 0.35rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.6875rem 0.875rem;
      color: var(--text-body);
      font-weight: 500;
      font-size: 0.875rem;
      border-radius: var(--radius-md);
      transition: all 0.15s ease;
      text-decoration: none;
    }

    .nav-icon {
      font-size: 1.25rem;
      color: var(--text-muted);
      transition: color 0.15s ease;
    }

    .nav-item:hover {
      background-color: var(--surface-hover);
      color: var(--text-main);
      .nav-icon { color: var(--primary); }
    }

    .nav-item.active {
      background: var(--primary-light);
      color: var(--primary);
      font-weight: 600;
      .nav-icon { color: var(--primary); font-variation-settings: 'FILL' 1; }
    }

    .sidebar-footer {
      padding: 1.25rem;
      border-top: 1px solid var(--border-light);
      background-color: #fafbfc;
    }

    .business-pill {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.625rem 0.75rem;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
    }

    .business-dot {
      width: 8px;
      height: 8px;
      background-color: var(--success);
      border-radius: 50%;
      flex-shrink: 0;
    }

    .business-details {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .biz-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .biz-currency {
      font-size: 0.6875rem;
      color: var(--text-muted);
    }

    /* Main Wrapper */
    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    /* Topbar */
    .topbar {
      height: 70px;
      background: #ffffff;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      position: sticky;
      top: 0;
      z-index: 90;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .hamburger-btn {
      display: none;
      background: none;
      border: none;
      color: var(--text-main);
      cursor: pointer;
      padding: 0.25rem;
    }

    .welcome-tag {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--primary);
      display: block;
    }

    .page-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.2;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    /* Language Switcher */
    .lang-switcher {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background: var(--surface-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.3rem 0.5rem;
    }
    .lang-icon {
      font-size: 1.15rem;
      color: var(--primary);
    }
    .lang-select {
      background: transparent;
      border: none;
      font-family: var(--font-heading);
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-main);
      outline: none;
      cursor: pointer;
    }

    .user-profile-menu {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-left: 0.75rem;
      border-left: 1px solid var(--border-color);
    }

    .user-avatar {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
      color: var(--primary);
      font-family: var(--font-heading);
      font-weight: 700;
      font-size: 0.8125rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #ffffff;
      box-shadow: 0 0 0 1px var(--primary);
    }

    .user-meta {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-main);
      line-height: 1.2;
    }

    .user-role {
      font-size: 0.6875rem;
      color: var(--text-muted);
    }

    .logout-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.35rem;
      border-radius: var(--radius-sm);
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logout-btn:hover {
      color: var(--danger);
      background-color: var(--danger-light);
    }

    /* Content Area */
    .content-area {
      flex: 1;
      padding: 2rem;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
    }

    /* Mobile Responsive */
    @media (max-width: 1024px) {
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        transform: translateX(-100%);
      }
      .sidebar.mobile-open {
        transform: translateX(0);
      }
      .mobile-close-btn, .hamburger-btn {
        display: block;
      }
      .mobile-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.4);
        backdrop-filter: blur(2px);
        z-index: 99;
      }
      .topbar {
        padding: 0 1.25rem;
      }
      .content-area {
        padding: 1.25rem;
      }
      .app-footer {
        margin-top: 3rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--border-color);
        color: var(--text-muted);
        font-size: 0.8125rem;
      }
      .footer-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .footer-content strong {
        color: var(--text-main);
        font-weight: 600;
      }
      .footer-contact a {
        color: var(--primary);
        text-decoration: none;
      }
      .footer-contact a:hover {
        text-decoration: underline;
      }
    }
  `]
})
export class MainLayoutComponent {
  auth = inject(AuthService);
  trans = inject(TranslationService);
  router = inject(Router);
  mobileMenuOpen = signal<boolean>(false);

  toggleMobileMenu() {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  onLanguageChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.trans.setLanguage(val);
  }

  getUserInitials(): string {
    const name = this.auth.currentUser()?.full_name || 'Elanselvan';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  getPageTitle(): string {
    const url = this.router.url;
    if (url.includes('/dashboard')) return this.trans.translate('nav.dashboard');
    if (url.includes('/customers')) return this.trans.translate('nav.customers');
    if (url.includes('/services')) return this.trans.translate('nav.services');
    if (url.includes('/bookings')) return this.trans.translate('nav.bookings');
    if (url.includes('/invoices')) return this.trans.translate('nav.invoices');
    if (url.includes('/reports')) return this.trans.translate('nav.reports');
    if (url.includes('/settings')) return this.trans.translate('nav.settings');
    return 'BizFlow';
  }
}
