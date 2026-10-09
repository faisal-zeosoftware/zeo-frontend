import { ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from './z-record.service';

interface Msg { role: 'user' | 'assistant'; content: string; html?: SafeHtml; links?: { label: string; url: string }[]; error?: boolean; }

/** Only links into the app are kept; everything else is shown as text. */
const SAFE_LINK = /^\/main-sidebar\/[\w\-./?=&%|()+,:]*$/;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inline(s: string): string {
  let t = esc(s);
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+(?:\([^)\s]*\)[^)\s]*)*)\)/g, (_m, txt, url) => {
    const u = url.replace(/&amp;/g, '&');
    return SAFE_LINK.test(u) ? `<a href="${esc(u)}" data-go="${esc(u)}">${txt}</a>` : txt;
  });
  t = t.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[\s(])\*([^*\s][^*]*)\*(?=[\s).,;:!?]|$)/g, '$1<i>$2</i>').replace(/`([^`]+)`/g, '<code>$1</code>');
  return t;
}

/** A small, safe markdown subset: paragraphs, bold / italic, lists, tables and in-app links. */
export function renderAnswer(md: string): string {
  const lines = (md || '').replace(/\r/g, '').split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^\s*\|/.test(l)) {
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        const cells = lines[i].trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        if (!cells.every(c => /^:?-{2,}:?$/.test(c))) { rows.push(cells); }
        i++;
      }
      if (rows.length) {
        const [h, ...b] = rows;
        out.push(`<div class="za-tw"><table><thead><tr>${h.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${
          b.map(r => `<tr>${r.map((c, j) => `<td data-label="${esc((h[j] || '').replace(/\*\*/g, ''))}">${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      }
      continue;
    }
    if (/^\s*([-*•]|\d+[.)])\s+/.test(l)) {
      const ordered = /^\s*\d/.test(l);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*•]|\d+[.)])\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*([-*•]|\d+[.)])\s+/, '')); i++; }
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.map(x => `<li>${inline(x)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }
    if (/^#{1,4}\s/.test(l)) { out.push(`<p class="za-h">${inline(l.replace(/^#+\s/, ''))}</p>`); i++; continue; }
    if (!l.trim()) { i++; continue; }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^\s*(\||[-*•]\s|\d+[.)]\s|#{1,4}\s)/.test(lines[i])) { para.push(lines[i]); i++; }
    out.push(`<p>${para.map(inline).join('<br>')}</p>`);
  }
  return out.join('');
}

/**
 * v1.9.0 – Ask ZEO AI: questions about the company's data in plain language.
 * The server answers from the report centre and the record view, as the user (their rights and branches).
 */
@Component({
  selector: 'z-ask',
  standalone: true,
  imports: [CommonModule, FormsModule],
  encapsulation: ViewEncapsulation.None,
  template: `
  <button type="button" class="za-btn" *ngIf="enabled" (click)="toggle()" [class.on]="open" aria-label="Ask ZEO AI – ask a question about your data" title="Ask ZEO AI">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z"/>
      <path d="M12 6.8l.9 1.9 1.9.9-1.9.9-.9 1.9-.9-1.9-1.9-.9 1.9-.9z" fill="currentColor" stroke="none"/></svg>
    <span class="za-btn-t">Ask ZEO AI</span>
  </button>

  <div class="za-back" *ngIf="open" (click)="open = false"></div>
  <aside class="za-panel" *ngIf="open" role="dialog" aria-label="Ask ZEO AI">
    <header class="za-head">
      <div>
        <h2>Ask ZEO AI</h2>
        <p>{{ mode === 'ai' ? 'Answers from the reports you may see' : 'Basic mode – simple questions about one report' }}</p>
      </div>
      <button type="button" class="za-new" (click)="reset()" *ngIf="msgs.length" title="Start a new conversation">New</button>
      <button type="button" class="za-x" (click)="open = false" aria-label="Close">×</button>
    </header>

    <div class="za-body" #body>
      <div class="za-empty" *ngIf="!msgs.length">
        <p class="za-lead">Ask about employees, leave, attendance, payroll, loans, documents, assets, requests, appraisals, recruitment or training.</p>
        <button type="button" class="za-sug" *ngFor="let s of suggestions" (click)="send(s)">{{ s }}</button>
      </div>
      <div *ngFor="let m of msgs" [class]="'za-msg ' + m.role + (m.error ? ' err' : '')" dir="auto">
        <div *ngIf="m.role === 'user'">{{ m.content }}</div>
        <div *ngIf="m.role === 'assistant'" class="za-md" [innerHTML]="m.html" (click)="linkClick($event)"></div>
        <div class="za-links" *ngIf="m.links?.length">
          <a *ngFor="let l of m.links" [href]="l.url" (click)="go(l.url, $event)">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>{{ l.label }}</a>
        </div>
      </div>
      <div class="za-msg assistant za-wait" *ngIf="busy"><span></span><span></span><span></span> Looking it up…</div>
    </div>

    <form class="za-in" (ngSubmit)="send()">
      <textarea #box [(ngModel)]="q" name="q" rows="1" placeholder="Ask a question…" dir="auto" (keydown)="key($event)" [disabled]="busy" aria-label="Your question"></textarea>
      <button type="submit" [disabled]="busy || !q.trim()" aria-label="Send">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
    </form>
    <p class="za-foot">Answers use only the data you have access to. Check important figures in the linked report.</p>
  </aside>`,
})
export class ZAskComponent implements OnInit {
  @ViewChild('body') body?: ElementRef<HTMLElement>;
  @ViewChild('box') box?: ElementRef<HTMLTextAreaElement>;
  enabled = false;
  mode = 'basic';
  open = false;
  busy = false;
  q = '';
  msgs: Msg[] = [];
  suggestions: string[] = [];

  constructor(private http: HttpClient, private rec: ZRecordService, private router: Router, private san: DomSanitizer, private cd: ChangeDetectorRef) {}

  private get schema(): string { return localStorage.getItem('selectedSchema') || ''; }

  async ngOnInit(): Promise<void> {
    if (!this.schema) { return; }
    try {
      const d = await firstValueFrom(this.http.get<any>(`${this.rec.api}/dashboard/api/assistant/?schema=${encodeURIComponent(this.schema)}`));
      this.enabled = !!d.enabled; this.mode = d.mode; this.suggestions = d.suggestions || [];
    } catch { this.enabled = false; }
    this.cd.markForCheck();
  }

  @HostListener('document:keydown.escape') esc(): void { this.open = false; }

  toggle(): void {
    this.open = !this.open;
    if (this.open) { setTimeout(() => { this.box?.nativeElement.focus(); this.scroll(); }, 50); }
  }

  reset(): void { this.msgs = []; this.q = ''; setTimeout(() => this.box?.nativeElement.focus(), 30); }

  key(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
  }

  async send(text?: string): Promise<void> {
    const q = (text ?? this.q).trim();
    if (!q || this.busy) { return; }
    this.q = '';
    this.msgs.push({ role: 'user', content: q });
    this.busy = true; this.scroll();
    let branch = '';
    try { branch = (JSON.parse(localStorage.getItem('selectedBranchIds') || '[]') as number[]).join(','); } catch { branch = ''; }
    const history = this.msgs.filter(m => !m.error).map(m => ({ role: m.role, content: m.content })).slice(-12);
    try {
      const d = await firstValueFrom(this.http.post<any>(`${this.rec.api}/dashboard/api/assistant/?schema=${encodeURIComponent(this.schema)}`, { messages: history, branch }));
      this.mode = d.mode || this.mode;
      this.msgs.push({ role: 'assistant', content: d.answer, html: this.san.bypassSecurityTrustHtml(renderAnswer(d.answer)), links: d.links || [] });
    } catch (e: any) {
      const t = e?.error?.detail || 'Ask ZEO AI could not answer just now. Try again.';
      this.msgs.push({ role: 'assistant', content: t, html: this.san.bypassSecurityTrustHtml(renderAnswer(t)), error: true });
    }
    this.busy = false; this.cd.markForCheck(); this.scroll();
    setTimeout(() => this.box?.nativeElement.focus(), 30);
  }

  /** Links in an answer open inside the app. */
  linkClick(e: MouseEvent): void {
    const a = (e.target as HTMLElement).closest('a[data-go]') as HTMLElement | null;
    if (a) { this.go(a.dataset['go']!, e); }
  }

  go(url: string, e?: Event): void {
    e?.preventDefault();
    if (!SAFE_LINK.test(url)) { return; }
    if (window.innerWidth < 992) { this.open = false; }
    this.router.navigateByUrl(url);
  }

  private scroll(): void {
    setTimeout(() => { const b = this.body?.nativeElement; if (b) { b.scrollTop = b.scrollHeight; } }, 30);
  }
}
