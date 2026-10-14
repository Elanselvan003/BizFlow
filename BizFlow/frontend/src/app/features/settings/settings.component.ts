import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { NotificationService } from '../../core/services/notification.service';
import { BusinessSettings } from '../../core/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="settings-page">
      <div class="page-header">
        <div>
          <h1 class="header-title">{{ 'set.title' | t }}</h1>
          <p class="header-subtitle">{{ 'set.subtitle' | t }}</p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="settings-tabs">
        <button class="tab-btn" [class.tab-active]="activeTab() === 'business'" (click)="activeTab.set('business')">
          <span class="material-symbols-outlined">store</span>
          <span>{{ 'set.businessProfile' | t }}</span>
        </button>
        @if (trans.languages.length > 1) {
          <button class="tab-btn" [class.tab-active]="activeTab() === 'language'" (click)="activeTab.set('language')">
            <span class="material-symbols-outlined">translate</span>
            <span>{{ 'set.languageSettings' | t }}</span>
          </button>
        }
        <button class="tab-btn" [class.tab-active]="activeTab() === 'profile'" (click)="activeTab.set('profile')">
          <span class="material-symbols-outlined">manage_accounts</span>
          <span>{{ 'set.accountSecurity' | t }}</span>
        </button>
      </div>

      <!-- Language Preferences Tab -->
      @if (activeTab() === 'language') {
        <div class="bf-card settings-card">
          <div class="card-intro">
            <h3 class="bf-card-title">{{ 'set.languageSettings' | t }}</h3>
            <p class="intro-desc">{{ 'set.selectLanguageDesc' | t }}</p>
          </div>

          <div class="lang-selection-grid">
            @for (lang of trans.languages; track lang.code) {
              <div
                class="lang-card"
                [class.lang-card-active]="trans.currentLang() === lang.code"
                (click)="selectLanguage(lang.code)"
              >
                <div class="lang-card-header">
                  <span class="lang-flag">{{ lang.flag }}</span>
                  @if (trans.currentLang() === lang.code) {
                    <span class="material-symbols-outlined lang-check">check_circle</span>
                  }
                </div>
                <div class="lang-card-body">
                  <div class="lang-native-name">{{ lang.nativeName }}</div>
                  <div class="lang-en-name">{{ lang.name }}</div>
                </div>
              </div>
            }
          </div>

          <div class="regional-preview-box mt-4">
            <h4 class="preview-title">Active Currency & Locale</h4>
            <div class="preview-grid">
              <div class="preview-item">
                <span class="preview-lbl">Currency Symbol:</span>
                <span class="preview-val font-bold text-primary">{{ auth.businessSettings()?.currency_symbol || '₹' }} ({{ auth.businessSettings()?.currency || 'INR' }})</span>
              </div>
              <div class="preview-item">
                <span class="preview-lbl">Sample Amount Format:</span>
                <span class="preview-val font-mono">{{ auth.businessSettings()?.currency_symbol || '₹' }}1,25,000.00</span>
              </div>
              <div class="preview-item">
                <span class="preview-lbl">Timezone:</span>
                <span class="preview-val">{{ auth.businessSettings()?.timezone || 'Asia/Kolkata' }}</span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Business Settings Form -->
      @if (activeTab() === 'business') {
        <div class="bf-card settings-card">
          <div class="card-intro">
            <h3 class="bf-card-title">{{ 'set.businessProfile' | t }}</h3>
            <p class="intro-desc">These details will appear on client statements, appointment confirmations, and tax receipts.</p>
          </div>

          <form [formGroup]="businessForm" (ngSubmit)="saveBusinessSettings()">
            <div class="form-row">
              <div class="form-group flex-2">
                <label class="form-label">{{ 'set.tradingName' | t }} *</label>
                <input type="text" formControlName="business_name" class="form-input" />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">{{ 'set.prefix' | t }}</label>
                <input type="text" formControlName="invoice_prefix" class="form-input" placeholder="INV-" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">{{ 'set.email' | t }}</label>
                <input type="email" formControlName="email" class="form-input" />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">{{ 'set.phone' | t }}</label>
                <input type="tel" formControlName="phone" class="form-input" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">{{ 'set.address' | t }}</label>
              <input type="text" formControlName="address" class="form-input" />
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">{{ 'set.currency' | t }}</label>
                <select formControlName="currency" class="form-select" (change)="onCurrencyChange()">
                  <option value="INR">INR - Indian Rupee (₹)</option>
                  <option value="USD">USD - US Dollar ($)</option>
                  <option value="EUR">EUR - Euro (€)</option>
                  <option value="GBP">GBP - British Pound (£)</option>
                  <option value="CAD">CAD - Canadian Dollar ($)</option>
                  <option value="AUD">AUD - Australian Dollar ($)</option>
                </select>
              </div>

              <div class="form-group flex-1">
                <label class="form-label">{{ 'set.timezone' | t }}</label>
                <select formControlName="timezone" class="form-select">
                  <option value="Asia/Kolkata">India (Asia/Kolkata)</option>
                  <option value="America/New_York">Eastern Time (America/New_York)</option>
                  <option value="America/Chicago">Central Time (America/Chicago)</option>
                  <option value="America/Denver">Mountain Time (America/Denver)</option>
                  <option value="America/Los_Angeles">Pacific Time (America/Los_Angeles)</option>
                  <option value="Europe/London">London (Europe/London)</option>
                  <option value="Europe/Paris">Paris / Berlin (Europe/Paris)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                </select>
              </div>

              <div class="form-group flex-1">
                <label class="form-label">{{ 'set.taxRate' | t }}</label>
                <input type="number" step="0.1" min="0" formControlName="tax_rate" class="form-input" />
              </div>
            </div>

            <div class="form-footer">
              <button type="submit" class="btn btn-primary" [disabled]="businessForm.invalid || isSavingBusiness()">
                {{ isSavingBusiness() ? 'Saving...' : ('set.saveBusiness' | t) }}
              </button>
            </div>
          </form>
        </div>
      }

      <!-- User Account & Security Form -->
      @if (activeTab() === 'profile') {
        <div class="bf-card settings-card">
          <div class="card-intro">
            <h3 class="bf-card-title">{{ 'set.accountSecurity' | t }}</h3>
            <p class="intro-desc">Update your personal account details or change your administrative password.</p>
          </div>

          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">{{ 'set.fullName' | t }} *</label>
                <input type="text" formControlName="full_name" class="form-input" />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">{{ 'set.accountEmail' | t }} *</label>
                <input type="email" formControlName="email" class="form-input" />
              </div>
            </div>

            <div class="security-divider">
              <span class="security-title">{{ 'set.changePassword' | t }} (Leave blank to keep current)</span>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">{{ 'set.currentPassword' | t }}</label>
                <input type="password" formControlName="current_password" class="form-input" placeholder="Required if setting new password" />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">{{ 'set.newPassword' | t }}</label>
                <input type="password" formControlName="new_password" class="form-input" placeholder="Minimum 8 characters" />
              </div>
            </div>

            <div class="form-footer">
              <button type="submit" class="btn btn-primary" [disabled]="profileForm.invalid || isSavingProfile()">
                {{ isSavingProfile() ? 'Updating...' : ('set.updateProfile' | t) }}
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    .settings-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
    .header-title { font-size: 1.75rem; font-weight: 800; color: var(--text-main); }
    .header-subtitle { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; }

    .settings-tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.25rem;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted);
      border-radius: var(--radius-md) var(--radius-md) 0 0;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.15s ease;
    }
    .tab-btn:hover { color: var(--text-main); }
    .tab-active {
      color: var(--primary);
      border-bottom-color: var(--primary);
      background: rgba(79, 70, 229, 0.04);
    }

    .settings-card { padding: 2rem; max-width: 860px; }
    .card-intro { margin-bottom: 1.75rem; }
    .intro-desc { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; }
    .form-row { display: flex; gap: 1rem; }
    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }
    .form-footer { margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--border-light); display: flex; justify-content: flex-end; }

    /* Language Selection Grid */
    .lang-selection-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    .lang-card {
      border: 2px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      cursor: pointer;
      background: var(--surface-bg);
      transition: all 0.18s ease;
    }
    .lang-card:hover {
      border-color: #a5b4fc;
      background: #ffffff;
      transform: translateY(-2px);
    }
    .lang-card-active {
      border-color: var(--primary);
      background: #ffffff;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
    }
    .lang-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    .lang-flag { font-size: 2rem; }
    .lang-check { color: var(--primary); font-size: 1.4rem; }
    .lang-native-name { font-size: 1.15rem; font-weight: 700; color: var(--text-main); }
    .lang-en-name { font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.15rem; }

    .regional-preview-box {
      background: var(--surface-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem;
    }
    .preview-title { font-size: 0.875rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.75rem; }
    .preview-grid { display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem; }
    .preview-item { display: flex; gap: 0.5rem; }
    .preview-lbl { color: var(--text-muted); width: 180px; }
    .preview-val { color: var(--text-main); }
    .text-primary { color: var(--primary); }
    .font-bold { font-weight: 700; }
    .font-mono { font-family: monospace; }
    .mt-4 { margin-top: 1.25rem; }

    .security-divider {
      margin: 1.5rem 0 1rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-color);
    }
    .security-title {
      font-size: 0.8125rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
  `]
})
export class SettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private notify = inject(NotificationService);
  auth = inject(AuthService);
  trans = inject(TranslationService);
  private fb = inject(FormBuilder);

  activeTab = signal<'business' | 'language' | 'profile'>('business');
  isSavingBusiness = signal<boolean>(false);
  isSavingProfile = signal<boolean>(false);

  businessForm = this.fb.group({
    business_name: ['', [Validators.required, Validators.minLength(2)]],
    email: [''],
    phone: [''],
    address: [''],
    currency: ['INR'],
    currency_symbol: ['₹'],
    timezone: ['Asia/Kolkata'],
    tax_rate: [8.5],
    invoice_prefix: ['INV-']
  });

  profileForm = this.fb.group({
    full_name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    current_password: [''],
    new_password: ['']
  });

  ngOnInit() {
    this.loadSettings();
    this.populateProfileForm();
  }

  selectLanguage(code: string) {
    this.trans.setLanguage(code);
    const lang = this.trans.languages.find(l => l.code === code);
    this.notify.success(`Language changed to ${lang?.nativeName} (${lang?.name})`);
  }

  loadSettings() {
    this.settingsService.getSettings().subscribe(res => {
      if (res.success && res.data) {
        this.auth.updateSettings(res.data);
        this.businessForm.patchValue({
          business_name: res.data.business_name,
          email: res.data.email || '',
          phone: res.data.phone || '',
          address: res.data.address || '',
          currency: res.data.currency,
          currency_symbol: res.data.currency_symbol,
          timezone: res.data.timezone,
          tax_rate: res.data.tax_rate,
          invoice_prefix: res.data.invoice_prefix
        });
      }
    });
  }

  populateProfileForm() {
    const user = this.auth.currentUser();
    if (user) {
      this.profileForm.patchValue({
        full_name: user.full_name,
        email: user.email
      });
    }
  }

  onCurrencyChange() {
    const curr = this.businessForm.get('currency')?.value;
    let symbol = '₹';
    if (curr === 'USD') symbol = '$';
    else if (curr === 'EUR') symbol = '€';
    else if (curr === 'GBP') symbol = '£';
    this.businessForm.patchValue({ currency_symbol: symbol });
  }

  saveBusinessSettings() {
    if (this.businessForm.invalid) return;

    this.isSavingBusiness.set(true);
    const val = this.businessForm.value as Partial<BusinessSettings>;

    this.settingsService.updateSettings(val).subscribe({
      next: (res) => {
        this.isSavingBusiness.set(false);
        if (res.success && res.data) {
          this.auth.updateSettings(res.data);
          this.notify.success('Business settings updated successfully');
        } else {
          this.notify.error(res.error || 'Failed to update settings');
        }
      },
      error: (err) => {
        this.isSavingBusiness.set(false);
        this.notify.error(err.error?.error || 'Update failed');
      }
    });
  }

  saveProfile() {
    if (this.profileForm.invalid) return;

    this.isSavingProfile.set(true);
    const val = this.profileForm.value;

    const payload: any = {
      full_name: val.full_name!,
      email: val.email!
    };

    if (val.new_password) {
      if (!val.current_password) {
        this.isSavingProfile.set(false);
        this.notify.error('Current password is required to change password');
        return;
      }
      payload.current_password = val.current_password;
      payload.new_password = val.new_password;
    }

    this.settingsService.updateProfile(payload).subscribe({
      next: (res) => {
        this.isSavingProfile.set(false);
        if (res.success && res.data) {
          this.auth.updateUser(res.data);
          this.notify.success('Account profile updated successfully');
          this.profileForm.patchValue({ current_password: '', new_password: '' });
        } else {
          this.notify.error(res.error || 'Failed to update profile');
        }
      },
      error: (err) => {
        this.isSavingProfile.set(false);
        this.notify.error(err.error?.error || 'Profile update failed');
      }
    });
  }
}
