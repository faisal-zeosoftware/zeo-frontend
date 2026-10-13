/**
 * v1.23.0 – ZEO Cloud facts of the selected company: is it in a cloud account, is the user its owner, the account status
 * (trial / active / grace / suspended), the banner text and the app licences. GET /cloud/api/status/?schema=
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { ZEO_FLAGS } from './zeo-flags';

export interface CloudLicence { app: string; state: 'included' | 'licensed' | 'trial' | 'expired' | 'none'; licensed: boolean; companies?: number | null; users?: number | null; valid_until?: string | null; days_left?: number | null; used?: number; }
export interface CloudStatus {
  cloud: boolean; linked: boolean; platform_admin?: boolean; owner?: boolean;
  account?: { id: number; name: string; plan: string; plan_code: string; group_features: boolean };
  status?: string; read_only?: boolean; days_left?: number | null; until?: string | null;
  banner?: { kind: string; text: string } | null; apps?: Record<string, CloudLicence>; extra?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ZeoCloudService {
  readonly status$ = new BehaviorSubject<CloudStatus | null>(null);
  private loadedFor = '';

  constructor(private http: HttpClient) {}

  load(force = false): void {
    let schema = '';
    try { schema = localStorage.getItem('selectedSchema') || ''; } catch { schema = ''; }
    if (!schema || (!force && this.loadedFor === schema && this.status$.value)) { return; }
    this.loadedFor = schema;
    this.http.get<CloudStatus>(`${environment.apiBaseUrl}/cloud/api/status/?schema=${encodeURIComponent(schema)}`).subscribe({
      next: r => { ZEO_FLAGS.cloudLinked = !!r.linked; ZEO_FLAGS.cloudOwner = !!(r.linked && r.owner); this.status$.next(r); },
      error: () => { ZEO_FLAGS.cloudLinked = false; ZEO_FLAGS.cloudOwner = false; this.status$.next({ cloud: false, linked: false }); },
    });
  }
}
