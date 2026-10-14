import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Booking } from '../models';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private api = inject(ApiService);

  getBookings(params?: { page?: number; limit?: number; status?: string; customerId?: string; date?: string }) {
    return this.api.get<Booking[]>('/bookings', params);
  }

  getBooking(id: string) {
    return this.api.get<Booking>(`/bookings/${id}`);
  }

  createBooking(data: Partial<Booking>) {
    return this.api.post<Booking>('/bookings', data);
  }

  updateBooking(id: string, data: Partial<Booking>) {
    return this.api.put<Booking>(`/bookings/${id}`, data);
  }

  deleteBooking(id: string) {
    return this.api.delete<{ message: string }>(`/bookings/${id}`);
  }
}
