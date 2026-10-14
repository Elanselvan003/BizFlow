import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Invoice, Payment } from '../models';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private api = inject(ApiService);

  getInvoices(params?: { page?: number; limit?: number; status?: string; customerId?: string; search?: string }) {
    return this.api.get<Invoice[]>('/invoices', params);
  }

  getInvoice(id: string) {
    return this.api.get<Invoice>(`/invoices/${id}`);
  }

  createInvoice(data: any) {
    return this.api.post<Invoice>('/invoices', data);
  }

  updateInvoice(id: string, data: Partial<Invoice>) {
    return this.api.put<Invoice>(`/invoices/${id}`, data);
  }

  recordPayment(invoiceId: string, data: { amount_cents: number; payment_method: string; payment_date?: string; notes?: string }) {
    return this.api.post<{ invoice: Invoice; payment: Payment }>(`/invoices/${invoiceId}/payments`, data);
  }

  deleteInvoice(id: string) {
    return this.api.delete<{ message: string }>(`/invoices/${id}`);
  }
}
