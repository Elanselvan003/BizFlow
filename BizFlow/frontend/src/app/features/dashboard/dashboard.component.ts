import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as echarts from 'echarts';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats, RevenueAnalytics, RecentActivity } from '../../core/models';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MoneyPipe],
  template: `
    <div class="dashboard-page">
      <!-- Welcome Header -->
      <div class="page-header">
        <div>
          <h1 class="header-title">Executive Dashboard</h1>
          <p class="header-subtitle">Real-time overview of business performance, appointments, and cash flow</p>
        </div>
        <div class="header-actions">
          <a routerLink="/bookings" class="btn btn-secondary btn-sm">
            <span class="material-symbols-outlined">calendar_add_on</span>
            <span>Schedule Booking</span>
          </a>
          <a routerLink="/invoices" class="btn btn-primary btn-sm">
            <span class="material-symbols-outlined">post_add</span>
            <span>New Invoice</span>
          </a>
        </div>
      </div>

      <!-- 4 Core KPI Stat Cards -->
      <div class="stats-grid">
        <div class="bf-card stat-card">
          <div class="stat-content">
            <span class="stat-label">Total Customers</span>
            <div class="stat-value">{{ stats()?.total_customers || 0 }}</div>
            <div class="stat-trend trend-up">
              <span class="material-symbols-outlined">trending_up</span>
              <span>Active client portfolio</span>
            </div>
          </div>
          <div class="stat-icon-box icon-indigo">
            <span class="material-symbols-outlined">groups</span>
          </div>
        </div>

        <div class="bf-card stat-card">
          <div class="stat-content">
            <span class="stat-label">Total Bookings</span>
            <div class="stat-value">{{ stats()?.total_bookings || 0 }}</div>
            <div class="stat-trend trend-neutral">
              <span class="material-symbols-outlined">schedule</span>
              <span>{{ stats()?.booking_status_counts?.confirmed || 0 }} upcoming</span>
            </div>
          </div>
          <div class="stat-icon-box icon-sky">
            <span class="material-symbols-outlined">event_available</span>
          </div>
        </div>

        <div class="bf-card stat-card">
          <div class="stat-content">
            <span class="stat-label">Revenue Collected</span>
            <div class="stat-value">{{ stats()?.total_revenue_cents | money }}</div>
            <div class="stat-trend trend-up">
              <span class="material-symbols-outlined">check_circle</span>
              <span>Paid in full</span>
            </div>
          </div>
          <div class="stat-icon-box icon-emerald">
            <span class="material-symbols-outlined">payments</span>
          </div>
        </div>

        <div class="bf-card stat-card">
          <div class="stat-content">
            <span class="stat-label">Pending Invoices</span>
            <div class="stat-value">{{ stats()?.pending_invoices_amount_cents | money }}</div>
            <div class="stat-trend trend-warn">
              <span class="material-symbols-outlined">receipt_long</span>
              <span>{{ stats()?.pending_invoices_count || 0 }} unpaid invoices</span>
            </div>
          </div>
          <div class="stat-icon-box icon-amber">
            <span class="material-symbols-outlined">pending_actions</span>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="charts-grid">
        <!-- Revenue Chart -->
        <div class="bf-card chart-card">
          <div class="bf-card-header">
            <div>
              <h3 class="bf-card-title">Revenue Trajectory</h3>
              <p class="chart-subtitle">Monthly cash collections vs invoiced totals</p>
            </div>
            <span class="badge badge-success">Live D1 SQL</span>
          </div>
          <div #revenueChart class="chart-canvas"></div>
        </div>

        <!-- Booking Status Donut Chart -->
        <div class="bf-card chart-card">
          <div class="bf-card-header">
            <div>
              <h3 class="bf-card-title">Appointment Status</h3>
              <p class="chart-subtitle">Distribution by lifecycle stage</p>
            </div>
          </div>
          <div #bookingStatusChart class="chart-canvas"></div>
        </div>
      </div>

      <!-- Recent Tables Row -->
      <div class="tables-grid">
        <!-- Recent Bookings -->
        <div class="bf-card">
          <div class="bf-card-header">
            <h3 class="bf-card-title">Recent Appointments</h3>
            <a routerLink="/bookings" class="card-link">View all</a>
          </div>

          <div class="bf-table-container">
            <table class="bf-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Service</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (booking of activity()?.bookings || []; track booking.id) {
                  <tr>
                    <td>
                      <div class="cell-main">{{ booking.customer_name }}</div>
                    </td>
                    <td>{{ booking.service_name }}</td>
                    <td>
                      <div class="cell-main">{{ booking.booking_date }}</div>
                      <div class="cell-sub">{{ booking.start_time }}</div>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="getBookingBadgeClass(booking.status)">
                        <span class="badge-dot"></span>
                        <span>{{ booking.status }}</span>
                      </span>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="empty-cell">No bookings found</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Invoices -->
        <div class="bf-card">
          <div class="bf-card-header">
            <h3 class="bf-card-title">Recent Billing Activity</h3>
            <a routerLink="/invoices" class="card-link">View all</a>
          </div>

          <div class="bf-table-container">
            <table class="bf-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (inv of activity()?.invoices || []; track inv.id) {
                  <tr>
                    <td>
                      <span class="inv-number">{{ inv.invoice_number }}</span>
                    </td>
                    <td>{{ inv.customer_name }}</td>
                    <td>
                      <div class="cell-main font-semibold">{{ inv.total_cents | money }}</div>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="getInvoiceBadgeClass(inv.status)">
                        <span class="badge-dot"></span>
                        <span>{{ inv.status }}</span>
                      </span>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="empty-cell">No recent invoices found</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
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
      letter-spacing: -0.03em;
    }
    .header-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
    }
    .stat-card {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 1.5rem;
    }
    .stat-label {
      font-size: 0.8125rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
    .stat-value {
      font-family: var(--font-heading);
      font-size: 1.875rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0.4rem 0 0.5rem;
      letter-spacing: -0.03em;
    }
    .stat-trend {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .stat-trend .material-symbols-outlined {
      font-size: 1rem;
    }
    .trend-up { color: var(--success); }
    .trend-warn { color: var(--warning); }
    .trend-neutral { color: var(--text-muted); }

    .stat-icon-box {
      width: 3rem;
      height: 3rem;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon-box .material-symbols-outlined {
      font-size: 1.6rem;
    }
    .icon-indigo { background: #eef2ff; color: #4f46e5; }
    .icon-sky { background: #f0f9ff; color: #0ea5e9; }
    .icon-emerald { background: #ecfdf5; color: #10b981; }
    .icon-amber { background: #fffbeb; color: #f59e0b; }

    /* Charts Grid */
    .charts-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
    }
    .chart-subtitle {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
    }
    .chart-canvas {
      width: 100%;
      height: 300px;
    }

    /* Tables Grid */
    .tables-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
      gap: 1.5rem;
    }
    .card-link {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--primary);
    }
    .cell-main {
      font-weight: 600;
      color: var(--text-main);
    }
    .cell-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .font-semibold {
      font-weight: 600;
    }
    .inv-number {
      font-family: monospace;
      font-weight: 700;
      color: var(--primary);
    }
    .empty-cell {
      text-align: center;
      padding: 2rem !important;
      color: var(--text-muted);
    }

    @media (max-width: 1024px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
      .tables-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  auth = inject(AuthService);

  @ViewChild('revenueChart') revenueChartRef!: ElementRef;
  @ViewChild('bookingStatusChart') bookingStatusChartRef!: ElementRef;

  private revChartInstance?: echarts.ECharts;
  private statusChartInstance?: echarts.ECharts;
  private resizeHandler = () => this.resizeCharts();

  stats = signal<DashboardStats | null>(null);
  activity = signal<RecentActivity | null>(null);
  revenueAnalytics = signal<RevenueAnalytics | null>(null);

  ngOnInit() {
    this.loadDashboardData();
  }

  ngAfterViewInit() {
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeHandler);
    this.revChartInstance?.dispose();
    this.statusChartInstance?.dispose();
  }

  loadDashboardData() {
    this.dashboardService.getStats().subscribe(res => {
      if (res.success && res.data) {
        this.stats.set(res.data);
        this.renderStatusChart(res.data.booking_status_counts);
      }
    });

    this.dashboardService.getRevenueAnalytics().subscribe(res => {
      if (res.success && res.data) {
        this.revenueAnalytics.set(res.data);
        this.renderRevenueChart(res.data);
      }
    });

    this.dashboardService.getRecentActivity().subscribe(res => {
      if (res.success && res.data) {
        this.activity.set(res.data);
      }
    });
  }

  private resizeCharts() {
    this.revChartInstance?.resize();
    this.statusChartInstance?.resize();
  }

  private renderRevenueChart(data: RevenueAnalytics) {
    if (!this.revenueChartRef) return;
    this.revChartInstance = echarts.init(this.revenueChartRef.nativeElement);

    const months = Array.from(new Set([
      ...data.collected.map(c => c.month),
      ...data.invoiced.map(i => i.month)
    ])).sort();

    const collectedValues = months.map(m => {
      const match = data.collected.find(c => c.month === m);
      return match ? match.total_cents / 100 : 0;
    });

    const invoicedValues = months.map(m => {
      const match = data.invoiced.find(i => i.month === m);
      return match ? match.total_cents / 100 : 0;
    });

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let html = `<div style="font-weight:700;margin-bottom:4px;">${params[0].axisValue}</div>`;
          params.forEach((p: any) => {
            const sym = this.auth.businessSettings()?.currency_symbol || '₹';
            html += `<div>${p.marker} ${p.seriesName}: <b>${sym}${p.value.toFixed(2)}</b></div>`;
          });
          return html;
        }
      },
      legend: {
        data: ['Collected Revenue', 'Invoiced Amount'],
        bottom: 0,
        textStyle: { color: '#64748b' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '6%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months.length ? months : ['No Data'],
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b' }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: {
          color: '#64748b',
          formatter: `${this.auth.businessSettings()?.currency_symbol || '₹'}{value}`
        }
      },
      series: [
        {
          name: 'Collected Revenue',
          type: 'line',
          smooth: true,
          data: collectedValues.length ? collectedValues : [0],
          itemStyle: { color: '#10b981' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.01)' }
            ])
          }
        },
        {
          name: 'Invoiced Amount',
          type: 'line',
          smooth: true,
          data: invoicedValues.length ? invoicedValues : [0],
          itemStyle: { color: '#4f46e5' },
          lineStyle: { width: 3 }
        }
      ]
    };

    this.revChartInstance.setOption(option);
  }

  private renderStatusChart(counts?: Record<string, number>) {
    if (!this.bookingStatusChartRef) return;
    this.statusChartInstance = echarts.init(this.bookingStatusChartRef.nativeElement);

    const pending = counts?.['pending'] || 0;
    const confirmed = counts?.['confirmed'] || 0;
    const completed = counts?.['completed'] || 0;
    const cancelled = counts?.['cancelled'] || 0;

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: <b>{c}</b> ({d}%)'
      },
      legend: {
        bottom: 0,
        textStyle: { color: '#64748b' }
      },
      color: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
      series: [
        {
          name: 'Bookings',
          type: 'pie',
          radius: ['45%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          data: [
            { value: pending, name: 'Pending' },
            { value: confirmed, name: 'Confirmed' },
            { value: completed, name: 'Completed' },
            { value: cancelled, name: 'Cancelled' }
          ]
        }
      ]
    };

    this.statusChartInstance.setOption(option);
  }

  getBookingBadgeClass(status: string): string {
    switch (status) {
      case 'completed': return 'badge-success';
      case 'confirmed': return 'badge-info';
      case 'pending': return 'badge-warning';
      case 'cancelled': return 'badge-danger';
      default: return 'badge-neutral';
    }
  }

  getInvoiceBadgeClass(status: string): string {
    switch (status) {
      case 'paid': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'overdue': return 'badge-danger';
      case 'draft': return 'badge-neutral';
      default: return 'badge-neutral';
    }
  }
}
