import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastContainerComponent],
  template: `
    <div class="auth-wrapper">
      <div class="auth-bg-ambient"></div>
      <div class="auth-container">
        <router-outlet></router-outlet>
      </div>
      <app-toast-container></app-toast-container>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background-color: #f8fafc;
      position: relative;
      overflow: hidden;
    }
    .auth-bg-ambient {
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(79, 70, 229, 0.12) 0%, rgba(248, 250, 252, 0) 70%);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
    .auth-container {
      width: 100%;
      max-width: 460px;
      position: relative;
      z-index: 10;
    }
  `]
})
export class AuthLayoutComponent {}
