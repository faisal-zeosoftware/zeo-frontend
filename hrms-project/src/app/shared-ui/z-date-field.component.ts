import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18N_UI } from './i18n.service';

/**
 * v1.62.0 reports – a date box that always reads dd/mm/yyyy (the browser's own date box follows the browser locale and showed
 * 10/01/2026 = mm/dd at en-US). Type the date, or pick it from the calendar button (the browser's picker).
 * [(value)] is the ISO date (yyyy-mm-dd) the API takes; '' when empty or not a real date.
 */
@Component({
  selector: 'z-date-field',
  standalone: true,
  imports: [CommonModule, ...I18N_UI],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <span class="zdf" [class.bad]="bad">
    <input type="text" inputmode="numeric" maxlength="10" placeholder="DD/MM/YYYY" [value]="text" [attr.aria-label]="label | t"
           (input)="typed($any($event.target).value)" (blur)="blur()" (keydown.enter)="enter.emit()" data-zdf>
    <button type="button" class="zdf-cal" (click)="openPicker()" [attr.aria-label]="'Pick from the calendar' | t" [title]="'Pick from the calendar' | t" tabindex="-1">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>
    </button>
    <input #native type="date" class="zdf-native" tabindex="-1" aria-hidden="true" [value]="value || ''" (change)="picked($any($event.target).value)">
  </span>`,
  styles: [`
  .zdf { position: relative; display: inline-flex; align-items: center; height: 32px; border: 1px solid #dfe1ea; border-radius: 7px; background: #fff; }
  .zdf.bad { border-color: #d92d20; }
  .zdf:focus-within { border-color: #5b4ff5; box-shadow: 0 0 0 3px rgba(91,79,245,.12); }
  .zdf input[type=text] { width: 96px; height: 30px; border: 0 !important; box-shadow: none !important; border-radius: 7px; margin: 0; background: transparent; padding: 0 4px 0 9px; font-size: 12.5px; color: #1d2033;
    font-variant-numeric: tabular-nums; outline: none; direction: ltr; text-align: start; }
  .zdf-cal { display: inline-grid; place-items: center; width: 28px; height: 30px; border: 0; background: transparent; color: #6b7185; cursor: pointer; border-radius: 0 7px 7px 0; }
  .zdf-cal:hover { color: #4338ca; }
  .zdf-native { position: absolute; inset-inline-end: 0; bottom: 0; width: 1px; height: 1px; opacity: 0; pointer-events: none; border: 0; padding: 0; }`],
})
export class ZDateFieldComponent implements OnChanges {
  @Input() value: string | null = '';
  @Input() label = 'Date';
  @Output() valueChange = new EventEmitter<string>();
  @Output() enter = new EventEmitter<void>();
  @ViewChild('native') native?: ElementRef<HTMLInputElement>;
  text = '';
  bad = false;

  constructor(private cd: ChangeDetectorRef) {}

  ngOnChanges(): void { this.text = ZDateFieldComponent.dmy(this.value || ''); this.bad = false; }

  static dmy(iso: string): string {
    const m = (iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
  }

  static iso(t: string): string | null {
    const m = (t || '').trim().match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
    if (!m) { return null; }
    const d = new Date(+m[3], +m[2] - 1, +m[1]);
    if (d.getDate() !== +m[1] || d.getMonth() !== +m[2] - 1) { return null; }
    return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }

  typed(t: string): void {
    this.text = t;
    if (!t.trim()) { this.bad = false; this.emit(''); return; }
    const iso = ZDateFieldComponent.iso(t);
    this.bad = !iso && t.length >= 8;
    if (iso) { this.emit(iso); }
  }

  blur(): void { const iso = ZDateFieldComponent.iso(this.text); if (iso) { this.text = ZDateFieldComponent.dmy(iso); } this.cd.markForCheck(); }

  picked(iso: string): void { if (!iso) { return; } this.text = ZDateFieldComponent.dmy(iso); this.bad = false; this.emit(iso); this.cd.markForCheck(); }

  openPicker(): void {
    const el = this.native?.nativeElement as any;
    if (!el) { return; }
    try { el.showPicker ? el.showPicker() : el.click(); } catch { el.focus(); }
  }

  private emit(iso: string): void { this.value = iso; this.valueChange.emit(iso); }
}
