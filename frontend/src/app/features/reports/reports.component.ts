import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as echarts from 'echarts';
import { ReportService } from '../../core/services/report.service';
import { AuthService } from '../../core/services/auth.service';
import { RevenueReport, BookingsReport, CustomersReport } from '../../core/models';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, MoneyPipe],
  template: `
    <div class="reports-page">
      <div class="page-header">
        <div>
          <h1 class="header-title">Financial & Operational Reports</h1>
          <p class="header-subtitle">Comprehensive analytics, revenue performance, booking ratios, and client growth</p>
        </div>
        <div class="period-pills">
          <button class="pill-btn" [class.pill-active]="selectedPeriod === '7d'" (click)="setPeriod('7d')">7 Days</button>
          <button class="pill-btn" [class.pill-active]="selectedPeriod === '30d'" (click)="setPeriod('30d')">30 Days</button>
          <button class="pill-btn" [class.pill-active]="selectedPeriod === '90d'" (click)="setPeriod('90d')">90 Days</button>
          <button class="pill-btn" [class.pill-active]="selectedPeriod === '1y'" (click)="setPeriod('1y')">1 Year</button>
        </div>
      </div>

      <!-- Financial KPI Cards -->
      <div class="stats-grid">
        <div class="bf-card stat-card">
          <span class="stat-label">Collected Revenue</span>
          <div class="stat-val text-emerald">{{ revReport()?.total_collected_cents | money }}</div>
          <span class="stat-meta">Cash flow in selected period</span>
        </div>

        <div class="bf-card stat-card">
          <span class="stat-label">Invoiced Total</span>
          <div class="stat-val text-indigo">{{ revReport()?.total_invoiced_cents | money }}</div>
          <span class="stat-meta">{{ revReport()?.total_invoices_count || 0 }} statements issued</span>
        </div>

        <div class="bf-card stat-card">
          <span class="stat-label">Outstanding Receivables</span>
          <div class="stat-val text-amber">{{ revReport()?.outstanding_cents | money }}</div>
          <span class="stat-meta">Pending client settlements</span>
        </div>

        <div class="bf-card stat-card">
          <span class="stat-label">Avg Transaction Value</span>
          <div class="stat-val">{{ revReport()?.average_invoice_cents | money }}</div>
          <span class="stat-meta">Per issued invoice</span>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="charts-row">
        <!-- Daily Payment Timeline -->
        <div class="bf-card chart-card">
          <div class="bf-card-header">
            <div>
              <h3 class="bf-card-title">Collections Timeline</h3>
              <p class="chart-subtitle">Daily payment receipts over the selected window</p>
            </div>
          </div>
          <div #timelineChart class="chart-canvas"></div>
        </div>

        <!-- Payment Method Distribution -->
        <div class="bf-card chart-card">
          <div class="bf-card-header">
            <div>
              <h3 class="bf-card-title">Payment Channels</h3>
              <p class="chart-subtitle">Revenue grouped by payment gateway/method</p>
            </div>
          </div>
          <div #methodChart class="chart-canvas"></div>
        </div>
      </div>

      <!-- Operational Insights Grid -->
      <div class="ops-grid">
        <!-- Services Popularity & Completion -->
        <div class="bf-card">
          <div class="bf-card-header">
            <div>
              <h3 class="bf-card-title">Service Performance & Utilization</h3>
              <p class="chart-subtitle">Booking completion rate: <b>{{ bkReport()?.completion_rate || 0 }}%</b></p>
            </div>
          </div>

          <div class="bf-table-container">
            <table class="bf-table">
              <thead>
                <tr>
                  <th>Service Package</th>
                  <th>Appointments</th>
                  <th>Revenue Generated</th>
                </tr>
              </thead>
              <tbody>
                @for (s of bkReport()?.by_service || []; track s.id) {
                  <tr>
                    <td><b>{{ s.name }}</b></td>
                    <td>{{ s.booking_count }} sessions</td>
                    <td><b>{{ s.revenue_cents | money }}</b></td>
                  </tr>
                } @empty {
                  <tr><td colspan="3" class="empty-cell">No service data</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top Clients by Revenue -->
        <div class="bf-card">
          <div class="bf-card-header">
            <h3 class="bf-card-title">Top Revenue Clients</h3>
          </div>

          <div class="bf-table-container">
            <table class="bf-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Appointments</th>
                  <th>Total Paid</th>
                </tr>
              </thead>
              <tbody>
                @for (c of custReport()?.top_customers || []; track c.id) {
                  <tr>
                    <td>
                      <div class="cell-main">{{ c.name }}</div>
                      <div class="cell-sub">{{ c.company || c.email }}</div>
                    </td>
                    <td>{{ c.total_bookings }}</td>
                    <td>
                      <span class="cell-main text-emerald">{{ c.total_paid_cents | money }}</span>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="3" class="empty-cell">No client revenue data</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
    .header-title { font-size: 1.75rem; font-weight: 800; color: var(--text-main); }
    .header-subtitle { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; }

    .period-pills { display: flex; gap: 0.35rem; background: #ffffff; padding: 0.35rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); }
    .pill-btn {
      background: none; border: none; padding: 0.45rem 1rem; font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); border-radius: var(--radius-sm); cursor: pointer; transition: all 0.15s ease;
    }
    .pill-btn:hover { color: var(--text-main); }
    .pill-active { background: var(--primary); color: #ffffff; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; }
    .stat-card { padding: 1.5rem; }
    .stat-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; }
    .stat-val { font-family: var(--font-heading); font-size: 1.75rem; font-weight: 800; margin: 0.4rem 0 0.2rem; }
    .stat-meta { font-size: 0.75rem; color: var(--text-muted); }
    .text-emerald { color: #059669; }
    .text-indigo { color: #4f46e5; }
    .text-amber { color: #d97706; }

    .charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }
    .chart-canvas { width: 100%; height: 300px; }
    .chart-subtitle { font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.2rem; }

    .ops-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 1.5rem; }
    .cell-main { font-weight: 600; color: var(--text-main); }
    .cell-sub { font-size: 0.75rem; color: var(--text-muted); }

    @media (max-width: 1024px) {
      .charts-row, .ops-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {
  private reportService = inject(ReportService);
  auth = inject(AuthService);

  @ViewChild('timelineChart') timelineRef!: ElementRef;
  @ViewChild('methodChart') methodRef!: ElementRef;

  private timeChartInstance?: echarts.ECharts;
  private methodChartInstance?: echarts.ECharts;
  private resizeHandler = () => this.resizeCharts();

  selectedPeriod = '30d';

  revReport = signal<RevenueReport | null>(null);
  bkReport = signal<BookingsReport | null>(null);
  custReport = signal<CustomersReport | null>(null);

  ngOnInit() {
    this.loadReports();
  }

  ngAfterViewInit() {
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeHandler);
    this.timeChartInstance?.dispose();
    this.methodChartInstance?.dispose();
  }

  setPeriod(period: string) {
    this.selectedPeriod = period;
    this.loadReports();
  }

  loadReports() {
    this.reportService.getRevenueReport(this.selectedPeriod).subscribe(res => {
      if (res.success && res.data) {
        this.revReport.set(res.data);
        this.renderTimelineChart(res.data);
        this.renderMethodChart(res.data);
      }
    });

    this.reportService.getBookingsReport(this.selectedPeriod).subscribe(res => {
      if (res.success && res.data) {
        this.bkReport.set(res.data);
      }
    });

    this.reportService.getCustomersReport().subscribe(res => {
      if (res.success && res.data) {
        this.custReport.set(res.data);
      }
    });
  }

  private resizeCharts() {
    this.timeChartInstance?.resize();
    this.methodChartInstance?.resize();
  }

  private renderTimelineChart(data: RevenueReport) {
    if (!this.timelineRef) return;
    this.timeChartInstance = echarts.init(this.timelineRef.nativeElement);

    const dates = data.timeline.map(t => t.date);
    const amounts = data.timeline.map(t => t.amount_cents / 100);

    const sym = this.auth.businessSettings()?.currency_symbol || '₹';
    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (p: any) => `${p[0].name}: <b>${sym}${p[0].value.toFixed(2)}</b>`
      },
      grid: { left: '3%', right: '4%', bottom: '8%', top: '8%', containLabel: true },
      xAxis: {
        type: 'category',
        data: dates.length ? dates : ['No payments'],
        axisLabel: { color: '#64748b' }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#64748b', formatter: `${sym}{value}` },
        splitLine: { lineStyle: { color: '#f1f5f9' } }
      },
      series: [
        {
          name: 'Revenue Collected',
          type: 'bar',
          data: amounts.length ? amounts : [0],
          itemStyle: { color: '#4f46e5', borderRadius: [4, 4, 0, 0] }
        }
      ]
    };

    this.timeChartInstance.setOption(option);
  }

  private renderMethodChart(data: RevenueReport) {
    if (!this.methodRef) return;
    this.methodChartInstance = echarts.init(this.methodRef.nativeElement);

    const pieData = data.payment_methods.map(m => ({
      name: m.payment_method.replace('_', ' ').toUpperCase(),
      value: m.total_cents / 100
    }));

    const sym = this.auth.businessSettings()?.currency_symbol || '₹';
    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: `{b}: <b>${sym}{c}</b> ({d}%)`
      },
      color: ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'],
      series: [
        {
          type: 'pie',
          radius: '65%',
          data: pieData.length ? pieData : [{ name: 'None', value: 0 }],
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.2)' } }
        }
      ]
    };

    this.methodChartInstance.setOption(option);
  }
}
