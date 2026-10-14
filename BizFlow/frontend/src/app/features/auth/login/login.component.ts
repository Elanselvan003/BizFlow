import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="bf-card auth-card">
      <div class="auth-header">
        <div class="brand-badge">
          <img src="favicon.svg" alt="BizFlow Logo" class="auth-brand-img" />
        </div>
        <h1 class="auth-title">Welcome to BizFlow</h1>
        <p class="auth-subtitle">Sign in to manage your clients, bookings, and billing</p>
      </div>

      <!-- Deactivated Account Alert -->
      @if (auth.lastAuthError() && auth.lastAuthError()!.includes('deactivated')) {
        <div class="deactivated-alert">
          <div class="alert-icon-box">
            <span class="material-symbols-outlined">block</span>
          </div>
          <div class="alert-text">
            <h4 class="alert-heading">Account Deactivated</h4>
            <p class="alert-desc">{{ auth.lastAuthError() }}</p>
            <a href="mailto:elanselvan1997@gmail.com?subject=BizFlow Account Activation Request" class="alert-action-btn">
              <span class="material-symbols-outlined">mail</span>
              <span>Contact Administrator (elanselvan1997@gmail.com)</span>
            </a>
          </div>
        </div>
      }

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
        <div class="form-group">
          <label class="form-label" for="email">Business Email</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            class="form-input"
            placeholder="name@business.com"
            autocomplete="email"
          />
          @if (loginForm.get('email')?.touched && loginForm.get('email')?.invalid) {
            <span class="form-error">Please enter a valid email address</span>
          }
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Password</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            class="form-input"
            placeholder="••••••••"
            autocomplete="current-password"
          />
          @if (loginForm.get('password')?.touched && loginForm.get('password')?.invalid) {
            <span class="form-error">Password is required (min 8 characters)</span>
          }
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-block submit-btn"
          [disabled]="loginForm.invalid || auth.isLoading()"
        >
          @if (auth.isLoading()) {
            <span class="spinner"></span>
            <span>Signing in...</span>
          } @else {
            <span>Sign In to Dashboard</span>
            <span class="material-symbols-outlined">arrow_forward</span>
          }
        </button>
      </form>

      <div class="auth-footer">
        <span class="footer-text">New to BizFlow?</span>
        <a routerLink="/auth/register" class="footer-link">Create an account</a>
      </div>
    </div>
  `,
  styles: [`
    .auth-card {
      padding: 2.25rem;
      border-radius: var(--radius-xl);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
    }
    .auth-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .brand-badge {
      width: 3.25rem;
      height: 3.25rem;
      border-radius: var(--radius-lg);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
      margin-bottom: 1rem;
      overflow: hidden;
    }
    .auth-brand-img {
      width: 100%;
      height: 100%;
      border-radius: inherit;
      display: block;
    }
    .deactivated-alert {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid var(--danger);
      border-radius: var(--radius-md);
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .alert-icon-box {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.12);
      color: var(--danger);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .alert-icon-box span {
      font-size: 1.35rem;
    }
    .alert-text {
      flex: 1;
    }
    .alert-heading {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #991b1b;
      margin: 0 0 0.25rem 0;
    }
    .alert-desc {
      font-size: 0.8125rem;
      color: #7f1d1d;
      margin: 0 0 0.75rem 0;
      line-height: 1.4;
    }
    .alert-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      background: var(--danger);
      color: #ffffff;
      padding: 0.4rem 0.875rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      text-decoration: none;
      transition: background 0.15s ease;
    }
    .alert-action-btn:hover {
      background: #dc2626;
      text-decoration: none;
    }
    .alert-action-btn span {
      font-size: 0.95rem;
    }
    .auth-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 0.35rem;
    }
    .auth-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .btn-block {
      width: 100%;
    }
    .submit-btn {
      margin-top: 0.5rem;
      padding: 0.75rem;
    }
    .auth-footer {
      text-align: center;
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-light);
      font-size: 0.875rem;
    }
    .footer-text {
      color: var(--text-muted);
      margin-right: 0.35rem;
    }
    .footer-link {
      font-weight: 600;
      color: var(--primary);
    }
    .footer-link:hover {
      text-decoration: underline;
    }
    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoginComponent {
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.auth.login({ email: email!, password: password! }).subscribe();
    }
  }
}
