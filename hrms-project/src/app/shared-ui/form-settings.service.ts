import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

/**
 * Form designer settings (field labels, mandatory / hidden flags, dropdown values) are saved per company
 * on the server. The employee screens still read them from local storage, so this service:
 *  - pull(): copies the company's settings into local storage (on every app start / company change);
 *  - watch(): while the form designer is open, every designer setting written to local storage is
 *    also saved to the server (debounced), so all users and browsers get the same form.
 */
const KEY = /(FieldName|Mandatory|FieldHidden|DataType|DropdownValues|^dropdownValues|^selectedDataType)/;

@Injectable({ providedIn: 'root' })
export class FormSettingsService {
  private api = environment.apiBaseUrl;
  private pulledFor = '';
  private pushTimer: any;
  private origSet: ((k: string, v: string) => void) | null = null;
  private origRemove: ((k: string) => void) | null = null;

  constructor(private http: HttpClient) {}

  private get schema(): string { return localStorage.getItem('selectedSchema') || ''; }
  private get loggedIn(): boolean { return !!localStorage.getItem('auth_token'); }

  /** Copy the company's designer settings into local storage. Resolves true when something changed. */
  pull(force = false): Promise<boolean> {
    const s = this.schema;
    if (!s || !this.loggedIn || (!force && this.pulledFor === s)) { return Promise.resolve(false); }
    this.pulledFor = s;
    return new Promise(resolve => {
      this.http.get<any>(`${this.api}/tools/api/form-settings/?form=employee&schema=${s}`).subscribe({
        next: (r) => {
          const data = (r && r.data) || {};
          let changed = false;
          const set = this.origSet || ((k: string, v: string) => localStorage.setItem(k, v));
          const rem = this.origRemove || ((k: string) => localStorage.removeItem(k));
          // the server copy is the truth for this company: drop old browser-only values first
          if (Object.keys(data).length) {
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const k = localStorage.key(i);
              if (k && KEY.test(k) && !(k in data)) { rem.call(localStorage, k); changed = true; }
            }
          }
          for (const [k, v] of Object.entries(data)) {
            if (v === null || v === undefined) { continue; }
            if (localStorage.getItem(k) !== String(v)) { set.call(localStorage, k, String(v)); changed = true; }
          }
          // first use after the upgrade: the designer's own browser still holds the layout → move it to the server
          if (!Object.keys(data).length) {
            for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && KEY.test(k)) { this.push(); break; } }
          }
          resolve(changed);
        },
        error: () => { this.pulledFor = ''; resolve(false); },
      });
    });
  }

  /** Save every designer setting currently in local storage to the server. */
  push(): void {
    const s = this.schema;
    if (!s) { return; }
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && KEY.test(k)) { data[k] = localStorage.getItem(k) || ''; }
    }
    this.http.put(`${this.api}/tools/api/form-settings/?form=employee&schema=${s}`, { data }).subscribe({
      error: (e) => console.error('Form designer settings were not saved on the server', e),
    });
  }

  /** While the designer is open: save designer settings to the server whenever they change. */
  watch(): void {
    if (this.origSet) { return; }
    const self = this;
    this.origSet = Storage.prototype.setItem;
    this.origRemove = Storage.prototype.removeItem;
    const os = this.origSet, or = this.origRemove;
    Storage.prototype.setItem = function (this: Storage, k: string, v: string) {
      os.call(this, k, v);
      if (this === localStorage && KEY.test(k)) { self.schedulePush(); }
    };
    Storage.prototype.removeItem = function (this: Storage, k: string) {
      or.call(this, k);
      if (this === localStorage && KEY.test(k)) { self.schedulePush(); }
    };
  }

  unwatch(): void {
    if (this.origSet) { Storage.prototype.setItem = this.origSet; }
    if (this.origRemove) { Storage.prototype.removeItem = this.origRemove; }
    this.origSet = null; this.origRemove = null;
    if (this.pushTimer) { clearTimeout(this.pushTimer); this.push(); this.pushTimer = null; }
  }

  private schedulePush(): void {
    clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => { this.pushTimer = null; this.push(); }, 600);
  }
}
