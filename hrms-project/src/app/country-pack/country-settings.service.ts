import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** v1.14.0 – the Country settings screen's own calls to /country-pack/api/ (the app-wide pack is in shared-ui/country-pack.service.ts). */
export interface CpTitle { key: string; title: string; help?: string; }
export interface CpResolved {
  pack: string; country_code: string; country_name: string;
  currency: { code: string; symbol: string; decimals: number };
  labels: Record<string, string>; features: Record<string, boolean>;
  rules: { rule_set_id: number | null; rule_set_name: string; weekend_days: number[] };
  overridden: { labels: string[]; features: string[] };
}
export interface CpSettings {
  pack_override: string | null;
  label_overrides: Record<string, string>;
  feature_overrides: Record<string, boolean>;
  updated_at?: string;
  pack: string; auto_pack: string; country: { code: string; name: string };
  defaults: { labels: Record<string, string>; features: Record<string, boolean> };
  resolved: CpResolved;
  label_titles: CpTitle[]; feature_titles: CpTitle[];
  packs: { code: string; name: string }[];
}
export interface CpApplyResult {
  pack: string; message: string;
  added: { kind: string; name: string; detail: string }[];
  kept: { kind: string; name: string; detail: string }[];
}

@Injectable({ providedIn: 'root' })
export class CountrySettingsApi {
  readonly api = `${environment.apiBaseUrl}/country-pack/api/`;

  constructor(private http: HttpClient) {}

  private q(): string { return `?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`; }

  settings(): Observable<CpSettings> { return this.http.get<CpSettings>(`${this.api}settings/${this.q()}`); }

  save(body: { pack_override?: string | null; label_overrides?: Record<string, string>; feature_overrides?: Record<string, boolean | null> }): Observable<CpSettings> {
    return this.http.patch<CpSettings>(`${this.api}settings/${this.q()}`, body);
  }

  applyDefaults(): Observable<CpApplyResult> { return this.http.post<CpApplyResult>(`${this.api}apply-defaults/${this.q()}`, {}); }
}
