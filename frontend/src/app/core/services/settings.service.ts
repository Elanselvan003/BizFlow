import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { BusinessSettings, User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private api = inject(ApiService);

  getSettings() {
    return this.api.get<BusinessSettings>('/settings');
  }

  updateSettings(data: Partial<BusinessSettings>) {
    return this.api.put<BusinessSettings>('/settings', data);
  }

  updateProfile(data: { full_name?: string; email?: string; current_password?: string; new_password?: string }) {
    return this.api.put<User>('/settings/profile', data);
  }
}
