import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-wrapper">
      @for (toast of notify.toasts(); track toast.id) {
        <div class="toast-item" [ngClass]="'toast-' + toast.type">
          <div class="toast-icon">
            @if (toast.type === 'success') {
              <span class="material-symbols-outlined">check_circle</span>
            } @else if (toast.type === 'error') {
              <span class="material-symbols-outlined">error</span>
            } @else {
              <span class="material-symbols-outlined">info</span>
            }
          </div>
          <div class="toast-message">{{ toast.message }}</div>
          <button class="toast-close" (click)="notify.remove(toast.id)" aria-label="Close notification">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-wrapper {
      position: fixed;
      top: 1.25rem;
      right: 1.25rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      pointer-events: none;
      max-width: 420px;
      width: calc(100% - 2.5rem);
    }
    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.125rem;
      border-radius: var(--radius-lg);
      background: #ffffff;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--border-color);
      animation: toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .toast-icon .material-symbols-outlined {
      font-size: 1.35rem;
    }
    .toast-success {
      border-left: 4px solid var(--success);
      .toast-icon { color: var(--success); }
    }
    .toast-error {
      border-left: 4px solid var(--danger);
      .toast-icon { color: var(--danger); }
    }
    .toast-info {
      border-left: 4px solid var(--primary);
      .toast-icon { color: var(--primary); }
    }
    .toast-message {
      flex: 1;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-main);
      line-height: 1.4;
    }
    .toast-close {
      background: transparent;
      border: none;
      color: var(--text-subtle);
      cursor: pointer;
      display: flex;
      padding: 0.2rem;
      border-radius: 4px;
      transition: color 0.15s, background-color 0.15s;
    }
    .toast-close:hover {
      color: var(--text-main);
      background-color: var(--surface-hover);
    }
    .toast-close .material-symbols-outlined {
      font-size: 1.1rem;
    }
    @keyframes toastSlideIn {
      from { transform: translateX(20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastContainerComponent {
  notify = inject(NotificationService);
}
