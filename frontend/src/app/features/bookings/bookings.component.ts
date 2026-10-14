import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BookingService } from '../../core/services/booking.service';
import { CustomerService } from '../../core/services/customer.service';
import { ServicesService } from '../../core/services/services.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { Booking, Customer, Service } from '../../core/models';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MoneyPipe],
  template: `
    <div class="bookings-page">
      <div class="page-header">
        <div>
          <h1 class="header-title">Bookings & Appointments</h1>
          <p class="header-subtitle">Schedule client meetings, track service delivery, and manage session statuses</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span class="material-symbols-outlined">add_task</span>
          <span>Schedule Appointment</span>
        </button>
      </div>

      <!-- Filter Bar -->
      <div class="bf-card filter-card">
        <!-- Status Tabs -->
        <div class="status-tabs">
          <button class="tab-btn" [class.tab-active]="statusFilter === ''" (click)="setStatusFilter('')">
            All ({{ totalBookingsCount() }})
          </button>
          <button class="tab-btn" [class.tab-active]="statusFilter === 'confirmed'" (click)="setStatusFilter('confirmed')">
            Confirmed
          </button>
          <button class="tab-btn" [class.tab-active]="statusFilter === 'pending'" (click)="setStatusFilter('pending')">
            Pending
          </button>
          <button class="tab-btn" [class.tab-active]="statusFilter === 'completed'" (click)="setStatusFilter('completed')">
            Completed
          </button>
          <button class="tab-btn" [class.tab-active]="statusFilter === 'cancelled'" (click)="setStatusFilter('cancelled')">
            Cancelled
          </button>
        </div>

        <!-- Date Filter -->
        <div class="date-filter-box">
          <label class="date-label">Date:</label>
          <input type="date" class="form-input date-input" [(ngModel)]="dateFilter" (change)="loadBookings()" />
          @if (dateFilter) {
            <button class="btn btn-secondary btn-sm" (click)="dateFilter = ''; loadBookings()">Clear</button>
          }
        </div>
      </div>

      <!-- Bookings Table -->
      <div class="bf-table-container">
        <table class="bf-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Service</th>
              <th>Date & Time</th>
              <th>Duration</th>
              <th>Fee</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (booking of bookings(); track booking.id) {
              <tr>
                <td>
                  <div class="client-cell">
                    <div class="cell-main">{{ booking.customer_name }}</div>
                    <div class="cell-sub">{{ booking.customer_email || 'No email' }}</div>
                  </div>
                </td>
                <td>
                  <span class="service-pill">{{ booking.service_name }}</span>
                </td>
                <td>
                  <div class="cell-main">{{ booking.booking_date }}</div>
                  <div class="cell-sub font-mono">{{ booking.start_time }}</div>
                </td>
                <td>{{ booking.duration_minutes }} mins</td>
                <td>
                  <span class="cell-main font-semibold">{{ booking.total_amount_cents | money }}</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="getStatusBadgeClass(booking.status)">
                    <span class="badge-dot"></span>
                    <span>{{ booking.status }}</span>
                  </span>
                </td>
                <td style="text-align: right;">
                  <div class="action-btn-group">
                    @if (booking.status === 'pending') {
                      <button class="btn btn-secondary btn-sm btn-icon text-success" (click)="quickUpdateStatus(booking, 'confirmed')" title="Confirm Booking">
                        <span class="material-symbols-outlined">check</span>
                      </button>
                    }
                    @if (booking.status === 'confirmed') {
                      <button class="btn btn-secondary btn-sm btn-icon text-success" (click)="quickUpdateStatus(booking, 'completed')" title="Mark Completed">
                        <span class="material-symbols-outlined">task_alt</span>
                      </button>
                    }
                    <button class="btn btn-secondary btn-sm btn-icon" (click)="openEditModal(booking)" title="Edit Booking">
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button class="btn btn-secondary btn-sm btn-icon text-danger" (click)="confirmDelete(booking)" title="Cancel/Delete Booking">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="empty-state">
                  <span class="material-symbols-outlined empty-icon">event_busy</span>
                  <div class="empty-title">No appointments found</div>
                  <div class="empty-desc">Schedule your first appointment or clear active filters</div>
                  <button class="btn btn-primary btn-sm mt-3" (click)="openCreateModal()">Schedule Booking</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Create / Edit Booking Modal -->
      @if (showFormModal()) {
        <div class="modal-overlay">
          <div class="modal-dialog">
            <div class="modal-header">
              <h3 class="bf-card-title">{{ isEditing() ? 'Edit Appointment' : 'Schedule New Appointment' }}</h3>
              <button class="btn-close" (click)="closeFormModal()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <form [formGroup]="bookingForm" (ngSubmit)="saveBooking()">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">Client *</label>
                  <select formControlName="customer_id" class="form-select">
                    <option value="" disabled>Select a customer...</option>
                    @for (cust of availableCustomers(); track cust.id) {
                      <option [value]="cust.id">{{ cust.name }} {{ cust.company ? '(' + cust.company + ')' : '' }}</option>
                    }
                  </select>
                  @if (bookingForm.get('customer_id')?.touched && bookingForm.get('customer_id')?.invalid) {
                    <span class="form-error">Customer selection is required</span>
                  }
                </div>

                <div class="form-group">
                  <label class="form-label">Service Package *</label>
                  <select formControlName="service_id" class="form-select" (change)="onServiceSelected()">
                    <option value="" disabled>Select a service...</option>
                    @for (srv of availableServices(); track srv.id) {
                      <option [value]="srv.id">{{ srv.name }} ({{ srv.price_cents | money }} - {{ srv.duration_minutes }}m)</option>
                    }
                  </select>
                  @if (bookingForm.get('service_id')?.touched && bookingForm.get('service_id')?.invalid) {
                    <span class="form-error">Service selection is required</span>
                  }
                </div>

                <div class="form-row">
                  <div class="form-group flex-1">
                    <label class="form-label">Appointment Date *</label>
                    <input type="date" formControlName="booking_date" class="form-input" />
                    @if (bookingForm.get('booking_date')?.touched && bookingForm.get('booking_date')?.invalid) {
                      <span class="form-error">Date is required</span>
                    }
                  </div>
                  <div class="form-group flex-1">
                    <label class="form-label">Start Time (24h) *</label>
                    <input type="time" formControlName="start_time" class="form-input" />
                    @if (bookingForm.get('start_time')?.touched && bookingForm.get('start_time')?.invalid) {
                      <span class="form-error">Time is required</span>
                    }
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group flex-1">
                    <label class="form-label">Duration (Minutes)</label>
                    <input type="number" step="15" min="15" formControlName="duration_minutes" class="form-input" />
                  </div>
                  <div class="form-group flex-1">
                    <label class="form-label">Fee Amount ({{ auth.businessSettings()?.currency_symbol || '₹' }})</label>
                    <input type="number" step="0.01" min="0" formControlName="amountDollars" class="form-input" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Appointment Status</label>
                  <select formControlName="status" class="form-select">
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Preparation & Meeting Notes</label>
                  <textarea formControlName="notes" class="form-textarea" rows="2" placeholder="Agendas, video call links, or special instructions..."></textarea>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeFormModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="bookingForm.invalid || isSubmitting()">
                  {{ isSubmitting() ? 'Saving...' : (isEditing() ? 'Update Appointment' : 'Confirm & Schedule') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation -->
      @if (bookingToDelete()) {
        <div class="modal-overlay">
          <div class="modal-dialog modal-sm">
            <div class="modal-header">
              <h3 class="bf-card-title text-danger">Cancel Booking</h3>
              <button class="btn-close" (click)="bookingToDelete.set(null)">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to delete this appointment for <b>{{ bookingToDelete()?.customer_name }}</b>?</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="bookingToDelete.set(null)">Keep Booking</button>
              <button class="btn btn-danger" (click)="executeDelete()">Delete</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .bookings-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .header-title { font-size: 1.75rem; font-weight: 800; color: var(--text-main); }
    .header-subtitle { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; }

    .filter-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 1.25rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .status-tabs {
      display: flex;
      gap: 0.35rem;
      background: var(--surface-bg);
      padding: 0.25rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      overflow-x: auto;
    }
    .tab-btn {
      background: none;
      border: none;
      padding: 0.4rem 0.875rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .tab-btn:hover {
      color: var(--text-main);
    }
    .tab-active {
      background: #ffffff;
      color: var(--primary);
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .date-filter-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .date-label { font-size: 0.8125rem; font-weight: 600; color: var(--text-body); }
    .date-input { width: 160px; padding: 0.35rem 0.6rem; font-size: 0.8125rem; }

    .client-cell { display: flex; flex-direction: column; gap: 0.2rem; }
    .service-pill {
      font-weight: 600;
      color: var(--primary);
      background: var(--primary-light);
      padding: 0.25rem 0.6rem;
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;
    }
    .font-mono { font-family: monospace; }
    .font-semibold { font-weight: 600; }
    .action-btn-group { display: inline-flex; gap: 0.35rem; }
    .text-success { color: var(--success); }
    .text-success:hover { background-color: var(--success-light); }
    .text-danger { color: var(--danger); }
    .text-danger:hover { background-color: var(--danger-light); }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem !important;
    }
    .empty-icon { font-size: 3rem; color: var(--text-subtle); margin-bottom: 0.5rem; }
    .empty-title { font-size: 1.125rem; font-weight: 700; color: var(--text-main); }
    .empty-desc { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; }
    .mt-3 { margin-top: 0.75rem; }

    .form-row { display: flex; gap: 1rem; }
    .flex-1 { flex: 1; }
    .btn-close { background: none; border: none; cursor: pointer; color: var(--text-muted); }
  `]
})
export class BookingsComponent implements OnInit {
  private bookingService = inject(BookingService);
  private customerService = inject(CustomerService);
  private servicesService = inject(ServicesService);
  private notify = inject(NotificationService);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  bookings = signal<Booking[]>([]);
  totalBookingsCount = signal<number>(0);
  availableCustomers = signal<Customer[]>([]);
  availableServices = signal<Service[]>([]);

  statusFilter = '';
  dateFilter = '';

  showFormModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  editingId: string | null = null;
  bookingToDelete = signal<Booking | null>(null);

  bookingForm = this.fb.group({
    customer_id: ['', [Validators.required]],
    service_id: ['', [Validators.required]],
    booking_date: ['', [Validators.required]],
    start_time: ['10:00', [Validators.required]],
    duration_minutes: [60, [Validators.required, Validators.min(1)]],
    amountDollars: [150.00, [Validators.required, Validators.min(0)]],
    status: ['pending', [Validators.required]],
    notes: ['']
  });

  ngOnInit() {
    this.loadBookings();
    this.loadDropdownData();
  }

  loadBookings() {
    this.bookingService.getBookings({
      status: this.statusFilter,
      date: this.dateFilter
    }).subscribe(res => {
      if (res.success && res.data) {
        this.bookings.set(res.data);
        if (!this.statusFilter) {
          this.totalBookingsCount.set(res.meta?.total || res.data.length);
        }
      }
    });
  }

  loadDropdownData() {
    this.customerService.getCustomers({ limit: 100, status: 'active' }).subscribe(res => {
      if (res.success && res.data) {
        this.availableCustomers.set(res.data);
      }
    });

    this.servicesService.getServices({ active: true }).subscribe(res => {
      if (res.success && res.data) {
        this.availableServices.set(res.data);
      }
    });
  }

  setStatusFilter(status: string) {
    this.statusFilter = status;
    this.loadBookings();
  }

  onServiceSelected() {
    const srvId = this.bookingForm.get('service_id')?.value;
    const selected = this.availableServices().find(s => s.id === srvId);
    if (selected) {
      this.bookingForm.patchValue({
        duration_minutes: selected.duration_minutes,
        amountDollars: selected.price_cents / 100
      });
    }
  }

  openCreateModal() {
    this.isEditing.set(false);
    this.editingId = null;
    const today = new Date().toISOString().split('T')[0];
    this.bookingForm.reset({
      customer_id: '',
      service_id: '',
      booking_date: today,
      start_time: '10:00',
      duration_minutes: 60,
      amountDollars: 150.00,
      status: 'pending',
      notes: ''
    });
    this.showFormModal.set(true);
  }

  openEditModal(booking: Booking) {
    this.isEditing.set(true);
    this.editingId = booking.id;
    this.bookingForm.patchValue({
      customer_id: booking.customer_id,
      service_id: booking.service_id,
      booking_date: booking.booking_date,
      start_time: booking.start_time,
      duration_minutes: booking.duration_minutes,
      amountDollars: booking.total_amount_cents / 100,
      status: booking.status,
      notes: booking.notes || ''
    });
    this.showFormModal.set(true);
  }

  closeFormModal() {
    this.showFormModal.set(false);
  }

  saveBooking() {
    if (this.bookingForm.invalid) return;

    this.isSubmitting.set(true);
    const val = this.bookingForm.value;
    const total_amount_cents = Math.round((Number(val.amountDollars) || 0) * 100);

    const payload: Partial<Booking> = {
      customer_id: val.customer_id!,
      service_id: val.service_id!,
      booking_date: val.booking_date!,
      start_time: val.start_time!,
      duration_minutes: Number(val.duration_minutes) || 60,
      total_amount_cents,
      status: val.status as any,
      notes: val.notes || null
    };

    if (this.isEditing() && this.editingId) {
      this.bookingService.updateBooking(this.editingId, payload).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          if (res.success) {
            this.notify.success('Booking updated');
            this.closeFormModal();
            this.loadBookings();
          } else {
            this.notify.error(res.error || 'Failed to update booking');
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.notify.error(err.error?.error || 'Update failed');
        }
      });
    } else {
      this.bookingService.createBooking(payload).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          if (res.success) {
            this.notify.success('Appointment scheduled successfully');
            this.closeFormModal();
            this.loadBookings();
          } else {
            this.notify.error(res.error || 'Failed to schedule booking');
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.notify.error(err.error?.error || 'Creation failed');
        }
      });
    }
  }

  quickUpdateStatus(booking: Booking, status: 'confirmed' | 'completed' | 'cancelled') {
    this.bookingService.updateBooking(booking.id, { status }).subscribe(res => {
      if (res.success) {
        this.notify.success(`Booking status changed to ${status}`);
        this.loadBookings();
      }
    });
  }

  confirmDelete(booking: Booking) {
    this.bookingToDelete.set(booking);
  }

  executeDelete() {
    const booking = this.bookingToDelete();
    if (!booking) return;

    this.bookingService.deleteBooking(booking.id).subscribe({
      next: (res) => {
        this.bookingToDelete.set(null);
        if (res.success) {
          this.notify.success('Booking deleted');
          this.loadBookings();
        } else {
          this.notify.error(res.error || 'Could not delete booking');
        }
      },
      error: (err) => {
        this.bookingToDelete.set(null);
        this.notify.error(err.error?.error || 'Failed to delete');
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed': return 'badge-success';
      case 'confirmed': return 'badge-info';
      case 'pending': return 'badge-warning';
      case 'cancelled': return 'badge-danger';
      default: return 'badge-neutral';
    }
  }
}
