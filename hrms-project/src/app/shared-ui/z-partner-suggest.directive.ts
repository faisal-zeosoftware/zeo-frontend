import { Directive, ElementRef, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

let zpsSeq = 0;

/** v1.67.4 (masters) – business partner names suggested on a typed supplier / vendor / customer / buyer / merchant field.
 *  The field stays free text (nothing typed is lost); a name picked from the list links the record to that business partner when
 *  it is saved – the server links a typed name to the partner of exactly that name. Use: <input [(ngModel)]="x.vendor" zPartnerSuggest> */
@Directive({ selector: 'input[zPartnerSuggest]', standalone: true })
export class ZPartnerSuggestDirective implements OnInit, OnDestroy {
  @Input() zPartnerSuggest = '';   // what the field is (supplier, customer…) – shown as the tooltip
  private list?: HTMLDataListElement;
  private timer: any;
  private last: string | null = null;

  constructor(private el: ElementRef<HTMLInputElement>, private http: HttpClient) {}

  ngOnInit(): void {
    this.list = document.createElement('datalist');
    this.list.id = 'zps-' + (++zpsSeq);
    document.body.appendChild(this.list);
    const i = this.el.nativeElement;
    i.setAttribute('list', this.list.id);
    i.setAttribute('autocomplete', 'off');
    i.setAttribute('data-partner-suggest', this.zPartnerSuggest || 'partner');
  }

  ngOnDestroy(): void { this.list?.remove(); clearTimeout(this.timer); }

  @HostListener('focus') onFocus(): void { this.load(); }
  @HostListener('input') onInput(): void { clearTimeout(this.timer); this.timer = setTimeout(() => this.load(), 250); }

  private load(): void {
    const q = (this.el.nativeElement.value || '').trim();
    if (q === this.last) return;
    this.last = q;
    const schema = localStorage.getItem('selectedSchema') || '';
    const url = `${environment.apiBaseUrl}/zeo-masters/api/options/partners/?schema=${encodeURIComponent(schema)}&limit=20` + (q ? `&q=${encodeURIComponent(q)}` : '');
    this.http.get<any[]>(url).subscribe({ next: rows => this.fill(rows || []), error: () => this.fill([]) });
  }

  private fill(rows: any[]): void {
    if (!this.list) return;
    this.list.innerHTML = '';
    const seen = new Set<string>();
    for (const r of rows) {
      const label = String(r?.label || '');
      const name = label.replace(/ \((BP|[A-Z]{2,4})-\d+\).*$/, '').trim();   // "Name (BP-00012) · phone" → "Name"
      if (!name || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      const o = document.createElement('option');
      o.value = name;
      o.label = label;
      this.list.appendChild(o);
    }
  }
}
