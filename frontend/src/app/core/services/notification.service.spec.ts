import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('should initialize with an empty toast list', () => {
    expect(service.toasts().length).toBe(0);
  });

  it('should add a success toast notification', () => {
    service.success('Operation succeeded');
    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].message).toBe('Operation succeeded');
    expect(toasts[0].type).toBe('success');
  });

  it('should remove a toast by ID', () => {
    service.info('Notice');
    const toastId = service.toasts()[0].id;
    service.remove(toastId);
    expect(service.toasts().length).toBe(0);
  });
});
