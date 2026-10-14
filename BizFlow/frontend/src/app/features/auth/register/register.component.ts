import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="bf-card auth-card">
      <div class="auth-header">
        <div class="brand-badge">
          <img src="favicon.svg" alt="BizFlow Logo" class="auth-brand-img" />
        </div>
        <h1 class="auth-title">Create your Account</h1>
        <p class="auth-subtitle">Get started with BizFlow Business Management Suite</p>
      </div>

      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
        <div class="form-group">
          <label class="form-label" for="full_name">Your Full Name</label>
          <input
            id="full_name"
            type="text"
            formControlName="full_name"
            class="form-input"
            placeholder="e.g. Alex Morgan"
          />
          @if (registerForm.get('full_name')?.touched && registerForm.get('full_name')?.invalid) {
            <span class="form-error">Full name is required</span>
          }
        </div>

        <div class="form-group">
          <label class="form-label" for="business_name">Company / Business Name</label>
          <input
            id="business_name"
            type="text"
            formControlName="business_name"
            class="form-input"
            placeholder="e.g. Morgan Consulting LLC"
          />
          @if (registerForm.get('business_name')?.touched && registerForm.get('business_name')?.invalid) {
            <span class="form-error">Business name is required</span>
          }
        </div>

        <div class="form-group">
          <label class="form-label" for="email">Work Email</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            class="form-input"
            placeholder="name@business.com"
          />
          @if (registerForm.get('email')?.touched && registerForm.get('email')?.invalid) {
            <span class="form-error">Please enter a valid email</span>
          }
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Create Password</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            class="form-input"
            placeholder="Minimum 8 characters"
          />
          @if (registerForm.get('password')?.touched && registerForm.get('password')?.invalid) {
            <span class="form-error">Password must be at least 8 characters</span>
          }
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-block submit-btn"
          [disabled]="registerForm.invalid || auth.isLoading()"
        >
          @if (auth.isLoading()) {
            <span class="spinner"></span>
            <span>Setting up account...</span>
          } @else {
            <span>Create BizFlow Workspace</span>
            <span class="material-symbols-outlined">arrow_forward</span>
          }
        </button>
      </form>

      <div class="auth-footer">
        <span class="footer-text">Already have an account?</span>
        <a routerLink="/auth/login" class="footer-link">Sign in here</a>
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
      margin-top: 0.75rem;
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
export class RegisterComponent {
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  registerForm = this.fb.group({
    full_name: ['', [Validators.required, Validators.minLength(2)]],
    business_name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  onSubmit() {
    if (this.registerForm.valid) {
      const { full_name, business_name, email, password } = this.registerForm.value;
      this.auth.register({
        full_name: full_name!,
        business_name: business_name!,
        email: email!,
        password: password!
      }).subscribe();
    }
  }
}
