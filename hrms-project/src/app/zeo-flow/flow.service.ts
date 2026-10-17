/** v1.29.0 – Workflow automation: API client + shared look. */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';

export interface FlowMeta {
  modules: { key: string; label: string }[]; models: { key: string; module: string; label: string; app: string }[];
  operators: { key: string; label: string }[]; operators_by_type: Record<string, string[]>;
  actions: { key: string; label: string; hint: string }[]; triggers: { key: string; label: string }[];
  users: { id: number; label: string; email: string }[]; roles: { id: number; label: string }[];
  templates: { id: number; name: string; kind: string; model: string }[]; approval_flows: { id: number; name: string; model: string }[];
  recipient_types: { key: string; label: string }[]; variables: string[]; can_configure: boolean; is_admin: boolean;
}
export interface FlowField { key: string; label: string; type: string; choices?: { value: any; label: string }[]; link?: string; link_label?: string; user?: boolean; employee?: boolean; related?: boolean; many?: boolean; required?: boolean; }

@Injectable({ providedIn: 'root' })
export class FlowService {
  private http = inject(HttpClient);
  private rec = inject(ZRecordService);
  private metaCache: Promise<FlowMeta> | null = null;
  private fieldsCache = new Map<string, Promise<FlowField[]>>();

  url(p: string, q: Record<string, any> = {}): string {
    let params = new HttpParams().set('schema', localStorage.getItem('selectedSchema') || '');
    Object.entries(q).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') { params = params.set(k, String(v)); } });
    return `${this.rec.api}/flow/api/${p}?${params.toString()}`;
  }
  get<T = any>(p: string, q: Record<string, any> = {}): Promise<T> { return firstValueFrom(this.http.get<T>(this.url(p, q))); }
  post<T = any>(p: string, body: any = {}, q: Record<string, any> = {}): Promise<T> { return firstValueFrom(this.http.post<T>(this.url(p, q), body)); }
  patch<T = any>(p: string, body: any = {}): Promise<T> { return firstValueFrom(this.http.patch<T>(this.url(p), body)); }
  delete(p: string): Promise<any> { return firstValueFrom(this.http.delete(this.url(p))); }
  meta(force = false): Promise<FlowMeta> {
    if (force || !this.metaCache) { this.metaCache = this.get<FlowMeta>('meta/'); this.metaCache.catch(() => (this.metaCache = null)); }
    return this.metaCache;
  }
  fields(model: string): Promise<FlowField[]> {
    if (!model) { return Promise.resolve([]); }
    if (!this.fieldsCache.has(model)) {
      const p = this.get<{ fields: FlowField[] }>('meta/fields/', { model }).then(r => r.fields);
      p.catch(() => this.fieldsCache.delete(model));
      this.fieldsCache.set(model, p);
    }
    return this.fieldsCache.get(model)!;
  }
  err(e: any, fallback = 'It could not be done.'): string { const t = httpErrorText(e); return t ? t.charAt(0).toUpperCase() + t.slice(1) : fallback; }
}

/** One look for every automation page (cards, tables, chips, forms). */
export const FLOW_CSS = `
.fw{padding:16px 22px 32px}
.fw-head{display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap;margin:0 0 16px}
.fw-head h1{margin:0;font-size:22px;font-weight:700;color:#1b1640;letter-spacing:-.01em}
.fw-head p{margin:4px 0 0;color:#6b7185;font-size:13.5px;max-width:720px}
.fw-head .sp{flex:1}
.fw-card{background:#fff;border:1px solid #e3e5ee;border-radius:14px;padding:16px 18px;margin-bottom:14px}
.fw-card h2{margin:0 0 10px;font-size:15px;font-weight:700;color:#1b1640}
.fw-grid{display:grid;gap:12px}
.fw-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin-bottom:14px}
.fw-kpi{background:#fff;border:1px solid #e3e5ee;border-radius:12px;padding:14px 16px}
.fw-kpi span{display:block;font-size:12px;color:#6b7185}
.fw-kpi b{display:block;font-size:24px;font-weight:700;color:#1b1640;margin-top:2px}
.fw-kpi.bad b{color:#b42318}.fw-kpi.warn b{color:#b45309}
.fw-btn{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 13px;border-radius:8px;border:1px solid #dcdfea;background:#fff;font-size:13px;font-weight:500;color:#2b2f42;cursor:pointer;white-space:nowrap}
.fw-btn:hover{background:#f4f5fb}.fw-btn.primary{background:#5b4fe0;border-color:#5b4fe0;color:#fff}.fw-btn.primary:hover{background:#4a3fcf}
.fw-btn.danger{color:#b42318;border-color:#f3c3c3}.fw-btn.sm{height:28px;padding:0 9px;font-size:12px}.fw-btn:disabled{opacity:.5;cursor:default}
.fw-btn .material-icons,.fw-btn mat-icon{font-size:18px;width:18px;height:18px}
.fw-chip{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:2px 9px;font-size:11.5px;font-weight:600;background:#f1f2f7;color:#4a4f63;white-space:nowrap}
.fw-chip.ok,.fw-chip.active,.fw-chip.approved{background:#e3f6ea;color:#1f7a4d}.fw-chip.failed,.fw-chip.rejected,.fw-chip.bad{background:#fde8e8;color:#b42318}
.fw-chip.waiting,.fw-chip.pending,.fw-chip.draft{background:#fff4de;color:#b45309}.fw-chip.skipped,.fw-chip.inactive,.fw-chip.archived,.fw-chip.cancelled{background:#eceef5;color:#6b7185}
.fw-chip.changes{background:#e8eefb;color:#2b4fb5}
.fw-table{width:100%;border-collapse:collapse;font-size:13px}
.fw-table th{text-align:left;font-weight:600;color:#6b7185;font-size:12px;padding:8px 10px;border-bottom:1px solid #e3e5ee;white-space:nowrap;background:#fafafd}
.fw-table td{padding:9px 10px;border-bottom:1px solid #f0f1f6;vertical-align:top}
.fw-table tr:hover td{background:#fafafd}
.fw-table a,.fw-link{color:#5b4fe0;cursor:pointer;text-decoration:none}.fw-link:hover{text-decoration:underline}
.fw-muted{color:#6b7185;font-size:12.5px}.fw-small{font-size:12px}
.fw-msg{margin:0 0 12px;padding:10px 12px;border-radius:8px;font-size:13px;background:#ecfdf3;color:#1f7a4d;border:1px solid #b7ebc9}
.fw-msg.err{background:#fff5f5;color:#b42318;border-color:#f3c3c3}
.fw-form{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px 16px}
.fw-form .full{grid-column:1/-1}
.fw-f label{display:block;font-size:12px;font-weight:500;color:#6b7185;margin-bottom:4px}
.fw-f>input:not([type=checkbox]):not([type=radio]),.fw-f>select,.fw-f>textarea,.fw-f>.fw-row>input:not([type=checkbox]),.fw-f>.fw-row>select{min-height:36px;border:1px solid #dcdfea;border-radius:8px;padding:6px 10px;font-size:13.5px;background:#fff;color:#1b1640}
.fw-f>input:not([type=checkbox]):not([type=radio]),.fw-f>select,.fw-f>textarea{width:100%}
.fw-f>.fw-row>input{width:auto}
.fw-f textarea{min-height:80px;font-family:inherit}
.fw-f input:focus,.fw-f select:focus,.fw-f textarea:focus{border-color:#5b4fe0;box-shadow:0 0 0 3px rgba(91,79,224,.15);outline:none}
.fw-f input[type=checkbox]{width:16px;height:16px;accent-color:#5b4fe0}
.fw-f .hint{font-size:11.5px;color:#8a90a6;margin-top:3px}
.fw-check{display:inline-flex;align-items:center;gap:7px;font-size:13px;color:#2b2f42}
.fw-steps{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 16px}
.fw-step{display:inline-flex;align-items:center;gap:8px;padding:7px 12px;border-radius:999px;border:1px solid #e3e5ee;background:#fff;font-size:12.5px;color:#4a4f63;cursor:pointer}
.fw-step b{width:20px;height:20px;border-radius:50%;background:#eceef5;display:inline-flex;align-items:center;justify-content:center;font-size:11px}
.fw-step.on{border-color:#5b4fe0;color:#5b4fe0;background:#f3f1ff}.fw-step.on b{background:#5b4fe0;color:#fff}
.fw-step.done b{background:#1f7a4d;color:#fff}
.fw-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.fw-cond{border:1px solid #e3e5ee;border-radius:10px;padding:10px 12px;margin:8px 0;background:#fafafd}
.fw-cond .fw-cond{background:#fff}
.fw-cond-line select,.fw-cond-line input{width:100%;min-height:34px;border:1px solid #dcdfea;border-radius:8px;padding:4px 8px;font-size:13px;background:#fff}
.fw-cond-line{display:grid;grid-template-columns:minmax(160px,2fr) minmax(140px,1.3fr) minmax(120px,1.6fr) auto;gap:8px;align-items:center;margin:6px 0}
.fw-op{display:inline-flex;border:1px solid #dcdfea;border-radius:8px;overflow:hidden}
.fw-op button{border:0;background:#fff;padding:5px 12px;font-size:12px;cursor:pointer;color:#4a4f63}.fw-op button.on{background:#5b4fe0;color:#fff}
.fw-act{border:1px solid #e3e5ee;border-radius:12px;background:#fff;margin:10px 0;overflow:hidden}
.fw-act>header{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#fafafd;border-bottom:1px solid #eceef5}
.fw-act>header b{flex:1;font-size:13.5px;color:#1b1640}.fw-act>header .n{width:24px;height:24px;border-radius:50%;background:#5b4fe0;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}
.fw-act>.body{padding:12px 14px}
.fw-act.sub{margin:8px 0 8px 18px}
.fw-ic{border:0;background:none;cursor:pointer;color:#6b7185;padding:4px;border-radius:6px;display:inline-flex}.fw-ic:hover{background:#eceef5;color:#1b1640}
.fw-rec{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:4px 0}
.fw-rec .fw-chip{background:#f3f1ff;color:#5b4fe0}
.fw-preview{background:#f7f7fb;border:1px dashed #d9d5fb;border-radius:12px;padding:14px 16px;font-size:13px}
.fw-preview dt{font-size:11.5px;color:#8a90a6;margin-top:8px}.fw-preview dd{margin:2px 0 0;color:#1b1640}
.fw-drawer{position:fixed;top:0;right:0;bottom:0;width:min(640px,96vw);background:#fff;box-shadow:-12px 0 40px rgba(27,22,64,.18);z-index:1100;display:flex;flex-direction:column}
.fw-drawer>header{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid #eceef5}.fw-drawer>header h2{margin:0;font-size:15px;flex:1}
.fw-drawer>.body{padding:14px 18px;overflow:auto;flex:1}.fw-drawer>footer{padding:12px 18px;border-top:1px solid #eceef5;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
.fw-back{position:fixed;inset:0;background:rgba(27,22,64,.35);z-index:1099}
.fw-tabs{display:flex;gap:4px;border-bottom:1px solid #e3e5ee;margin-bottom:12px;flex-wrap:wrap}
.fw-tabs button{border:0;background:none;padding:8px 12px;font-size:13px;color:#6b7185;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
.fw-tabs button.on{color:#5b4fe0;border-bottom-color:#5b4fe0;font-weight:600}
.fw-empty{padding:28px;text-align:center;color:#6b7185;font-size:13.5px}
.fw-stepline{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid #f0f1f6;font-size:13px}
.fw-stepline .i{width:26px;color:#8a90a6;font-size:12px;padding-top:2px}
.fw-filters{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px}
.fw-filters input,.fw-filters select{height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 10px;font-size:13px;background:#fff}
.fw-vars{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}.fw-vars code{background:#f1f2f7;border-radius:5px;padding:1px 6px;font-size:11.5px;cursor:pointer}
@media (max-width:760px){.fw-cond-line{grid-template-columns:1fr}.fw-form{grid-template-columns:1fr}}
`;
