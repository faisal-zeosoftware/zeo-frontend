import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';

/** URL helper for the LearningPlus screens: `${rec.api}/<path>?schema=<company>&<query>`. */
export class LpApi {
  constructor(private http: HttpClient, private rec: ZRecordService) {}

  url(path: string, q: Record<string, any> = {}): string {
    const extra = Object.entries(q).filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `&${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('');
    return `${this.rec.api}/${path}?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}${extra}`;
  }

  get<T = any>(path: string, q: Record<string, any> = {}): Promise<T> {
    return firstValueFrom(this.http.get<T>(this.url(path, q)));
  }

  post<T = any>(path: string, body: any = {}): Promise<T> {
    return firstValueFrom(this.http.post<T>(this.url(path), body));
  }

  /** Opens a PDF (or other file) that needs the login token: fetch as blob, then open / save it. */
  async openBlob(path: string, q: Record<string, any> = {}, filename = 'file.pdf', download = false): Promise<void> {
    const blob = await firstValueFrom(this.http.get(this.url(path, q), { responseType: 'blob' }));
    const href = URL.createObjectURL(blob);
    if (download) {
      const a = document.createElement('a');
      a.href = href; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    } else {
      window.open(href, '_blank');
    }
    setTimeout(() => URL.revokeObjectURL(href), 60000);
  }

  static err(e: any, fallback = 'It could not be done.'): string {
    const d = e?.error;
    if (!d) return fallback;
    if (typeof d === 'string') return d.length < 300 ? d : fallback;
    if (d.detail) return Array.isArray(d.detail) ? d.detail.join(' ') : d.detail;
    return Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`).join('\n') || fallback;
  }
}

export const employeeLabel = (r: any) => `${[r.emp_first_name, r.emp_last_name].filter(Boolean).join(' ')} (${r.emp_code})`;
export const dots = (n: number) => [1, 2, 3, 4, 5].map(i => i <= (n || 0));
