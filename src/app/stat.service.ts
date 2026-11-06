import { environment } from './../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';

/**  optional date range (epoch ms, inclusive) for stats and CSV. */
export interface StatRange {
  from?: number | null;
  to?: number | null;
}

export interface DoctorStat {
  id: string | null;
  name: string;
  count: number;
  averageDuration: number | null;
}

export interface QueueStat {
  id: string | null;
  name: string;
  total: number;
  closed: number;
  pending: number;
  active: number;
}

export interface ConsultationStats {
  from: number | null;
  to: number | null;
  total: number;
  closed: number;
  pending: number;
  active: number;
  averageDuration: number | null;
  averageWaitingTime: number | null;
  averageCallDuration: number | null;
  successfulCalls: number;
  missedCalls: number;
  patientRatings: { good: number; ok: number; bad: number };
  byDoctor: DoctorStat[];
  byQueue: QueueStat[];
}

@Injectable({
  providedIn: 'root',
})
export class StatService {
  constructor(private http: HttpClient) {}

  private rangeParams(range?: StatRange): HttpParams {
    let params = new HttpParams();
    if (range && range.from !== null && range.from !== undefined) {
      params = params.set('from', String(range.from));
    }
    if (range && range.to !== null && range.to !== undefined) {
      params = params.set('to', String(range.to));
    }
    return params;
  }

  getCSV(range?: StatRange): Observable<string> {
    return this.http.get(environment.api + '/consultations-csv', {
      responseType: 'text',
      params: this.rangeParams(range),
    });
  }

  getStats(range?: StatRange): Observable<ConsultationStats> {
    return this.http.get<ConsultationStats>(environment.api + '/consultations-stats', {
      params: this.rangeParams(range),
    });
  }
}
