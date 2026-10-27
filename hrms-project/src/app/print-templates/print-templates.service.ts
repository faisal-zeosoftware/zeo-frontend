// v1.62.0 print – Settings › Print templates: calls to /print-templates/api/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PtDocType { key: string; label: string; label_ar: string; family: string; icon: string; samples: number; own: number; default: { id: number; name: string } | null; }
export interface PtMeta {
  doc_types: PtDocType[]; looks: { key: string; name: string; description: string }[];
  fonts: { key: string; label: string; arabic: boolean }[]; headers: { key: string; label: string }[];
  branches: { id: number; name: string }[]; can_manage: boolean; engine: boolean;
}
export interface PtDefaultRef { id: number; branch_id: number | null; language: string; }
export interface PtBlock { key: string; on: boolean; }
export interface PtSettings {
  look?: string; header?: string; font?: string; heading_font?: string; font_size?: number; primary?: string; accent?: string;
  logo_position?: string; paper?: string; orientation?: string; margins?: { top: number; right: number; bottom: number; left: number };
  blocks?: PtBlock[]; [k: string]: any;
}
export interface PtPlaceholder { path: string; example?: string; snippet: string; loop?: boolean; fields?: string[]; }
export interface PtTemplate {
  id: number; doc_type: string; name: string; description: string; is_sample: boolean; sample_key: string; language: string; mode: string;
  version: number; updated_at: string; copied_from: number | null; look: string; defaults: PtDefaultRef[];
  settings?: PtSettings; html?: string; css?: string; blocks?: { key: string; label: string }[]; placeholders?: PtPlaceholder[];
}
export interface PtPreview { ok: boolean; pages?: string[]; page_count?: number; error?: string; line?: number | null; }
export interface PtVersion { version: number; name: string; mode: string; note: string; saved_at: string; saved_by: string; current: boolean; }
export interface PtBranding {
  logo_source: string; logo_position: string; primary_color: string; accent_color: string; text_color: string; font: string; font_arabic: string;
  header_text: string; footer_text: string; address: string; trn: string; show_stamp: boolean; show_signature: boolean; show_watermark: boolean;
  watermark_text: string; logo: boolean; stamp: boolean; signature: boolean; updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class PrintTemplatesApi {
  get api(): string { return `${environment.apiBaseUrl}/print-templates/api/`; }

  constructor(private http: HttpClient) {}

  private q(extra = ''): string { return `?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}${extra}`; }

  meta(): Observable<PtMeta> { return this.http.get<PtMeta>(`${this.api}meta/${this.q()}`); }
  list(docType: string): Observable<PtTemplate[]> { return this.http.get<PtTemplate[]>(`${this.api}templates/${this.q('&doc_type=' + encodeURIComponent(docType))}`); }
  get(id: number): Observable<PtTemplate> { return this.http.get<PtTemplate>(`${this.api}templates/${id}/${this.q()}`); }
  copy(from: number, name?: string): Observable<PtTemplate> { return this.http.post<PtTemplate>(`${this.api}templates/${this.q()}`, { copy_from: from, name }); }
  save(id: number, body: Partial<PtTemplate> & { note?: string }): Observable<PtTemplate> { return this.http.patch<PtTemplate>(`${this.api}templates/${id}/${this.q()}`, body); }
  remove(id: number): Observable<any> { return this.http.delete(`${this.api}templates/${id}/${this.q()}`); }
  reset(id: number): Observable<PtTemplate> { return this.http.post<PtTemplate>(`${this.api}templates/${id}/reset/${this.q()}`, {}); }
  versions(id: number): Observable<PtVersion[]> { return this.http.get<PtVersion[]>(`${this.api}templates/${id}/versions/${this.q()}`); }
  restore(id: number, version: number): Observable<PtTemplate> { return this.http.post<PtTemplate>(`${this.api}templates/${id}/restore/${this.q()}`, { version }); }
  thumb(id: number, stamp: string | number): Observable<Blob> { return this.http.get(`${this.api}templates/${id}/thumb/${this.q('&v=' + stamp)}`, { responseType: 'blob' }); }
  preview(body: any): Observable<PtPreview> { return this.http.post<PtPreview>(`${this.api}preview/${this.q()}`, body); }
  previewPdf(body: any): Observable<Blob> { return this.http.post(`${this.api}preview/${this.q()}`, { ...body, format: 'pdf' }, { responseType: 'blob' }); }
  records(docType: string, q = ''): Observable<{ id: number; label: string }[]> {
    return this.http.get<{ id: number; label: string }[]>(`${this.api}records/${this.q('&doc_type=' + docType + '&q=' + encodeURIComponent(q))}`);
  }
  defaults(): Observable<any[]> { return this.http.get<any[]>(`${this.api}defaults/${this.q()}`); }
  setDefault(body: { template_id: number; doc_type: string; branch_id?: number | null; language?: string }): Observable<any> {
    return this.http.post(`${this.api}defaults/${this.q()}`, body);
  }
  removeDefault(id: number): Observable<any> { return this.http.delete(`${this.api}defaults/${id}/${this.q()}`); }
  branding(): Observable<PtBranding> { return this.http.get<PtBranding>(`${this.api}branding/${this.q()}`); }
  saveBranding(b: Partial<PtBranding>): Observable<PtBranding> { return this.http.patch<PtBranding>(`${this.api}branding/${this.q()}`, b); }
  upload(kind: string, file: File): Observable<PtBranding> {
    const fd = new FormData();
    fd.append('kind', kind);
    fd.append('file', file, file.name);
    return this.http.post<PtBranding>(`${this.api}branding/file/${this.q()}`, fd);
  }
  removeFile(kind: string): Observable<PtBranding> { return this.http.delete<PtBranding>(`${this.api}branding/file/${this.q('&kind=' + kind)}`); }
  brandImage(kind: string, stamp: string): Observable<Blob> { return this.http.get(`${this.api}branding/file/${kind}/${this.q('&v=' + stamp)}`, { responseType: 'blob' }); }
  print(docType: string, id: number | string, extra = ''): Observable<Blob> {
    return this.http.get(`${this.api}print/${docType}/${id}/${this.q(extra)}`, { responseType: 'blob' });
  }
}

export const LANG_LABEL: Record<string, string> = { en: 'English', ar: 'Arabic', bi: 'English + Arabic' };
