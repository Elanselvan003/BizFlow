import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ServicesService } from '../../core/services/services.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { Service } from '../../core/models';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MoneyPipe],
  template: `
    <div class="services-page">
      <div class="page-header">
        <div>
          <h1 class="header-title">Services & Pricing</h1>
          <p class="header-subtitle">Define service offerings, hourly rates, fixed packages, and session durations</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span class="material-symbols-outlined">add_circle</span>
          <span>Create Service</span>
        </button>
      </div>

      <!-- Services Grid -->
      <div class="services-grid">
        @for (srv of services(); track srv.id) {
          <div class="bf-card service-card" [class.service-inactive]="srv.is_active === 0">
            <div class="service-card-top">
              <div class="service-badge-row">
                <span class="badge" [ngClass]="srv.is_active === 1 ? 'badge-success' : 'badge-neutral'">
                  <span class="badge-dot"></span>
                  <span>{{ srv.is_active === 1 ? 'Active Offering' : 'Archived' }}</span>
                </span>
                <div class="card-menu">
                  <button class="btn btn-secondary btn-sm btn-icon" (click)="openEditModal(srv)" title="Edit Service">
                    <span class="material-symbols-outlined">edit</span>
                  </button>
                  <button class="btn btn-secondary btn-sm btn-icon text-danger" (click)="confirmDelete(srv)" title="Delete Service">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
              <h3 class="service-name">{{ srv.name }}</h3>
              <p class="service-desc">{{ srv.description || 'No description provided for this service catalog item.' }}</p>
            </div>

            <div class="service-meta-box">
              <div class="meta-item">
                <span class="meta-label">Duration</span>
                <div class="meta-val">
                  <span class="material-symbols-outlined meta-icon">timelapse</span>
                  <span>{{ srv.duration_minutes }} mins</span>
                </div>
              </div>
              <div class="meta-item price-item">
                <span class="meta-label">Standard Rate</span>
                <div class="meta-price">{{ srv.price_cents | money }}</div>
              </div>
            </div>
          </div>
        } @empty {
          <div class="bf-card empty-catalog">
            <span class="material-symbols-outlined empty-icon">medical_services</span>
            <div class="empty-title">Service catalog is empty</div>
            <p class="empty-desc">Create your consulting, advisory, or hourly services to start scheduling bookings</p>
            <button class="btn btn-primary mt-3" (click)="openCreateModal()">Add First Service</button>
          </div>
        }
      </div>

      <!-- Create / Edit Service Modal -->
      @if (showFormModal()) {
        <div class="modal-overlay">
          <div class="modal-dialog">
            <div class="modal-header">
              <h3 class="bf-card-title">{{ isEditing() ? 'Edit Service' : 'New Service Offering' }}</h3>
              <button class="btn-close" (click)="closeFormModal()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <form [formGroup]="serviceForm" (ngSubmit)="saveService()">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">Service Title *</label>
                  <input type="text" formControlName="name" class="form-input" placeholder="e.g. Workflow Automation Advisory" />
                  @if (serviceForm.get('name')?.touched && serviceForm.get('name')?.invalid) {
                    <span class="form-error">Title is required</span>
                  }
                </div>

                <div class="form-group">
                  <label class="form-label">Service Description</label>
                  <textarea formControlName="description" class="form-textarea" rows="3" placeholder="Outline what is included in this service package..."></textarea>
                </div>

                <div class="form-row">
                  <div class="form-group flex-1">
                    <label class="form-label">Rate / Price ({{ auth.businessSettings()?.currency_symbol || '₹' }}) *</label>
                    <input type="number" step="0.01" min="0" formControlName="priceDollars" class="form-input" placeholder="150.00" />
                    @if (serviceForm.get('priceDollars')?.touched && serviceForm.get('priceDollars')?.invalid) {
                      <span class="form-error">Valid positive price is required</span>
                    }
                  </div>

                  <div class="form-group flex-1">
                    <label class="form-label">Duration (Minutes) *</label>
                    <input type="number" step="15" min="15" formControlName="duration_minutes" class="form-input" placeholder="60" />
                    @if (serviceForm.get('duration_minutes')?.touched && serviceForm.get('duration_minutes')?.invalid) {
                      <span class="form-error">Duration must be > 0</span>
                    }
                  </div>
                </div>

                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="is_active" class="checkbox-input" />
                    <span>Active for booking appointments</span>
                  </label>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeFormModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="serviceForm.invalid || isSubmitting()">
                  {{ isSubmitting() ? 'Saving...' : (isEditing() ? 'Update Service' : 'Save Service') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (serviceToDelete()) {
        <div class="modal-overlay">
          <div class="modal-dialog modal-sm">
            <div class="modal-header">
              <h3 class="bf-card-title text-danger">Delete Service</h3>
              <button class="btn-close" (click)="serviceToDelete.set(null)">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to delete <b>{{ serviceToDelete()?.name }}</b>? Services linked to existing bookings should be deactivated instead.</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="serviceToDelete.set(null)">Cancel</button>
              <button class="btn btn-danger" (click)="executeDelete()">Confirm Delete</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .services-page {
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

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }
    .service-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 1.5rem;
      position: relative;
    }
    .service-inactive {
      opacity: 0.65;
      background-color: #fbfbfb;
    }
    .service-badge-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.875rem;
    }
    .card-menu {
      display: flex;
      gap: 0.35rem;
    }
    .service-name {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 0.5rem;
    }
    .service-desc {
      font-size: 0.84rem;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 1.25rem;
    }
    .service-meta-box {
      border-top: 1px solid var(--border-light);
      padding-top: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .meta-label {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-subtle);
    }
    .meta-val {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-body);
    }
    .meta-icon { font-size: 1rem; color: var(--text-muted); }
    .price-item { text-align: right; }
    .meta-price {
      font-family: var(--font-heading);
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--primary);
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-body);
      cursor: pointer;
    }
    .checkbox-input {
      width: 1rem;
      height: 1rem;
      accent-color: var(--primary);
      cursor: pointer;
    }
    .empty-catalog {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem 1rem;
    }
    .empty-icon { font-size: 3rem; color: var(--text-subtle); margin-bottom: 0.5rem; }
    .empty-title { font-size: 1.125rem; font-weight: 700; color: var(--text-main); }
    .empty-desc { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; }
    .mt-3 { margin-top: 0.75rem; }
    .form-row { display: flex; gap: 1rem; }
    .flex-1 { flex: 1; }
    .btn-close { background: none; border: none; cursor: pointer; color: var(--text-muted); }
    .text-danger { color: var(--danger); }
  `]
})
export class ServicesComponent implements OnInit {
  private servicesService = inject(ServicesService);
  private notify = inject(NotificationService);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  services = signal<Service[]>([]);
  showFormModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  editingId: string | null = null;
  serviceToDelete = signal<Service | null>(null);

  serviceForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    priceDollars: [150.00, [Validators.required, Validators.min(0)]],
    duration_minutes: [60, [Validators.required, Validators.min(1)]],
    is_active: [true]
  });

  ngOnInit() {
    this.loadServices();
  }

  loadServices() {
    this.servicesService.getServices().subscribe(res => {
      if (res.success && res.data) {
        this.services.set(res.data);
      }
    });
  }

  openCreateModal() {
    this.isEditing.set(false);
    this.editingId = null;
    this.serviceForm.reset({
      name: '',
      description: '',
      priceDollars: 150.00,
      duration_minutes: 60,
      is_active: true
    });
    this.showFormModal.set(true);
  }

  openEditModal(srv: Service) {
    this.isEditing.set(true);
    this.editingId = srv.id;
    this.serviceForm.patchValue({
      name: srv.name,
      description: srv.description || '',
      priceDollars: srv.price_cents / 100,
      duration_minutes: srv.duration_minutes,
      is_active: srv.is_active === 1
    });
    this.showFormModal.set(true);
  }

  closeFormModal() {
    this.showFormModal.set(false);
  }

  saveService() {
    if (this.serviceForm.invalid) return;

    this.isSubmitting.set(true);
    const val = this.serviceForm.value;
    const price_cents = Math.round((Number(val.priceDollars) || 0) * 100);

    const payload: Partial<Service> = {
      name: val.name!,
      description: val.description || null,
      price_cents,
      duration_minutes: Number(val.duration_minutes) || 60,
      is_active: val.is_active ? 1 : 0
    };

    if (this.isEditing() && this.editingId) {
      this.servicesService.updateService(this.editingId, payload).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          if (res.success) {
            this.notify.success('Service updated');
            this.closeFormModal();
            this.loadServices();
          } else {
            this.notify.error(res.error || 'Failed to update service');
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.notify.error(err.error?.error || 'Update failed');
        }
      });
    } else {
      this.servicesService.createService(payload).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          if (res.success) {
            this.notify.success('Service created successfully');
            this.closeFormModal();
            this.loadServices();
          } else {
            this.notify.error(res.error || 'Failed to create service');
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.notify.error(err.error?.error || 'Creation failed');
        }
      });
    }
  }

  confirmDelete(srv: Service) {
    this.serviceToDelete.set(srv);
  }

  executeDelete() {
    const srv = this.serviceToDelete();
    if (!srv) return;

    this.servicesService.deleteService(srv.id).subscribe({
      next: (res) => {
        this.serviceToDelete.set(null);
        if (res.success) {
          this.notify.success('Service deleted');
          this.loadServices();
        } else {
          this.notify.error(res.error || 'Could not delete service');
        }
      },
      error: (err) => {
        this.serviceToDelete.set(null);
        this.notify.error(err.error?.error || 'Failed to delete service');
      }
    });
  }
}
