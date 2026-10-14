import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CustomerService } from '../../core/services/customer.service';
import { NotificationService } from '../../core/services/notification.service';
import { Customer } from '../../core/models';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MoneyPipe],
  template: `
    <div class="customers-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="header-title">Customers Directory</h1>
          <p class="header-subtitle">Manage client accounts, contact information, and billing histories</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span class="material-symbols-outlined">person_add</span>
          <span>Add New Customer</span>
        </button>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="bf-card filter-card">
        <div class="search-box">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            class="search-input"
            placeholder="Search by name, email, or company..."
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()"
          />
        </div>

        <div class="filter-actions">
          <select class="form-select filter-select" [(ngModel)]="statusFilter" (change)="loadCustomers()">
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      <!-- Customers Table -->
      <div class="bf-table-container">
        <table class="bf-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Contact Info</th>
              <th>Company</th>
              <th>Status</th>
              <th>Bookings</th>
              <th>Total Invoiced</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (cust of customers(); track cust.id) {
              <tr>
                <td>
                  <div class="customer-name-cell">
                    <div class="cust-avatar">{{ cust.name.slice(0, 2).toUpperCase() }}</div>
                    <div>
                      <div class="cell-main">{{ cust.name }}</div>
                      <div class="cell-sub">Added {{ cust.created_at.slice(0, 10) }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="contact-cell">
                    @if (cust.email) {
                      <div class="contact-item">
                        <span class="material-symbols-outlined icon-subtle">mail</span>
                        <span>{{ cust.email }}</span>
                      </div>
                    }
                    @if (cust.phone) {
                      <div class="contact-item">
                        <span class="material-symbols-outlined icon-subtle">call</span>
                        <span>{{ cust.phone }}</span>
                      </div>
                    }
                  </div>
                </td>
                <td>
                  <span class="company-tag">{{ cust.company || '—' }}</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="cust.status === 'active' ? 'badge-success' : 'badge-neutral'">
                    <span class="badge-dot"></span>
                    <span>{{ cust.status }}</span>
                  </span>
                </td>
                <td>
                  <span class="metric-badge">{{ cust.booking_count || 0 }}</span>
                </td>
                <td>
                  <span class="cell-main">{{ (cust.total_invoiced_cents || 0) | money }}</span>
                </td>
                <td style="text-align: right;">
                  <div class="action-btn-group">
                    <button class="btn btn-secondary btn-sm btn-icon" (click)="viewCustomer(cust)" title="View Details">
                      <span class="material-symbols-outlined">visibility</span>
                    </button>
                    <button class="btn btn-secondary btn-sm btn-icon" (click)="openEditModal(cust)" title="Edit Customer">
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button class="btn btn-secondary btn-sm btn-icon text-danger" (click)="confirmDelete(cust)" title="Delete Customer">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="empty-state">
                  <span class="material-symbols-outlined empty-icon">group_off</span>
                  <div class="empty-title">No customers found</div>
                  <div class="empty-desc">Create your first client account or adjust your search filter</div>
                  <button class="btn btn-primary btn-sm mt-3" (click)="openCreateModal()">Add Customer</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (totalPages() > 1) {
        <div class="pagination-bar">
          <span class="pagination-info">Showing page {{ currentPage() }} of {{ totalPages() }} ({{ totalCount() }} total)</span>
          <div class="pagination-controls">
            <button class="btn btn-secondary btn-sm" [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">
              Previous
            </button>
            <button class="btn btn-secondary btn-sm" [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">
              Next
            </button>
          </div>
        </div>
      }

      <!-- Create / Edit Customer Modal -->
      @if (showFormModal()) {
        <div class="modal-overlay">
          <div class="modal-dialog">
            <div class="modal-header">
              <h3 class="bf-card-title">{{ isEditing() ? 'Edit Customer Details' : 'Create New Customer' }}</h3>
              <button class="btn-close" (click)="closeFormModal()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <form [formGroup]="customerForm" (ngSubmit)="saveCustomer()">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">Full Name *</label>
                  <input type="text" formControlName="name" class="form-input" placeholder="e.g. John Doe" />
                  @if (customerForm.get('name')?.touched && customerForm.get('name')?.invalid) {
                    <span class="form-error">Name is required</span>
                  }
                </div>

                <div class="form-row">
                  <div class="form-group flex-1">
                    <label class="form-label">Email Address</label>
                    <input type="email" formControlName="email" class="form-input" placeholder="john@company.com" />
                  </div>
                  <div class="form-group flex-1">
                    <label class="form-label">Phone Number</label>
                    <input type="tel" formControlName="phone" class="form-input" placeholder="+1 (555) 000-0000" />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group flex-1">
                    <label class="form-label">Company / Organization</label>
                    <input type="text" formControlName="company" class="form-input" placeholder="Acme Inc." />
                  </div>
                  <div class="form-group flex-1">
                    <label class="form-label">Status</label>
                    <select formControlName="status" class="form-select">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Physical / Billing Address</label>
                  <input type="text" formControlName="address" class="form-input" placeholder="Street, City, State, ZIP" />
                </div>

                <div class="form-group">
                  <label class="form-label">Internal Client Notes</label>
                  <textarea formControlName="notes" class="form-textarea" rows="3" placeholder="Contract preferences, meeting requirements..."></textarea>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeFormModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="customerForm.invalid || isSubmitting()">
                  {{ isSubmitting() ? 'Saving...' : (isEditing() ? 'Update Customer' : 'Save Customer') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Customer Detail View Modal -->
      @if (selectedCustomer()) {
        <div class="modal-overlay">
          <div class="modal-dialog modal-lg">
            <div class="modal-header">
              <div class="detail-header-info">
                <h3 class="bf-card-title">{{ selectedCustomer()?.name }}</h3>
                <span class="badge" [ngClass]="selectedCustomer()?.status === 'active' ? 'badge-success' : 'badge-neutral'">
                  {{ selectedCustomer()?.status }}
                </span>
              </div>
              <button class="btn-close" (click)="selectedCustomer.set(null)">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="modal-body">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Email</span>
                  <span class="detail-value">{{ selectedCustomer()?.email || 'N/A' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Phone</span>
                  <span class="detail-value">{{ selectedCustomer()?.phone || 'N/A' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Company</span>
                  <span class="detail-value">{{ selectedCustomer()?.company || 'N/A' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Address</span>
                  <span class="detail-value">{{ selectedCustomer()?.address || 'N/A' }}</span>
                </div>
              </div>

              @if (selectedCustomer()?.notes) {
                <div class="detail-notes-box">
                  <span class="detail-label">Client Notes</span>
                  <p class="notes-text">{{ selectedCustomer()?.notes }}</p>
                </div>
              }

              <!-- Customer Bookings History -->
              <h4 class="section-heading mt-4">Recent Bookings ({{ customerDetails()?.bookings?.length || 0 }})</h4>
              <div class="bf-table-container mt-2">
                <table class="bf-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Date & Time</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (b of customerDetails()?.bookings || []; track b.id) {
                      <tr>
                        <td>{{ b.service_name }}</td>
                        <td>{{ b.booking_date }} at {{ b.start_time }}</td>
                        <td>{{ b.total_amount_cents | money }}</td>
                        <td><span class="badge badge-info">{{ b.status }}</span></td>
                      </tr>
                    } @empty {
                      <tr><td colspan="4" class="empty-cell">No bookings recorded</td></tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Customer Invoices History -->
              <h4 class="section-heading mt-4">Invoices ({{ customerDetails()?.invoices?.length || 0 }})</h4>
              <div class="bf-table-container mt-2">
                <table class="bf-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Issue Date</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (inv of customerDetails()?.invoices || []; track inv.id) {
                      <tr>
                        <td><b>{{ inv.invoice_number }}</b></td>
                        <td>{{ inv.issue_date }}</td>
                        <td>{{ inv.total_cents | money }}</td>
                        <td><span class="badge" [ngClass]="inv.status === 'paid' ? 'badge-success' : 'badge-warning'">{{ inv.status }}</span></td>
                      </tr>
                    } @empty {
                      <tr><td colspan="4" class="empty-cell">No invoices on file</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="selectedCustomer.set(null)">Close</button>
              <button class="btn btn-primary" (click)="openEditModal(selectedCustomer()!); selectedCustomer.set(null)">
                <span class="material-symbols-outlined">edit</span>
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Delete Confirmation Dialog -->
      @if (customerToDelete()) {
        <div class="modal-overlay">
          <div class="modal-dialog modal-sm">
            <div class="modal-header">
              <h3 class="bf-card-title text-danger">Delete Customer</h3>
              <button class="btn-close" (click)="customerToDelete.set(null)">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to delete <b>{{ customerToDelete()?.name }}</b>? This action cannot be undone.</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="customerToDelete.set(null)">Cancel</button>
              <button class="btn btn-danger" (click)="executeDelete()">Confirm Delete</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .customers-page {
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
    .header-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-main);
    }
    .header-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    /* Filter Card */
    .filter-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.25rem;
      flex-wrap: wrap;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--surface-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.4rem 0.75rem;
      flex: 1;
      max-width: 480px;
    }
    .search-icon {
      color: var(--text-subtle);
      font-size: 1.25rem;
    }
    .search-input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      font-family: var(--font-sans);
      font-size: 0.875rem;
      color: var(--text-main);
    }
    .filter-actions {
      display: flex;
      gap: 0.75rem;
    }
    .filter-select {
      width: 160px;
      padding: 0.45rem 0.75rem;
    }

    /* Table Styles */
    .customer-name-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .cust-avatar {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
      color: var(--primary);
      font-weight: 700;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .cell-main { font-weight: 600; color: var(--text-main); }
    .cell-sub { font-size: 0.75rem; color: var(--text-muted); }
    .contact-cell { display: flex; flex-direction: column; gap: 0.2rem; }
    .contact-item {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8125rem;
      color: var(--text-body);
    }
    .icon-subtle { font-size: 0.95rem; color: var(--text-subtle); }
    .company-tag { font-weight: 500; color: var(--text-body); }
    .metric-badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      background: #f1f5f9;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 0.75rem;
    }
    .action-btn-group {
      display: inline-flex;
      gap: 0.4rem;
    }
    .text-danger { color: var(--danger); }
    .text-danger:hover { background-color: var(--danger-light); }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem !important;
    }
    .empty-icon {
      font-size: 3rem;
      color: var(--text-subtle);
      margin-bottom: 0.5rem;
    }
    .empty-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .empty-desc {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }
    .mt-3 { margin-top: 0.75rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-4 { margin-top: 1rem; }

    /* Pagination */
    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 0;
    }
    .pagination-info { font-size: 0.8125rem; color: var(--text-muted); }
    .pagination-controls { display: flex; gap: 0.5rem; }

    /* Modals */
    .modal-lg { max-width: 720px; }
    .modal-sm { max-width: 440px; }
    .form-row { display: flex; gap: 1rem; }
    .flex-1 { flex: 1; }
    .btn-close {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-muted);
      padding: 0.25rem;
    }
    .detail-header-info { display: flex; align-items: center; gap: 0.75rem; }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .detail-item { display: flex; flex-direction: column; gap: 0.2rem; }
    .detail-label { font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.05em; }
    .detail-value { font-size: 0.9375rem; font-weight: 600; color: var(--text-main); }
    .detail-notes-box {
      background: var(--surface-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.875rem 1rem;
      margin-bottom: 1rem;
    }
    .notes-text { font-size: 0.875rem; color: var(--text-body); margin-top: 0.35rem; }
    .section-heading { font-size: 0.9375rem; font-weight: 700; color: var(--text-main); }
  `]
})
export class CustomersComponent implements OnInit {
  private customerService = inject(CustomerService);
  private notify = inject(NotificationService);
  private fb = inject(FormBuilder);

  customers = signal<Customer[]>([]);
  totalCount = signal<number>(0);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);

  searchQuery = '';
  statusFilter = '';

  showFormModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  editingId: string | null = null;

  selectedCustomer = signal<Customer | null>(null);
  customerDetails = signal<any>(null);
  customerToDelete = signal<Customer | null>(null);

  customerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: [''],
    phone: [''],
    company: [''],
    address: [''],
    notes: [''],
    status: ['active']
  });

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.customerService.getCustomers({
      page: this.currentPage(),
      limit: 10,
      search: this.searchQuery,
      status: this.statusFilter
    }).subscribe(res => {
      if (res.success && res.data) {
        this.customers.set(res.data);
        if (res.meta) {
          this.totalCount.set(res.meta.total || 0);
          this.totalPages.set(res.meta.totalPages || 1);
        }
      }
    });
  }

  onSearchChange() {
    this.currentPage.set(1);
    this.loadCustomers();
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.loadCustomers();
  }

  openCreateModal() {
    this.isEditing.set(false);
    this.editingId = null;
    this.customerForm.reset({ status: 'active' });
    this.showFormModal.set(true);
  }

  openEditModal(cust: Customer) {
    this.isEditing.set(true);
    this.editingId = cust.id;
    this.customerForm.patchValue({
      name: cust.name,
      email: cust.email || '',
      phone: cust.phone || '',
      company: cust.company || '',
      address: cust.address || '',
      notes: cust.notes || '',
      status: cust.status
    });
    this.showFormModal.set(true);
  }

  closeFormModal() {
    this.showFormModal.set(false);
  }

  saveCustomer() {
    if (this.customerForm.invalid) return;

    this.isSubmitting.set(true);
    const formVal = this.customerForm.value as Partial<Customer>;

    if (this.isEditing() && this.editingId) {
      this.customerService.updateCustomer(this.editingId, formVal).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          if (res.success) {
            this.notify.success('Customer updated successfully');
            this.closeFormModal();
            this.loadCustomers();
          } else {
            this.notify.error(res.error || 'Failed to update customer');
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.notify.error(err.error?.error || 'Update failed');
        }
      });
    } else {
      this.customerService.createCustomer(formVal).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          if (res.success) {
            this.notify.success('Customer created successfully');
            this.closeFormModal();
            this.loadCustomers();
          } else {
            this.notify.error(res.error || 'Failed to create customer');
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.notify.error(err.error?.error || 'Creation failed');
        }
      });
    }
  }

  viewCustomer(cust: Customer) {
    this.selectedCustomer.set(cust);
    this.customerService.getCustomer(cust.id).subscribe(res => {
      if (res.success) {
        this.customerDetails.set(res.data);
      }
    });
  }

  confirmDelete(cust: Customer) {
    this.customerToDelete.set(cust);
  }

  executeDelete() {
    const cust = this.customerToDelete();
    if (!cust) return;

    this.customerService.deleteCustomer(cust.id).subscribe({
      next: (res) => {
        this.customerToDelete.set(null);
        if (res.success) {
          this.notify.success('Customer deleted');
          this.loadCustomers();
        } else {
          this.notify.error(res.error || 'Could not delete customer');
        }
      },
      error: (err) => {
        this.customerToDelete.set(null);
        this.notify.error(err.error?.error || 'Failed to delete customer');
      }
    });
  }
}
