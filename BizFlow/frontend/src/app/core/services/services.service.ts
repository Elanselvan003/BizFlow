import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Service } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {
  private api = inject(ApiService);

  getServices(params?: { active?: boolean }) {
    return this.api.get<Service[]>('/services', params);
  }

  getService(id: string) {
    return this.api.get<Service>(`/services/${id}`);
  }

  createService(data: Partial<Service>) {
    return this.api.post<Service>('/services', data);
  }

  updateService(id: string, data: Partial<Service>) {
    return this.api.put<Service>(`/services/${id}`, data);
  }

  deleteService(id: string) {
    return this.api.delete<{ message: string }>(`/services/${id}`);
  }
}
