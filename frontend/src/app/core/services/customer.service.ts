import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Customer } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private api = inject(ApiService);

  getCustomers(params?: { page?: number; limit?: number; search?: string; status?: string }) {
    return this.api.get<Customer[]>('/customers', params);
  }

  getCustomer(id: string) {
    return this.api.get<Customer & { bookings: any[]; invoices: any[] }>(`/customers/${id}`);
  }

  createCustomer(data: Partial<Customer>) {
    return this.api.post<Customer>('/customers', data);
  }

  updateCustomer(id: string, data: Partial<Customer>) {
    return this.api.put<Customer>(`/customers/${id}`, data);
  }

  deleteCustomer(id: string) {
    return this.api.delete<{ message: string }>(`/customers/${id}`);
  }
}
