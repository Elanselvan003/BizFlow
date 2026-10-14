import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PORTFOLIO_CONFIG } from '../../core/config/portfolio.config';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <main class="not-found-section">
      <div class="container text-center">
        <span class="error-code">404</span>
        <h1 class="error-title">Page Not Found</h1>
        <p class="error-desc">
          The page you are looking for doesn't exist or has moved. Return to the home page or contact {{ config.developer.name }} directly.
        </p>
        <div class="cta-wrap">
          <a routerLink="/" class="btn btn-primary">Return to Home</a>
          <a routerLink="/" fragment="contact" class="btn btn-secondary">Contact Developer</a>
        </div>
      </div>
    </main>
  `,
  styles: [`
    .not-found-section {
      min-height: 60vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-block: 5rem;
      text-align: center;
    }
    .error-code {
      font-family: var(--font-display);
      font-size: 5rem;
      font-weight: 900;
      color: var(--color-accent);
      line-height: 1;
      display: block;
      margin-bottom: 1rem;
    }
    .error-title {
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin-bottom: 1rem;
    }
    .error-desc {
      font-size: 1.0625rem;
      color: var(--color-text-secondary);
      max-width: 480px;
      margin-inline: auto;
      margin-bottom: 2rem;
      line-height: 1.6;
    }
    .cta-wrap {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
  `]
})
export class NotFoundComponent {
  readonly config = PORTFOLIO_CONFIG;
}
