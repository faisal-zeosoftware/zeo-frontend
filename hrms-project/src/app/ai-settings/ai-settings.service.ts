import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** v1.16.0 – Settings → AI settings and "Fill from document": calls to /ai/api/. The API key is write-only. */
export interface AiProvider { code: string; label: string; default_url: string; default_model: string; }
export interface AiCall {
  at: string; user: string; feature: string; feature_label: string; provider: string; sent: boolean; ok: boolean; result: string;
  request_bytes: number; response_bytes: number; duration_ms: number;
}
export interface AiSettings {
  mode: 'builtin' | 'external'; provider: string; api_url: string; model: string;
  key_set: boolean; key_last4: string; key_unreadable: boolean;
  use_ask: boolean; use_documents: boolean; monthly_limit: number; used_this_month: number;
  server_external_allowed: boolean; server_note: string;
  effective: { ask: string; documents: string }; ocr_available: boolean;
  providers: AiProvider[]; data_sent: { ask: string; documents: string; general: string };
  recent_calls: AiCall[]; updated_at?: string; updated_by?: string | null;
}
export interface AiSettingsPatch {
  mode?: string; provider?: string; api_url?: string; model?: string; api_key?: string; clear_key?: boolean;
  use_ask?: boolean; use_documents?: boolean; monthly_limit?: number;
}
export interface AiTestResult { ok: boolean; message: string; ms?: number; reply?: string; }
export interface DocField { key: string; label: string; value: any; confidence: 'high' | 'medium' | 'low'; source: string; note: string; }
export interface DocReading {
  kind: string | null; kind_label: string; fields: DocField[]; info: { label: string; value: string }[]; notes: string[];
  mrz: boolean; mrz_ok: boolean; source: string; ocr_available: boolean; mode: 'builtin' | 'external'; chars: number; fallback?: string;
}

@Injectable({ providedIn: 'root' })
export class AiSettingsApi {
  get api(): string { return `${environment.apiBaseUrl}/ai/api/`; }

  constructor(private http: HttpClient) {}

  private q(): string { return `?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`; }

  settings(): Observable<AiSettings> { return this.http.get<AiSettings>(`${this.api}settings/${this.q()}`); }

  save(body: AiSettingsPatch): Observable<AiSettings> { return this.http.patch<AiSettings>(`${this.api}settings/${this.q()}`, body); }

  test(body: { provider?: string; api_url?: string; model?: string; api_key?: string }): Observable<AiTestResult> {
    return this.http.post<AiTestResult>(`${this.api}settings/test/${this.q()}`, body);
  }

  readDocument(file: File): Observable<DocReading> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    return this.http.post<DocReading>(`${this.api}documents/read/${this.q()}`, fd);
  }
}
