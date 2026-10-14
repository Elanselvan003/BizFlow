import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { RevenueReport, BookingsReport, CustomersReport } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private api = inject(ApiService);

  getRevenueReport(period: string = '30d') {
    return this.api.get<RevenueReport>('/reports/revenue', { period });
  }

  getBookingsReport(period: string = '30d') {
    return this.api.get<BookingsReport>('/reports/bookings', { period });
  }

  getCustomersReport() {
    return this.api.get<CustomersReport>('/reports/customers');
  }
}
