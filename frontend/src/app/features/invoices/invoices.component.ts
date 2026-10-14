import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { InvoiceService } from '../../core/services/invoice.service';
import { CustomerService } from '../../core/services/customer.service';
import { ServicesService } from '../../core/services/services.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { Invoice, Customer, Service } from '../../core/models';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MoneyPipe],
  template: `
    <div class="invoices-page">
      <div class="page-header">
        <div>
          <h1 class="header-title">Invoices & Billing</h1>
          <p class="header-subtitle">Generate client statements, record payments, and track outstanding receivables</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span class="material-symbols-outlined">add_chart</span>
          <span>Create New Invoice</span>
        </button>
      </div>

      <!-- Filters Toolbar -->
      <div class="bf-card filter-card">
        <div class="status-tabs">
          <button class="tab-btn" [class.tab-active]="statusFilter === ''" (click)="setStatusFilter('')">
            All ({{ totalInvoicesCount() }})
          </button>
          <button class="tab-btn" [class.tab-active]="statusFilter === 'pending'" (click)="setStatusFilter('pending')">
            Pending
          </button>
          <button class="tab-btn" [class.tab-active]="statusFilter === 'paid'" (click)="setStatusFilter('paid')">
            Paid
          </button>
          <button class="tab-btn" [class.tab-active]="statusFilter === 'overdue'" (click)="setStatusFilter('overdue')">
            Overdue
          </button>
          <button class="tab-btn" [class.tab-active]="statusFilter === 'draft'" (click)="setStatusFilter('draft')">
            Draft
          </button>
        </div>

        <div class="search-box">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            class="search-input"
            placeholder="Search invoice # or client..."
            [(ngModel)]="searchQuery"
            (ngModelChange)="loadInvoices()"
          />
        </div>
      </div>

      <!-- Invoices Table -->
      <div class="bf-table-container">
        <table class="bf-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Total Amount</th>
              <th>Paid</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (inv of invoices(); track inv.id) {
              <tr>
                <td>
                  <span class="inv-number">{{ inv.invoice_number }}</span>
                </td>
                <td>
                  <div class="cell-main">{{ inv.customer_name }}</div>
                  <div class="cell-sub">{{ inv.customer_company || '' }}</div>
                </td>
                <td>{{ inv.issue_date }}</td>
                <td>
                  <span [class.text-danger]="isOverdue(inv)">{{ inv.due_date }}</span>
                </td>
                <td>
                  <span class="cell-main font-semibold">{{ inv.total_cents | money }}</span>
                </td>
                <td>
                  <span class="cell-main text-emerald">{{ inv.paid_cents | money }}</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="getStatusBadgeClass(inv.status)">
                    <span class="badge-dot"></span>
                    <span>{{ inv.status }}</span>
                  </span>
                </td>
                <td style="text-align: right;">
                  <div class="action-btn-group">
                    <button class="btn btn-secondary btn-sm btn-icon" (click)="viewInvoice(inv)" title="View & Print Invoice">
                      <span class="material-symbols-outlined">receipt</span>
                    </button>
                    @if (inv.status !== 'paid' && inv.status !== 'cancelled') {
                      <button class="btn btn-secondary btn-sm btn-icon text-success" (click)="openPaymentModal(inv)" title="Record Payment">
                        <span class="material-symbols-outlined">payments</span>
                      </button>
                    }
                    @if (inv.paid_cents === 0) {
                      <button class="btn btn-secondary btn-sm btn-icon text-danger" (click)="confirmDelete(inv)" title="Delete Invoice">
                        <span class="material-symbols-outlined">delete</span>
                      </button>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="empty-state">
                  <span class="material-symbols-outlined empty-icon">receipt_long</span>
                  <div class="empty-title">No invoices found</div>
                  <div class="empty-desc">Create your first client invoice or adjust your filters</div>
                  <button class="btn btn-primary btn-sm mt-3" (click)="openCreateModal()">Create Invoice</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Create Invoice Modal -->
      @if (showCreateModal()) {
        <div class="modal-overlay">
          <div class="modal-dialog modal-xl">
            <div class="modal-header">
              <h3 class="bf-card-title">Create Client Invoice</h3>
              <button class="btn-close" (click)="closeCreateModal()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <form [formGroup]="invoiceForm" (ngSubmit)="saveInvoice()">
              <div class="modal-body">
                <div class="form-row">
                  <div class="form-group flex-2">
                    <label class="form-label">Client *</label>
                    <select formControlName="customer_id" class="form-select">
                      <option value="" disabled>Select customer...</option>
                      @for (cust of availableCustomers(); track cust.id) {
                        <option [value]="cust.id">{{ cust.name }} {{ cust.company ? '— ' + cust.company : '' }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group flex-1">
                    <label class="form-label">Issue Date *</label>
                    <input type="date" formControlName="issue_date" class="form-input" />
                  </div>
                  <div class="form-group flex-1">
                    <label class="form-label">Due Date *</label>
                    <input type="date" formControlName="due_date" class="form-input" />
                  </div>
                </div>

                <!-- Line Items Section -->
                <div class="items-section">
                  <div class="items-header">
                    <span class="items-title">Line Items</span>
                    <button type="button" class="btn btn-secondary btn-sm" (click)="addItem()">
                      <span class="material-symbols-outlined">add</span>
                      <span>Add Item</span>
                    </button>
                  </div>

                  <div formArrayName="items" class="items-list">
                    @for (item of itemsArray.controls; track $index; let idx = $index) {
                      <div [formGroupName]="idx" class="item-row">
                        <div class="item-desc flex-3">
                          <input type="text" formControlName="description" class="form-input" placeholder="Service description or deliverable..." />
                        </div>
                        <div class="item-qty flex-1">
                          <input type="number" min="1" step="1" formControlName="quantity" class="form-input" placeholder="Qty" />
                        </div>
                        <div class="item-price flex-1">
                          <input type="number" min="0" step="0.01" formControlName="priceDollars" class="form-input" placeholder="Unit Price" />
                        </div>
                        <div class="item-total">
                          {{ getItemTotal(idx) | money }}
                        </div>
                        <button type="button" class="btn-item-remove" (click)="removeItem(idx)" [disabled]="itemsArray.length <= 1">
                          <span class="material-symbols-outlined">remove_circle_outline</span>
                        </button>
                      </div>
                    }
                  </div>
                </div>

                <!-- Summary Row -->
                <div class="calc-summary-row">
                  <div class="calc-left">
                    <div class="form-group">
                      <label class="form-label">Invoice Notes & Payment Instructions</label>
                      <textarea formControlName="notes" class="form-textarea" rows="3" placeholder="Thank you for your business. Payment due via wire transfer or online checkout."></textarea>
                    </div>
                  </div>

                  <div class="calc-right">
                    <div class="calc-item">
                      <span>Subtotal:</span>
                      <b>{{ calcSubtotal() | money }}</b>
                    </div>

                    <div class="calc-item">
                      <span>Discount ({{ auth.businessSettings()?.currency_symbol || '₹' }}):</span>
                      <input type="number" step="0.01" min="0" formControlName="discountDollars" class="form-input discount-input" />
                    </div>

                    <div class="calc-item">
                      <span>Tax Rate (%):</span>
                      <input type="number" step="0.1" min="0" formControlName="tax_rate" class="form-input tax-input" />
                    </div>

                    <div class="calc-item">
                      <span>Tax Amount:</span>
                      <b>{{ calcTax() | money }}</b>
                    </div>

                    <div class="calc-item calc-total">
                      <span>Total Amount:</span>
                      <b>{{ calcTotal() | money }}</b>
                    </div>
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="invoiceForm.invalid || isSubmitting()">
                  {{ isSubmitting() ? 'Creating Invoice...' : 'Generate Invoice' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Invoice View & Print Modal -->
      @if (viewingInvoice()) {
        <div class="modal-overlay">
          <div class="modal-dialog modal-xl printable-dialog">
            <div class="modal-header no-print">
              <h3 class="bf-card-title">Invoice #{{ viewingInvoice()?.invoice_number }}</h3>
              <div class="modal-header-actions">
                <button class="btn btn-secondary btn-sm" (click)="printInvoice()">
                  <span class="material-symbols-outlined">print</span>
                  <span>Print / PDF</span>
                </button>
                <button class="btn-close" (click)="viewingInvoice.set(null)">
                  <span class="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div class="modal-body invoice-sheet">
              <!-- Invoice Print Header -->
              <div class="inv-sheet-header">
                <div class="inv-biz-info">
                  <div class="inv-brand-name">{{ viewingInvoice()?.business?.business_name || auth.businessSettings()?.business_name || 'BizFlow Solutions' }}</div>
                  <div class="inv-biz-line">{{ viewingInvoice()?.business?.address || auth.businessSettings()?.address || '100 Innovation Way, Suite 400' }}</div>
                  <div class="inv-biz-line">{{ viewingInvoice()?.business?.email || auth.businessSettings()?.email || 'billing@bizflow.app' }}</div>
                  <div class="inv-biz-line">{{ viewingInvoice()?.business?.phone || auth.businessSettings()?.phone || '+1 (555) 349-2810' }}</div>
                </div>

                <div class="inv-meta-right">
                  <div class="inv-title-large">INVOICE</div>
                  <div class="inv-meta-row">
                    <span class="inv-meta-lbl">Invoice #:</span>
                    <span class="inv-meta-val font-mono">{{ viewingInvoice()?.invoice_number }}</span>
                  </div>
                  <div class="inv-meta-row">
                    <span class="inv-meta-lbl">Issue Date:</span>
                    <span class="inv-meta-val">{{ viewingInvoice()?.issue_date }}</span>
                  </div>
                  <div class="inv-meta-row">
                    <span class="inv-meta-lbl">Due Date:</span>
                    <span class="inv-meta-val">{{ viewingInvoice()?.due_date }}</span>
                  </div>
                  <div class="inv-meta-row">
                    <span class="inv-meta-lbl">Status:</span>
                    <span class="badge" [ngClass]="getStatusBadgeClass(viewingInvoice()!.status)">
                      {{ viewingInvoice()?.status }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Bill To Block -->
              <div class="inv-bill-to">
                <div class="bill-to-label">Billed To</div>
                <div class="bill-to-name">{{ viewingInvoice()?.customer_name }}</div>
                @if (viewingInvoice()?.customer_company) {
                  <div class="bill-to-comp">{{ viewingInvoice()?.customer_company }}</div>
                }
                @if (viewingInvoice()?.customer_address) {
                  <div class="bill-to-addr">{{ viewingInvoice()?.customer_address }}</div>
                }
                @if (viewingInvoice()?.customer_email) {
                  <div class="bill-to-email">{{ viewingInvoice()?.customer_email }}</div>
                }
              </div>

              <!-- Line Items Table -->
              <table class="inv-items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of viewingInvoice()?.items || []; track item.id || item.description) {
                    <tr>
                      <td>{{ item.description }}</td>
                      <td style="text-align: center;">{{ item.quantity }}</td>
                      <td style="text-align: right;">{{ item.unit_price_cents | money }}</td>
                      <td style="text-align: right; font-weight: 600;">{{ item.total_cents | money }}</td>
                    </tr>
                  }
                </tbody>
              </table>

              <!-- Invoice Totals Footer -->
              <div class="inv-footer-block">
                <div class="inv-notes">
                  <div class="bill-to-label">Notes & Instructions</div>
                  <p>{{ viewingInvoice()?.notes || 'Thank you for your business!' }}</p>

                  @if ((viewingInvoice()?.payments || []).length > 0) {
                    <div class="mt-3">
                      <div class="bill-to-label">Recorded Payments</div>
                      @for (p of viewingInvoice()?.payments || []; track p.id) {
                        <div class="payment-receipt-line">
                          <span>{{ p.payment_date }} ({{ p.payment_method }}): <b>{{ p.amount_cents | money }}</b></span>
                        </div>
                      }
                    </div>
                  }
                </div>

                <div class="inv-totals-box">
                  <div class="tot-row">
                    <span>Subtotal:</span>
                    <span>{{ viewingInvoice()?.subtotal_cents | money }}</span>
                  </div>
                  @if ((viewingInvoice()?.discount_cents || 0) > 0) {
                    <div class="tot-row text-danger">
                      <span>Discount:</span>
                      <span>-{{ viewingInvoice()?.discount_cents | money }}</span>
                    </div>
                  }
                  <div class="tot-row">
                    <span>Tax ({{ viewingInvoice()?.tax_rate || 0 }}%):</span>
                    <span>{{ viewingInvoice()?.tax_cents | money }}</span>
                  </div>
                  <div class="tot-row tot-total">
                    <span>Total Amount:</span>
                    <span>{{ viewingInvoice()?.total_cents | money }}</span>
                  </div>
                  <div class="tot-row tot-paid text-emerald">
                    <span>Amount Paid:</span>
                    <span>{{ viewingInvoice()?.paid_cents | money }}</span>
                  </div>
                  <div class="tot-row tot-balance">
                    <span>Balance Due:</span>
                    <span>{{ ((viewingInvoice()?.total_cents || 0) - (viewingInvoice()?.paid_cents || 0)) | money }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer no-print">
              <button class="btn btn-secondary" (click)="viewingInvoice.set(null)">Close</button>
              <button class="btn btn-primary" (click)="printInvoice()">
                <span class="material-symbols-outlined">print</span>
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Record Payment Modal -->
      @if (invoiceToPay()) {
        <div class="modal-overlay">
          <div class="modal-dialog modal-sm">
            <div class="modal-header">
              <h3 class="bf-card-title">Record Payment</h3>
              <button class="btn-close" (click)="invoiceToPay.set(null)">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="modal-body">
              <div class="pay-target-info">
                <span class="pay-target-num">Invoice #{{ invoiceToPay()?.invoice_number }}</span>
                <div class="pay-target-due">
                  Balance Due: <b>{{ ((invoiceToPay()?.total_cents || 0) - (invoiceToPay()?.paid_cents || 0)) | money }}</b>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Payment Amount ({{ auth.businessSettings()?.currency_symbol || '₹' }}) *</label>
                <input type="number" step="0.01" min="0.01" class="form-input" [(ngModel)]="paymentAmountDollars" />
              </div>

              <div class="form-group">
                <label class="form-label">Payment Method *</label>
                <select class="form-select" [(ngModel)]="paymentMethod">
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Wire / Transfer</option>
                  <option value="stripe">Stripe Online</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Payment Date</label>
                <input type="date" class="form-input" [(ngModel)]="paymentDate" />
              </div>

              <div class="form-group">
                <label class="form-label">Reference / Transaction Notes</label>
                <input type="text" class="form-input" placeholder="e.g. Wire confirmation #WT-9921" [(ngModel)]="paymentNotes" />
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="invoiceToPay.set(null)">Cancel</button>
              <button class="btn btn-primary" (click)="submitPayment()" [disabled]="isSubmittingPayment()">
                {{ isSubmittingPayment() ? 'Recording...' : 'Record Payment' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Delete Confirmation -->
      @if (invoiceToDelete()) {
        <div class="modal-overlay">
          <div class="modal-dialog modal-sm">
            <div class="modal-header">
              <h3 class="bf-card-title text-danger">Delete Invoice</h3>
              <button class="btn-close" (click)="invoiceToDelete.set(null)">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to delete invoice <b>{{ invoiceToDelete()?.invoice_number }}</b>?</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="invoiceToDelete.set(null)">Cancel</button>
              <button class="btn btn-danger" (click)="executeDelete()">Confirm Delete</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .invoices-page {
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
    .tab-btn:hover { color: var(--text-main); }
    .tab-active { background: #ffffff; color: var(--primary); box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--surface-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.4rem 0.75rem;
      width: 280px;
    }
    .search-icon { color: var(--text-subtle); font-size: 1.2rem; }
    .search-input { border: none; background: transparent; outline: none; width: 100%; font-size: 0.875rem; }

    .inv-number { font-family: monospace; font-weight: 700; color: var(--primary); }
    .cell-main { font-weight: 600; color: var(--text-main); }
    .cell-sub { font-size: 0.75rem; color: var(--text-muted); }
    .font-semibold { font-weight: 600; }
    .text-emerald { color: #059669; }
    .text-danger { color: var(--danger); }
    .action-btn-group { display: inline-flex; gap: 0.35rem; }
    .text-success { color: var(--success); }
    .text-success:hover { background-color: var(--success-light); }

    .empty-state { text-align: center; padding: 3rem 1rem !important; }
    .empty-icon { font-size: 3rem; color: var(--text-subtle); margin-bottom: 0.5rem; }
    .empty-title { font-size: 1.125rem; font-weight: 700; color: var(--text-main); }
    .empty-desc { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; }
    .mt-3 { margin-top: 0.75rem; }

    /* Modals & Line Items */
    .modal-xl { max-width: 860px; }
    .modal-sm { max-width: 440px; }
    .form-row { display: flex; gap: 1rem; }
    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }
    .flex-3 { flex: 3; }
    .btn-close { background: none; border: none; cursor: pointer; color: var(--text-muted); }

    .items-section {
      background: var(--surface-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      margin-bottom: 1.25rem;
    }
    .items-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    .items-title { font-size: 0.875rem; font-weight: 700; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.05em; }
    .items-list { display: flex; flex-direction: column; gap: 0.625rem; }
    .item-row { display: flex; align-items: center; gap: 0.75rem; }
    .item-total { width: 100px; text-align: right; font-weight: 700; font-size: 0.875rem; color: var(--text-main); }
    .btn-item-remove {
      background: none;
      border: none;
      color: var(--danger);
      cursor: pointer;
      display: flex;
      align-items: center;
    }
    .btn-item-remove:disabled { opacity: 0.3; cursor: not-allowed; }

    .calc-summary-row { display: flex; gap: 2rem; justify-content: space-between; margin-top: 1.25rem; }
    .calc-left { flex: 1; }
    .calc-right { width: 320px; display: flex; flex-direction: column; gap: 0.5rem; }
    .calc-item { display: flex; align-items: center; justify-content: space-between; font-size: 0.875rem; }
    .discount-input, .tax-input { width: 90px; text-align: right; padding: 0.35rem 0.5rem; font-size: 0.8125rem; }
    .calc-total {
      font-size: 1.125rem;
      border-top: 2px solid var(--border-color);
      padding-top: 0.5rem;
      margin-top: 0.25rem;
      color: var(--primary);
    }

    /* Printable Sheet Styling */
    .invoice-sheet {
      padding: 2.5rem;
      background: #ffffff;
      color: #0f172a;
    }
    .inv-sheet-header { display: flex; justify-content: space-between; margin-bottom: 2rem; }
    .inv-brand-name { font-size: 1.5rem; font-weight: 800; color: var(--primary); }
    .inv-biz-line { font-size: 0.84rem; color: var(--text-muted); line-height: 1.4; }
    .inv-meta-right { text-align: right; }
    .inv-title-large { font-size: 2rem; font-weight: 900; letter-spacing: -0.04em; color: var(--text-main); }
    .inv-meta-row { display: flex; gap: 0.75rem; justify-content: flex-end; font-size: 0.84rem; margin-top: 0.2rem; }
    .inv-meta-lbl { color: var(--text-muted); }
    .inv-meta-val { font-weight: 600; }
    .inv-bill-to { margin-bottom: 2rem; border-left: 3px solid var(--primary); padding-left: 1rem; }
    .bill-to-label { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; color: var(--text-subtle); letter-spacing: 0.05em; }
    .bill-to-name { font-size: 1.125rem; font-weight: 700; color: var(--text-main); }
    .bill-to-comp { font-weight: 600; color: var(--text-body); font-size: 0.875rem; }
    .bill-to-addr, .bill-to-email { font-size: 0.8125rem; color: var(--text-muted); }

    .inv-items-table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
    .inv-items-table th { background: #f8fafc; padding: 0.75rem 1rem; text-transform: uppercase; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); border-bottom: 2px solid var(--border-color); }
    .inv-items-table td { padding: 0.875rem 1rem; border-bottom: 1px solid var(--border-color); font-size: 0.875rem; }

    .inv-footer-block { display: flex; justify-content: space-between; gap: 2rem; }
    .inv-notes { flex: 1; font-size: 0.84rem; color: var(--text-muted); }
    .inv-totals-box { width: 280px; display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.875rem; }
    .tot-row { display: flex; justify-content: space-between; }
    .tot-total { font-size: 1.125rem; font-weight: 800; border-top: 2px solid var(--border-color); padding-top: 0.5rem; color: var(--text-main); }
    .tot-balance { font-size: 1.05rem; font-weight: 800; border-top: 1px solid var(--border-color); padding-top: 0.35rem; color: var(--primary); }

    .pay-target-info {
      background: var(--surface-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.875rem;
      margin-bottom: 1.25rem;
    }
    .pay-target-num { font-family: monospace; font-weight: 700; color: var(--primary); font-size: 0.9375rem; }
    .pay-target-due { font-size: 0.875rem; margin-top: 0.25rem; }

    @media print {
      .invoices-page > *:not(.modal-overlay) { display: none !important; }
      .modal-overlay { position: static !important; background: none !important; padding: 0 !important; }
      .printable-dialog { max-width: 100% !important; box-shadow: none !important; border: none !important; }
    }
  `]
})
export class InvoicesComponent implements OnInit {
  private invoiceService = inject(InvoiceService);
  private customerService = inject(CustomerService);
  private servicesService = inject(ServicesService);
  private notify = inject(NotificationService);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  invoices = signal<Invoice[]>([]);
  totalInvoicesCount = signal<number>(0);
  availableCustomers = signal<Customer[]>([]);
  availableServices = signal<Service[]>([]);

  statusFilter = '';
  searchQuery = '';

  showCreateModal = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  viewingInvoice = signal<Invoice | null>(null);
  invoiceToDelete = signal<Invoice | null>(null);

  // Payment modal state
  invoiceToPay = signal<Invoice | null>(null);
  paymentAmountDollars = 0;
  paymentMethod = 'credit_card';
  paymentDate = '';
  paymentNotes = '';
  isSubmittingPayment = signal<boolean>(false);

  invoiceForm = this.fb.group({
    customer_id: ['', [Validators.required]],
    issue_date: [new Date().toISOString().split('T')[0], [Validators.required]],
    due_date: [new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], [Validators.required]],
    discountDollars: [0, [Validators.min(0)]],
    tax_rate: [8.5, [Validators.min(0)]],
    notes: [''],
    items: this.fb.array([])
  });

  get itemsArray() {
    return this.invoiceForm.get('items') as FormArray;
  }

  ngOnInit() {
    this.loadInvoices();
    this.loadDropdownData();
  }

  loadInvoices() {
    this.invoiceService.getInvoices({
      status: this.statusFilter,
      search: this.searchQuery
    }).subscribe(res => {
      if (res.success && res.data) {
        this.invoices.set(res.data);
        if (!this.statusFilter && !this.searchQuery) {
          this.totalInvoicesCount.set(res.meta?.total || res.data.length);
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
    this.loadInvoices();
  }

  openCreateModal() {
    this.invoiceForm.reset({
      customer_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      discountDollars: 0,
      tax_rate: this.auth.businessSettings()?.tax_rate || 8.5,
      notes: ''
    });
    this.itemsArray.clear();
    this.addItem(); // Start with 1 item
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  addItem() {
    this.itemsArray.push(this.fb.group({
      description: ['', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      priceDollars: [150.00, [Validators.required, Validators.min(0)]]
    }));
  }

  removeItem(index: number) {
    if (this.itemsArray.length > 1) {
      this.itemsArray.removeAt(index);
    }
  }

  getItemTotal(index: number): number {
    const item = this.itemsArray.at(index).value;
    const qty = Number(item.quantity) || 0;
    const price = Number(item.priceDollars) || 0;
    return Math.round(qty * price * 100);
  }

  calcSubtotal(): number {
    let subtotalCents = 0;
    for (let i = 0; i < this.itemsArray.length; i++) {
      subtotalCents += this.getItemTotal(i);
    }
    return subtotalCents;
  }

  calcTax(): number {
    const subtotal = this.calcSubtotal();
    const discount = Math.round((Number(this.invoiceForm.get('discountDollars')?.value) || 0) * 100);
    const taxable = Math.max(0, subtotal - discount);
    const rate = Number(this.invoiceForm.get('tax_rate')?.value) || 0;
    return Math.round(taxable * (rate / 100));
  }

  calcTotal(): number {
    const subtotal = this.calcSubtotal();
    const discount = Math.round((Number(this.invoiceForm.get('discountDollars')?.value) || 0) * 100);
    const taxable = Math.max(0, subtotal - discount);
    return taxable + this.calcTax();
  }

  saveInvoice() {
    if (this.invoiceForm.invalid) return;

    this.isSubmitting.set(true);
    const val = this.invoiceForm.value;

    const items = this.itemsArray.controls.map(ctrl => {
      const v = ctrl.value;
      const unit_price_cents = Math.round((Number(v.priceDollars) || 0) * 100);
      return {
        description: v.description!.trim(),
        quantity: Number(v.quantity) || 1,
        unit_price_cents
      };
    });

    const discount_cents = Math.round((Number(val.discountDollars) || 0) * 100);
    const tax_rate = Number(val.tax_rate) || 0;

    const payload = {
      customer_id: val.customer_id!,
      issue_date: val.issue_date!,
      due_date: val.due_date!,
      discount_cents,
      tax_rate,
      notes: val.notes || null,
      items
    };

    this.invoiceService.createInvoice(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success) {
          this.notify.success('Invoice generated successfully');
          this.closeCreateModal();
          this.loadInvoices();
        } else {
          this.notify.error(res.error || 'Failed to create invoice');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.notify.error(err.error?.error || 'Creation failed');
      }
    });
  }

  viewInvoice(inv: Invoice) {
    this.invoiceService.getInvoice(inv.id).subscribe(res => {
      if (res.success && res.data) {
        this.viewingInvoice.set(res.data);
      }
    });
  }

  printInvoice() {
    window.print();
  }

  openPaymentModal(inv: Invoice) {
    this.invoiceToPay.set(inv);
    const dueCents = inv.total_cents - inv.paid_cents;
    this.paymentAmountDollars = dueCents / 100;
    this.paymentMethod = 'credit_card';
    this.paymentDate = new Date().toISOString().split('T')[0];
    this.paymentNotes = '';
  }

  submitPayment() {
    const inv = this.invoiceToPay();
    if (!inv || this.paymentAmountDollars <= 0) return;

    this.isSubmittingPayment.set(true);
    const amount_cents = Math.round(this.paymentAmountDollars * 100);

    this.invoiceService.recordPayment(inv.id, {
      amount_cents,
      payment_method: this.paymentMethod,
      payment_date: this.paymentDate,
      notes: this.paymentNotes
    }).subscribe({
      next: (res) => {
        this.isSubmittingPayment.set(false);
        this.invoiceToPay.set(null);
        if (res.success) {
          this.notify.success('Payment recorded successfully');
          this.loadInvoices();
        } else {
          this.notify.error(res.error || 'Failed to record payment');
        }
      },
      error: (err) => {
        this.isSubmittingPayment.set(false);
        this.notify.error(err.error?.error || 'Payment recording failed');
      }
    });
  }

  confirmDelete(inv: Invoice) {
    this.invoiceToDelete.set(inv);
  }

  executeDelete() {
    const inv = this.invoiceToDelete();
    if (!inv) return;

    this.invoiceService.deleteInvoice(inv.id).subscribe({
      next: (res) => {
        this.invoiceToDelete.set(null);
        if (res.success) {
          this.notify.success('Invoice deleted');
          this.loadInvoices();
        } else {
          this.notify.error(res.error || 'Could not delete invoice');
        }
      },
      error: (err) => {
        this.invoiceToDelete.set(null);
        this.notify.error(err.error?.error || 'Failed to delete');
      }
    });
  }

  isOverdue(inv: Invoice): boolean {
    if (inv.status === 'paid' || inv.status === 'cancelled') return false;
    const due = new Date(inv.due_date);
    const today = new Date();
    today.setHours(0,0,0,0);
    return due < today;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'paid': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'overdue': return 'badge-danger';
      case 'draft': return 'badge-neutral';
      default: return 'badge-neutral';
    }
  }
}
