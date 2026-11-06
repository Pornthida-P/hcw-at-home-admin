import { ConsultationStats, StatRange, StatService } from './../stat.service';
import { Component, OnInit } from '@angular/core';
import { ErrorStateMatcher } from '@angular/material/core';
import { TranslateService } from '@ngx-translate/core';

type QuickRange = '7d' | '30d' | 'month' | 'all' | 'custom';

/**
 *  admin dashboard with summary statistics and a date range filter
 * (from / to, inclusive, local time) applied to both the stats and the CSV.
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  fromDate = ''; // yyyy-MM-dd (input type="date")
  toDate = '';
  quickRange: QuickRange = '30d';

  stats: ConsultationStats = null;
  loading = false;
  downloading = false;
  error = '';

  // Shows both date fields in error while "from" is after "to"
  readonly rangeErrorMatcher: ErrorStateMatcher = { isErrorState: () => this.rangeInvalid };

  doctorColumns = ['name', 'count', 'averageDuration'];
  queueColumns = ['name', 'total', 'pending', 'active', 'closed'];

  constructor(private statService: StatService, private translate: TranslateService) {}

  ngOnInit(): void {
    this.setQuickRange('30d');
  }

  setQuickRange(range: QuickRange) {
    this.quickRange = range;
    const today = new Date();
    if (range === 'all') {
      this.fromDate = '';
      this.toDate = '';
    } else if (range === 'month') {
      this.fromDate = this.toInputDate(new Date(today.getFullYear(), today.getMonth(), 1));
      this.toDate = this.toInputDate(today);
    } else if (range === '7d' || range === '30d') {
      const days = range === '7d' ? 6 : 29;
      const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);
      this.fromDate = this.toInputDate(from);
      this.toDate = this.toInputDate(today);
    }
    this.loadStats();
  }

  onDateChange() {
    this.quickRange = 'custom';
    this.error = '';
  }

  get rangeInvalid(): boolean {
    return !!(this.fromDate && this.toDate && this.fromDate > this.toDate);
  }

  /** inclusive range in epoch ms, computed in the browser's local timezone */
  get range(): StatRange {
    return {
      from: this.fromDate ? this.parseInputDate(this.fromDate, false) : null,
      to: this.toDate ? this.parseInputDate(this.toDate, true) : null,
    };
  }

  apply() {
    this.loadStats();
  }

  loadStats() {
    if (this.rangeInvalid) {
      // the inline message under the date fields explains the problem
      return;
    }
    this.loading = true;
    this.error = '';
    this.statService.getStats(this.range).subscribe(
      (stats) => {
        this.stats = stats;
        this.loading = false;
      },
      (err) => {
        this.loading = false;
        this.stats = null;
        this.error = this.translate.instant('dashboard.loadError');
        console.error('Failed to load stats', err);
      }
    );
  }

  downloadCSV() {
    if (this.rangeInvalid) {
      return;
    }
    this.downloading = true;
    this.statService.getCSV(this.range).subscribe(
      (response) => {
        this.downloading = false;
        this.saveFile(response, 'text/csv;charset=utf-8');
      },
      (err) => {
        this.downloading = false;
        this.error = this.translate.instant('dashboard.downloadError');
        console.error('Failed to download CSV', err);
      }
    );
  }

  /**
   * Save the CSV through a Blob (the previous data: URL broke on '#' and
   * other special characters). A UTF-8 BOM keeps accents/Thai readable in Excel.
   */
  saveFile(data: string, type: string) {
    const blob = new Blob(['\ufeff', data || ''], { type });
    const url = URL.createObjectURL(blob);
    const hiddenElement = document.createElement('a');
    hiddenElement.href = url;
    hiddenElement.download = this.csvFileName();
    document.body.appendChild(hiddenElement);
    hiddenElement.click();
    document.body.removeChild(hiddenElement);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  csvFileName(): string {
    const part =
      this.fromDate || this.toDate
        ? `${this.fromDate || 'start'}_${this.toDate || this.toInputDate(new Date())}`
        : `all_${this.toInputDate(new Date())}`;
    return `consultations-stats_${part}.csv`;
  }

  formatDuration(ms: number | null): string {
    if (ms === null || ms === undefined || isNaN(ms)) {
      return '-';
    }
    const totalSeconds = Math.round(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const hourUnit = this.translate.instant('admin.durationHour');
    const minUnit = this.translate.instant('admin.durationMinute');
    const secUnit = this.translate.instant('admin.durationSecond');
    if (h > 0) {
      return `${h} ${hourUnit} ${m < 10 ? '0' : ''}${m} ${minUnit}`;
    }
    if (m > 0) {
      return `${m} ${minUnit} ${s < 10 ? '0' : ''}${s} ${secUnit}`;
    }
    return `${s} ${secUnit}`;
  }

  private toInputDate(d: Date): string {
    const pad = (n: number) => (n < 10 ? '0' : '') + n;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  private parseInputDate(value: string, endOfDay: boolean): number {
    const [y, m, d] = value.split('-').map((v) => parseInt(v, 10));
    const date = endOfDay ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d, 0, 0, 0, 0);
    return date.getTime();
  }
}
