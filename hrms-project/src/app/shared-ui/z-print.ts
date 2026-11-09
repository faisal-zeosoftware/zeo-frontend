// v1.67.7 (admin) – the "Print" button of the app screens (Projects, HSE, CRM, Property, Maintenance, Asset Management, People).
// It opens the 1.67.6 print view (/main-sidebar/print-view/<document>/<id>: the company's default design, Settings › Print
// templates). It is shown only for the documents the user may print in the open company – the app is active and the rights
// allow it (GET /print-templates/api/printable/, the same rule as the print itself).
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ZPrintService {
  private memo: { schema: string; p: Promise<Set<string>> } | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  /** The document keys this user may print here (support_ticket, permit_to_work …). */
  docs(): Promise<Set<string>> {
    const schema = localStorage.getItem('selectedSchema') || '';
    if (!this.memo || this.memo.schema !== schema) {
      const p = firstValueFrom(this.http.get<any>(`${environment.apiBaseUrl}/print-templates/api/printable/?schema=${encodeURIComponent(schema)}`))
        .then(r => new Set<string>(Array.isArray(r?.docs) ? r.docs : []))
        .catch(() => { this.memo = null; return new Set<string>(); });
      this.memo = { schema, p };
    }
    return this.memo.p;
  }

  /** Open the document in the print view (from a list row: the row is not opened too). */
  open(doc: string, id: number | string, ev?: Event): void {
    ev?.stopPropagation();
    this.router.navigate(['/main-sidebar/print-view', doc, id]);
  }
}
