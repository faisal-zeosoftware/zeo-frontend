import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';

/** Attendance Plus (v1.12.0) API base: backend app AttendancePlus mounted at /attendance-plus/api/. */
export const AP_API = '/attendance-plus/api/';

/** URL helper: `${rec.api}/attendance-plus/api/<path>?schema=<company>&<query>`. */
export class ApApi {
  constructor(private http: HttpClient, private rec: ZRecordService, private schema?: string) {}

  url(path: string, q: Record<string, any> = {}): string {
    const extra = Object.entries(q).filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `&${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('');
    const schema = this.schema ?? (localStorage.getItem('selectedSchema') || '');
    return `${this.rec.api}/attendance-plus/api/${path}?schema=${encodeURIComponent(schema)}${extra}`;
  }

  get<T = any>(path: string, q: Record<string, any> = {}, headers?: Record<string, string>): Promise<T> {
    return firstValueFrom(this.http.get<T>(this.url(path, q), headers ? { headers: new HttpHeaders(headers) } : {}));
  }

  post<T = any>(path: string, body: any = {}, headers?: Record<string, string>): Promise<T> {
    return firstValueFrom(this.http.post<T>(this.url(path), body, headers ? { headers: new HttpHeaders(headers) } : {}));
  }

  static err(e: any, fallback = 'It could not be done. Try again.'): string {
    const d = e?.error;
    if (!d) return fallback;
    if (typeof d === 'string') return d.length < 300 ? d : fallback;
    if (d.detail) return Array.isArray(d.detail) ? d.detail.join(' ') : d.detail;
    return Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`).join('\n') || fallback;
  }
}

export const STATUS_COLOR: Record<string, string> = {
  present: 'green', absent: 'red', half_day: 'amber', leave: 'blue', holiday: 'cyan', weekly_off: 'grey',
  missing_punch: 'red', not_marked: 'grey', in: 'green', out: 'grey',
};

/** Read a file as a data URL (selfie / face photo). */
export function fileToDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(f);
  });
}

/** Current GPS position (or null when the user refuses / the device has none). */
export function currentPosition(timeoutMs = 10000): Promise<{ lat: number; lng: number } | null> {
  return new Promise(resolve => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6) }),
      () => resolve(null), { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 });
  });
}

export const isMobile = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 700;
