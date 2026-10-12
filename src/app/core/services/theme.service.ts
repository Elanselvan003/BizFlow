import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // Default to 'light' mode as explicitly requested
  readonly currentTheme = signal<ThemeMode>('light');
  readonly isDark = signal<boolean>(false);

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    if (!this.isBrowser) return;

    // Check saved preference or default to light
    const saved = localStorage.getItem('sw_theme') as ThemeMode | null;
    const initialTheme: ThemeMode = (saved === 'dark' || saved === 'light') ? saved : 'light';

    this.setTheme(initialTheme);
  }

  toggleTheme(): void {
    const nextTheme: ThemeMode = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(nextTheme);
  }

  setTheme(theme: ThemeMode): void {
    this.currentTheme.set(theme);
    this.isDark.set(theme === 'dark');

    if (!this.isBrowser) return;

    try {
      localStorage.setItem('sw_theme', theme);
      const root = document.documentElement;
      root.setAttribute('data-theme', theme);

      // Update mobile browser chrome theme color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#0a0f1d' : '#1d4ed8');
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }
}
