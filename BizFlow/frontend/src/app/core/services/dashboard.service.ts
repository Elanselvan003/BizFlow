import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { DashboardStats, RevenueAnalytics, RecentActivity } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private api = inject(ApiService);

  getStats() {
    return this.api.get<DashboardStats>('/dashboard/stats');
  }

  getRevenueAnalytics() {
    return this.api.get<RevenueAnalytics>('/dashboard/revenue');
  }

  getRecentActivity() {
    return this.api.get<RecentActivity>('/dashboard/recent-activity');
  }
}
