import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * v1.16.0 – saved views of the list tools (z-list), stored on the server (SavedViews app, /views/api/views/)
 * so they follow the user to another browser. A view holds search, filters, group by, sort, the visible columns
 * with their order and widths, rows per page and the view mode. Columns are referred to by their name, so a view
 * keeps working when the columns are moved.
 */
export interface ViewData {
  v?: number;
  search?: string;
  chips?: any[];
  groupBy?: string[];
  sort?: { col: string; dir: 1 | -1 } | null;
  columns?: { order?: string[]; hide?: string[]; widths?: Record<string, number> };
  size?: number;
  view?: string;
  vst?: any;
  collapsed?: string[];   // closed groups (by group values)
  totals?: string;        // v1.46.0 'sum' | 'avg' | 'both'
  rules?: ColourRule[];   // v1.46.0 conditional formatting
}
export interface ColourRule { col: string; op: string; value: string; color: string; scope: 'row' | 'cell'; }

export interface SavedViewItem {
  id: number; screen: string; name: string; shared: boolean; mine: boolean; owner: string;
  data: ViewData; can_edit: boolean; is_default: boolean; updated_at?: string; share_groups?: number[];
}

export interface SavedViewList { screen: string; views: SavedViewItem[]; default_id: number | null; can_share: boolean; }

@Injectable({ providedIn: 'root' })
export class ZSavedViewsService {
  readonly api = environment.apiBaseUrl;
  constructor(private http: HttpClient) {}

  private get s(): string { return encodeURIComponent(localStorage.getItem('selectedSchema') || ''); }
  private url(p = '', q = ''): string { return `${this.api}/views/api/views/${p}?schema=${this.s}${q}`; }

  list(screen: string): Observable<SavedViewList> { return this.http.get<SavedViewList>(this.url('', `&screen=${encodeURIComponent(screen)}`)); }
  groups(): Observable<{ id: number; name: string; mine: boolean }[]> { return this.http.get<any[]>(`${this.api}/views/api/views/groups/?schema=${this.s}`); }   // v1.46.0 teams
  create(body: { screen: string; name: string; data: ViewData; shared?: boolean; default?: boolean; share_groups?: number[] }): Observable<SavedViewItem> {
    return this.http.post<SavedViewItem>(this.url(), body);
  }
  update(id: number, body: { name?: string; data?: ViewData; shared?: boolean; share_groups?: number[] }): Observable<SavedViewItem> {
    return this.http.patch<SavedViewItem>(this.url(`${id}/`), body);
  }
  remove(id: number): Observable<any> { return this.http.delete(this.url(`${id}/`)); }
  setDefault(screen: string, viewId: number | null): Observable<any> { return this.http.post(this.url('default/'), { screen, view_id: viewId }); }
}
