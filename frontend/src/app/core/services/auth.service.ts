import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { tap, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { NotificationService } from './notification.service';
import { User, BusinessSettings, ApiResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  private readonly TOKEN_KEY = 'bizflow_auth_token';

  currentUser = signal<User | null>(null);
  businessSettings = signal<BusinessSettings | null>(null);
  isLoading = signal<boolean>(false);
  lastAuthError = signal<string | null>(null);
  isAuthenticated = computed(() => !!this.currentUser() && !!this.getToken());
  isAdmin = computed(() => {
    const user = this.currentUser();
    if (!user) return false;
    return user.email?.toLowerCase().trim() === 'elanselvan1997@gmail.com';
  });

  constructor() {
    this.initSession();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  clearToken() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
    this.businessSettings.set(null);
  }

  private initSession() {
    const token = this.getToken();
    if (token) {
      this.loadProfile();
    }
  }

  login(credentials: { email: string; password: string }) {
    this.isLoading.set(true);
    this.lastAuthError.set(null);
    return this.api.post<{ token: string; user: User; settings: BusinessSettings }>('/auth/login', credentials).pipe(
      tap({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success && res.data) {
            this.lastAuthError.set(null);
            this.setToken(res.data.token);
            this.currentUser.set(res.data.user);
            this.businessSettings.set(res.data.settings);
            this.notify.success(`Welcome back, ${res.data.user.full_name}!`);
            this.router.navigate(['/dashboard']);
          } else {
            const err = res.error || 'Login failed';
            this.lastAuthError.set(err);
            this.notify.error(err);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          const msg = err.error?.error || 'Invalid credentials or network error';
          this.lastAuthError.set(msg);
          this.notify.error(msg);
        }
      })
    );
  }

  register(data: { email: string; password: string; full_name: string; business_name: string }) {
    this.isLoading.set(true);
    return this.api.post<{ token: string; user: User; settings: BusinessSettings }>('/auth/register', data).pipe(
      tap({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success && res.data) {
            this.setToken(res.data.token);
            this.currentUser.set(res.data.user);
            this.businessSettings.set(res.data.settings);
            this.notify.success('Account created successfully!');
            this.router.navigate(['/dashboard']);
          } else {
            this.notify.error(res.error || 'Registration failed');
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          const msg = err.error?.error || 'Registration failed';
          this.notify.error(msg);
        }
      })
    );
  }

  loadProfile() {
    return this.api.get<{ user: User; settings: BusinessSettings }>('/auth/me').pipe(
      catchError(() => {
        this.clearToken();
        return of(null);
      })
    ).subscribe(res => {
      if (res && res.success && res.data) {
        this.currentUser.set(res.data.user);
        this.businessSettings.set(res.data.settings);
      } else {
        this.clearToken();
      }
    });
  }

  updateSettings(settings: BusinessSettings) {
    this.businessSettings.set(settings);
  }

  updateUser(user: User) {
    this.currentUser.set(user);
  }

  logout() {
    this.api.post('/auth/logout', {}).subscribe();
    this.clearToken();
    this.notify.info('You have logged out');
    this.router.navigate(['/auth/login']);
  }
}
