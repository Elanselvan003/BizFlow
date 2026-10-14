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
          <span class="material-symbols-outlined logo-icon">insights</span>
        </div>
        <h1 class="auth-title">Welcome to BizFlow</h1>
        <p class="auth-subtitle">Sign in to manage your clients, bookings, and billing</p>
      </div>

      <!-- Quick Demo Account Fill Button -->
      <div class="demo-box">
        <div class="demo-info">
          <span class="demo-tag">Demo Mode</span>
          <span class="demo-text">Explore with pre-seeded data & reports</span>
        </div>
        <button type="button" class="btn btn-secondary btn-sm demo-fill-btn" (click)="fillDemoCredentials()">
          <span class="material-symbols-outlined">auto_fix_high</span>
          <span>Quick Fill Demo</span>
        </button>
      </div>

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
      background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
      border-radius: var(--radius-lg);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
      margin-bottom: 1rem;
    }
    .brand-badge .logo-icon {
      font-size: 1.85rem;
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
    .demo-box {
      background: var(--primary-light);
      border: 1px dashed #c7d2fe;
      border-radius: var(--radius-md);
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }
    .demo-info {
      display: flex;
      flex-direction: column;
    }
    .demo-tag {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--primary);
    }
    .demo-text {
      font-size: 0.75rem;
      color: #4338ca;
    }
    .demo-fill-btn {
      white-space: nowrap;
      font-size: 0.75rem;
      padding: 0.35rem 0.65rem;
      border-color: #a5b4fc;
      background: #ffffff;
      color: var(--primary);
    }
    .demo-fill-btn:hover {
      background: #f5f3ff;
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
    email: ['elanselvan1997@gmail.com', [Validators.required, Validators.email]],
    password: ['Admin123!', [Validators.required, Validators.minLength(8)]]
  });

  fillDemoCredentials() {
    this.loginForm.setValue({
      email: 'elanselvan1997@gmail.com',
      password: 'Admin123!'
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.auth.login({ email: email!, password: password! }).subscribe();
    }
  }
}
