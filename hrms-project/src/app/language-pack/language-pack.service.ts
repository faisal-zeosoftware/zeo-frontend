import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** v1.15.0 – the Settings → Languages screen's calls to /language/api/ (the app-wide language is in shared-ui/i18n.service.ts). */
export interface LpLanguage {
  code: string; name: string; english_name: string; dir: string; date_format: string; version: number;
  in_company: boolean; is_default: boolean; is_source: boolean; terms_total: number; terms_missing: number; terms_reviewed: number;
}
export interface LpSettings { default_lang: string; active_langs: string[]; own_list: boolean; languages: LpLanguage[]; }
export interface LpTerm {
  id: number; lang: string; source: string; value: string; module: string; where: string[]; where_count: number; in_source: boolean;
  is_reviewed: boolean; edited: boolean; placeholders: string[]; updated_by: string | null; updated_at: string | null;
}
export interface LpTermPage {
  lang: string; count: number; page: number; page_size: number; results: LpTerm[];
  counts: { total: number; missing: number; not_reviewed: number; reviewed: number };
  modules: { module: string; count: number }[];
}
export interface LpImport {
  lang: string; dry_run: boolean; rows: number; new: number; changed: number; unchanged: number; empty: number;
  errors: { row: number; english: string; message: string }[]; samples: { english: string; old: string | null; new: string }[]; message: string;
}
export interface LpFilter { lang: string; q?: string; missing?: string; reviewed?: string; edited?: string; module?: string; page?: number; page_size?: number; }

@Injectable({ providedIn: 'root' })
export class LanguagePackApi {
  readonly api = `${environment.apiBaseUrl}/language/api/`;

  constructor(private http: HttpClient) {}

  private schema(): string { return localStorage.getItem('selectedSchema') || ''; }
  private q(): string { return `?schema=${encodeURIComponent(this.schema())}`; }

  private params(f: LpFilter): HttpParams {
    let p = new HttpParams().set('schema', this.schema()).set('lang', f.lang);
    for (const k of ['q', 'missing', 'reviewed', 'edited', 'module', 'page', 'page_size'] as const) {
      const v = (f as any)[k];
      if (v !== undefined && v !== null && v !== '') { p = p.set(k, String(v)); }
    }
    return p;
  }

  settings(): Observable<LpSettings> { return this.http.get<LpSettings>(`${this.api}settings/${this.q()}`); }
  saveSettings(body: Partial<Pick<LpSettings, 'default_lang' | 'active_langs'>>): Observable<LpSettings> {
    return this.http.patch<LpSettings>(`${this.api}settings/${this.q()}`, body);
  }
  terms(f: LpFilter): Observable<LpTermPage> { return this.http.get<LpTermPage>(`${this.api}terms/`, { params: this.params(f) }); }
  saveTerm(id: number, body: { value?: string; is_reviewed?: boolean }): Observable<LpTerm> {
    return this.http.patch<LpTerm>(`${this.api}terms/${id}/${this.q()}`, body);
  }
  review(ids: number[], is_reviewed = true): Observable<{ updated: number }> {
    return this.http.post<{ updated: number }>(`${this.api}terms/review/${this.q()}`, { ids, is_reviewed });
  }
  importFile(lang: string, file: File, dryRun: boolean): Observable<LpImport> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('lang', lang);
    fd.append('dry_run', dryRun ? '1' : '0');
    return this.http.post<LpImport>(`${this.api}terms/import/${this.q()}`, fd);
  }
  exportFile(f: LpFilter): Observable<Blob> {
    return this.http.get(`${this.api}terms/export/`, { params: this.params({ ...f, page: undefined, page_size: undefined }), responseType: 'blob' });
  }
}
