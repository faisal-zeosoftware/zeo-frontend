/**
 * v1.19.0 – the employee page in the new design.
 * - compact header that stays on top: photo / initials, name and Arabic name, code · designation · department · branch, status chips,
 *   four key facts, completeness ring (opens the missing items), Actions menu, previous / next
 * - the 19 old tabs in six groups on a left menu: Overview, Personal, Job, UAE documents, Pay, Time & assets
 * - one card at a time in edit mode (pencil → fields → Save / Cancel); rows of family, job history, qualifications, bank accounts,
 *   documents and emergency contacts in tables, added and edited in a side panel ("Save and add another"), no page reload
 * - UAE documents as cards with expiry badges and Renew; WPS readiness; read-only pay, leave, attendance and asset summaries
 * API: employee-profile/api/record/<id>/ (read), api/change/<id>/ (write one group), api/record/<id>/job/, api/employment/<id>/<act>/
 */
import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ErField, ErService, ER_LIST, avatarColour, badgeClass, dmy, erPage, maskFor, money, num } from './er.service';
import { zToast } from '../shared-ui/z-toast';
import { i18nT, packLang } from '../shared-ui/i18n-core';

type GroupKey = 'overview' | 'personal' | 'job' | 'documents' | 'pay' | 'time';
interface Table { key: string; group: string; title: string; noun: string; add: string; empty: string; edit: string; another: string; remove: string; added: string; saved: string; }

const RELATIONS = ['Wife', 'Husband', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Other'];
const TABLES: Record<string, Table> = {
  emergency: { key: 'emergency', group: 'emergency', title: 'Emergency contacts', noun: 'emergency contact', add: 'Add emergency contact', empty: 'No emergency contact yet', edit: 'Edit emergency contact', another: '+ Add another emergency contact', remove: 'Remove this emergency contact', added: '{0} emergency contacts added', saved: 'Emergency contact saved' },
  family: { key: 'family', group: 'family', title: 'Family', noun: 'family member', add: 'Add family member', empty: 'No family members yet', edit: 'Edit family member', another: '+ Add another family member', remove: 'Remove this family member', added: '{0} family members added', saved: 'Family member saved' },
  qualifications: { key: 'qualifications', group: 'qualifications', title: 'Qualifications', noun: 'qualification', add: 'Add qualification', empty: 'No qualifications yet', edit: 'Edit qualification', another: '+ Add another qualification', remove: 'Remove this qualification', added: '{0} qualifications added', saved: 'Qualification saved' },
  experience: { key: 'experience', group: 'experience', title: 'Job history', noun: 'previous job', add: 'Add previous job', empty: 'No previous jobs yet', edit: 'Edit previous job', another: '+ Add another previous job', remove: 'Remove this previous job', added: '{0} previous jobs added', saved: 'Previous job saved' },
  bank: { key: 'bank', group: 'bank', title: 'Bank accounts', noun: 'bank account', add: 'Add bank account', empty: 'No bank account yet', edit: 'Edit bank account', another: '+ Add another bank account', remove: 'Remove this bank account', added: '{0} bank accounts added', saved: 'Bank account saved' },
  files: { key: 'files', group: 'documents', title: 'Document files', noun: 'document', add: 'Upload document', empty: 'No document files yet', edit: 'Edit document', another: '+ Upload another document', remove: 'Remove this document', added: '{0} documents uploaded', saved: 'Document saved' },
};
// which group / card holds each missing item of the completeness check
const MISSING_TO: Record<string, [GroupKey, string]> = {
  'First name': ['personal', 'personal'], 'Last name': ['personal', 'personal'], 'Gender': ['personal', 'personal'], 'Date of birth': ['personal', 'personal'],
  'Nationality': ['personal', 'personal'], 'Marital status': ['personal', 'personal'], 'Mobile number': ['personal', 'contact'], 'E-mail': ['personal', 'contact'],
  'Address': ['personal', 'address'], 'Department': ['job', 'job'], 'Designation': ['job', 'job'], 'Reporting manager': ['job', 'job'], 'Joining date': ['job', 'job'],
  'Arabic name': ['documents', 'names'], 'Passport number': ['documents', 'passport'], 'Passport expiry': ['documents', 'passport'],
  'Emirates ID': ['documents', 'emirates_id'], 'Emirates ID expiry': ['documents', 'emirates_id'], 'Visa number': ['documents', 'visa'], 'Visa expiry': ['documents', 'visa'],
  'Labour card / work permit': ['documents', 'labour_card'], 'MOHRE person ID (WPS)': ['job', 'job'], 'Medical insurance card': ['documents', 'insurance'],
  'Emergency contact': ['personal', 'emergency'], 'Bank IBAN (WPS)': ['pay', 'bank'], 'Bank IBAN': ['pay', 'bank'],
};
const JOB_FIELDS: ErField[] = [
  { key: 'emp_branch_id', label: 'Branch', type: 'look', source: 'branches' }, { key: 'emp_dept_id', label: 'Department', type: 'look', source: 'departments' },
  { key: 'emp_desgntn_id', label: 'Designation', type: 'look', source: 'designations' }, { key: 'emp_ctgry_id', label: 'Category', type: 'look', source: 'categories' },
  { key: 'emp_reporting_manager', label: 'Reporting manager', type: 'look', source: 'managers' }, { key: 'emp_joined_date', label: 'Joining date', type: 'date' },
  { key: 'emp_date_of_confirmation', label: 'Confirmation date', type: 'date' }, { key: 'work_location', label: 'Work location', type: 'look', source: 'branches' },
  { key: 'visa_location', label: 'Visa location', type: 'look', source: 'branches' },
  { key: 'attendance_source', label: 'Attendance', type: 'select', options: [{ value: 'manual', label: 'Manual' }, { value: 'biometric', label: 'Biometric' }, { value: 'mobile', label: 'Mobile' }, { value: 'face', label: 'Face' }] },
  { key: 'barcode_number', label: 'Card / barcode number', type: 'text' }, { key: 'person_id', label: 'MOHRE person code', type: 'text', placeholder: '14 characters' },
  { key: 'emp_ot_applicable', label: 'Overtime applies', type: 'bool' }, { key: 'is_ess', label: 'Self-service user', type: 'bool' },
];

@Component({
  selector: 'app-employee-record',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./er.css'],
  templateUrl: './employee-record.component.html',
})
export class EmployeeRecordComponent implements OnInit, OnDestroy {
  id = 0; d: any = null; look: any = null; loading = true; err = '';
  group: GroupKey = 'overview';
  groups: { key: GroupKey; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '◎' }, { key: 'personal', label: 'Personal', icon: '☺' }, { key: 'job', label: 'Job', icon: '▤' },
    { key: 'documents', label: 'UAE documents', icon: '▣' }, { key: 'pay', label: 'Pay', icon: '¤' }, { key: 'time', label: 'Time & assets', icon: '◷' },
  ];
  T = TABLES; RELATIONS = RELATIONS; JOB_FIELDS = JOB_FIELDS;
  editing = ''; draft: any = {}; draftErr: Record<string, string> = {}; saving = false; dirty = false;
  menu = ''; showMissing = false;
  panel: any = null;          // {table, title, fields, entries: [{values, open, id, errors}], adding}
  att: any = null; attMonth = '';
  history: any[] | null = null;
  prevId: number | null = null; nextId: number | null = null;
  probation: any = null;      // {act, date, to_date, reason, note, last_day}
  unpaidEdit: number | null = null;   // v1.20.2: unpaid days before go-live (gratuity service)
  dupes: Record<string, any[]> = {};
  dmy = dmy; money = money; num = num; badgeClass = badgeClass; t = i18nT;
  private sub?: Subscription;
  private moved: HTMLElement | null = null;
  /** The side panel is moved to <body> so it lies above the top bar and the menus (no parent stacking context). */
  @ViewChild('panelHost') set panelHost(e: ElementRef<HTMLElement> | undefined) {
    if (e && e.nativeElement.parentElement !== document.body) { document.body.appendChild(e.nativeElement); this.moved = e.nativeElement; }
    if (!e) { this.moved = null; }
  }

  constructor(private api: ErService, private route: ActivatedRoute, private router: Router, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.lookups().then(l => { this.look = l; this.cd.markForCheck(); }).catch(() => {});
    this.sub = this.route.paramMap.subscribe(p => {
      this.id = +(p.get('id') || 0);
      const qp = this.route.snapshot.queryParamMap;
      this.group = (qp.get('tab') as GroupKey) || 'overview';
      this.editing = ''; this.panel = null; this.history = null; this.att = null;
      this.load().then(() => { if (qp.get('edit') && this.d?.can_edit) { this.go('personal'); this.edit('personal'); } });
    });
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); this.moved?.remove(); }

  @HostListener('window:beforeunload', ['$event']) unload(e: BeforeUnloadEvent): void { if (this.dirty) { e.preventDefault(); e.returnValue = ''; } }
  @HostListener('document:click') closeMenus(): void { this.menu = ''; this.showMissing = false; }
  @HostListener('document:keydown.escape') esc(): void { if (this.panel) { this.closePanel(); } }

  async load(): Promise<void> {
    this.loading = !this.d;
    try {
      this.d = await this.api.get(`employee-profile/api/record/${this.id}/`);
      this.err = '';
      let order: number[] = [];
      try { order = JSON.parse(sessionStorage.getItem('er_order') || '[]'); } catch { order = []; }
      const i = order.indexOf(this.id);
      this.prevId = i > 0 ? order[i - 1] : (i < 0 ? this.d.prev_id : null);
      this.nextId = i >= 0 ? (order[i + 1] ?? null) : this.d.next_id;
      if (this.group === 'time' && !this.att) { this.loadAtt(); }
      if (this.group === 'job' && !this.history) { this.loadHistory(); }
    } catch (e: any) {
      this.err = e?.status === 404 || e?.status === 403 ? 'This employee is not in your branches or does not exist.' : ErService.error(e, 'The employee could not be loaded.');
    }
    this.loading = false; this.cd.markForCheck();
  }

  // ---------------------------------------------------------------- navigation
  go(g: GroupKey, card?: string): void {
    if (!this.leaveEdit()) { return; }
    this.group = g;
    this.router.navigate([], { queryParams: { tab: g === 'overview' ? null : g }, queryParamsHandling: 'merge', replaceUrl: true });
    if (g === 'time' && !this.att) { this.loadAtt(); }
    if (g === 'job' && !this.history) { this.loadHistory(); }
    if (card) { setTimeout(() => document.getElementById('card-' + card)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); }
  }
  step(id: number | null): void { if (id && this.leaveEdit()) { this.router.navigate([erPage(id)], { queryParams: { tab: this.group === 'overview' ? null : this.group } }); } }
  back(): void { this.router.navigate([ER_LIST]); }
  missingClick(m: string): void { const t = MISSING_TO[m]; this.showMissing = false; if (t) { this.go(t[0], t[1]); } }
  stepClick(s: any): void {
    const map: Record<string, [GroupKey, string]> = { identity: ['documents', 'passport'], salary: ['pay', 'salary'], bank: ['pay', 'bank'], family: ['personal', 'family'], emergency: ['personal', 'emergency'] };
    const t = map[s.key]; if (t) { this.go(t[0], t[1]); }
  }

  // ---------------------------------------------------------------- values of single cards
  groupDef(key: string): any { return this.look?.groups?.find((g: any) => g.key === key); }
  fieldsOf(key: string, only?: string[]): ErField[] {
    const g = this.groupDef(key);
    const f: ErField[] = g ? g.fields : [];
    return only ? only.map(k => f.find(x => x.key === k)).filter(x => !!x) as ErField[] : f;
  }
  optionsOf(f: ErField): { value: any; label: string }[] {
    if (f.type === 'look') { return (this.look && f.source && this.look[f.source]) || []; }
    if (f.key === 'emp_relation' || f.key === 'relation') { return RELATIONS.map(r => ({ value: r, label: r })); }
    return this.api.options(f, this.look);
  }
  show(f: ErField, src: any): string {
    const v = src?.[f.key];
    if (v === null || v === undefined || v === '') { return '–'; }
    if (f.type === 'bool') { return v ? 'Yes' : 'No'; }
    if (f.type === 'date') { return dmy(v); }
    if (f.type === 'number') { return num(v); }
    if (src[f.key + '__label']) { return src[f.key + '__label']; }
    if (f.type === 'select' || f.type === 'fk' || f.type === 'look') { const o = this.optionsOf(f).find(x => String(x.value) === String(v)); return o ? o.label : String(v); }
    return String(v);
  }
  cardValues(key: string): any {
    if (!this.d) { return {}; }
    if (key === 'job') { return this.d.job; }
    if (['personal', 'contact', 'address'].includes(key)) { return this.d[key]; }
    return this.d.identity;     // names and document cards
  }

  // ---------------------------------------------------------------- one card at a time
  leaveEdit(): boolean {
    if (this.dirty && !confirm('You have unsaved changes. Leave without saving?')) { return false; }
    this.editing = ''; this.dirty = false; this.draft = {}; this.draftErr = {};
    return true;
  }
  edit(card: string, fields?: ErField[]): void {
    if (this.editing && this.editing !== card && !this.leaveEdit()) { return; }
    const src = this.cardValues(card);
    const fl = fields || this.cardFields(card);
    this.draft = {}; fl.forEach(f => this.draft[f.key] = src?.[f.key] ?? (f.type === 'bool' ? false : ''));
    if (card === 'renew') { this.draft = {}; }
    this.editing = card; this.draftErr = {}; this.dirty = false;
  }
  cardFields(card: string): ErField[] {
    if (card === 'job') { return JOB_FIELDS; }
    if (['personal', 'contact', 'address'].includes(card)) { return this.fieldsOf(card); }
    if (card === 'names') { return this.fieldsOf('identity', ['arabic_name', 'title', 'preferred_name', 'place_of_birth']); }
    const doc = this.d?.documents?.find((x: any) => x.key === card);
    return doc ? this.fieldsOf('identity', doc.fields) : [];
  }
  touch(f: ErField): void {
    this.dirty = true;
    const m = maskFor(f.key);
    if (m && typeof this.draft[f.key] === 'string') { this.draft[f.key] = m(this.draft[f.key]); }
  }
  cancel(): void { this.editing = ''; this.dirty = false; this.draft = {}; this.draftErr = {}; }
  async saveCard(card: string): Promise<void> {
    this.saving = true; this.draftErr = {};
    const data = { ...this.draft };
    Object.keys(data).forEach(k => { if (data[k] === '') { data[k] = null; } if (k === 'iban_number' && data[k]) { data[k] = String(data[k]).replace(/\s/g, ''); } });
    try {
      if (card === 'job') {
        await this.api.put(`employee-profile/api/record/${this.id}/job/`, data);
      } else {
        const group = ['personal', 'contact', 'address'].includes(card) ? card : 'identity';
        await this.api.post(`employee-profile/api/change/${this.id}/`, { group, data });
      }
      zToast(i18nT('{0} saved', [i18nT(this.cardTitle(card))]), 'ok');
      this.editing = ''; this.dirty = false;
      await this.load();
    } catch (e) {
      this.draftErr = ErService.fieldErrors(e);
      zToast(ErService.error(e), 'err');
    }
    this.saving = false; this.cd.markForCheck();
  }
  cardTitle(card: string): string {
    const t: Record<string, string> = { personal: 'Personal details', contact: 'Contact', address: 'Address', job: 'Job', names: 'Names' };
    return t[card] || this.d?.documents?.find((x: any) => x.key === card)?.label || 'Details';
  }

  /** Renew a document: new number and dates; the old values stay in the history. */
  renew(doc: any): void {
    this.edit(doc.key);
    // a renewal has a new number (the Emirates ID number stays) and new dates; place, country, type and provider stay
    doc.fields.forEach((k: string) => { if (k !== 'emirates_id' && (/(_no|_number|_uid)$/.test(k) || /(_date|_start|_end)$/.test(k))) { this.draft[k] = ''; } });
    this.dirty = true;
    zToast(i18nT('Enter the new details of {0} – the old ones stay in the history', [i18nT(doc.label)]), 'info', false);
  }
  async dupCheck(field: string, value: any): Promise<void> {
    if (!value) { this.dupes[field] = []; return; }
    const map: Record<string, string> = { emirates_id: 'emirates_id', passport_no: 'passport_no', emp_company_email: 'company_email', emp_personal_email: 'personal_email', emp_mobile_number_1: 'mobile', person_id: 'person_id' };
    if (!map[field]) { return; }
    try { const r: any = await this.api.get('employee-profile/api/duplicates/', { [map[field]]: value, exclude: this.id }); this.dupes[field] = r.matches || []; }
    catch { this.dupes[field] = []; }
    this.cd.markForCheck();
  }
  openEmp(id: number): void { this.router.navigate([erPage(id)]); }

  // ---------------------------------------------------------------- tables and the side panel
  rows(t: string): any[] { return (this.d && this.d[t]) || []; }
  panelFields(t: Table): ErField[] {
    let f = this.fieldsOf(t.group);
    if (t.key === 'experience') { f = f.filter(x => x.key !== 'emp_jh_years_experiance'); }
    // relation is a list (Wife, Husband, Son, Daughter, Father, Mother, …), not free text
    return f.map(x => (x.key === 'emp_relation' || x.key === 'relation') ? { ...x, type: 'select', options: RELATIONS.map(r => ({ value: r, label: r })) } : x);
  }
  openPanel(tk: string, row?: any): void {
    const t = TABLES[tk];
    const fields = this.panelFields(t);
    const values: any = {};
    fields.forEach(f => values[f.key] = row ? (row[f.key] ?? (f.type === 'bool' ? false : '')) : (f.type === 'bool' ? (f.key === 'is_active') : ''));
    if (row && tk === 'files') { values.document_type = row.document_type; values.emp_doc_document = null; }
    this.panel = { table: t, fields, adding: !row, entries: [{ id: row?.id || null, values, open: true, errors: {}, file: null, label: row ? this.rowLabel(tk, row) : '' }],
                   title: `${i18nT(row ? t.edit : t.add)} · ${this.d.header.name}` };
  }
  addEntry(): void {
    const v: any = {}; this.panel.fields.forEach((f: ErField) => v[f.key] = f.type === 'bool' ? (f.key === 'is_active') : '');
    this.panel.entries.forEach((e: any) => e.open = false);
    this.panel.entries.push({ id: null, values: v, open: true, errors: {}, file: null, label: '' });
  }
  removeEntry(i: number): void { this.panel.entries.splice(i, 1); }
  entryTitle(e: any, i: number): string {
    const v = e.values; const name = v.ef_member_name || v.name || v.emp_jh_company_name || v.emp_qualification || v.bank_name || v.emp_doc_number || '';
    const noun = this.panel.table.noun;
    return `${i18nT(noun[0].toUpperCase() + noun.slice(1))} ${i + 1}${name ? ' · ' + name : ''}`;
  }
  required(t: Table): string[] {
    return ({ family: ['ef_member_name', 'emp_relation'], emergency: ['name', 'mobile'], qualifications: ['emp_qualification'],
      experience: ['emp_jh_company_name', 'emp_jh_from_date'], bank: ['bank_name'], files: ['document_type'] } as any)[t.key] || [];
  }
  canSave(): boolean { return !!this.panel && this.panel.entries.every((e: any) => this.required(this.panel.table).every(k => e.values[k] !== '' && e.values[k] !== null && e.values[k] !== undefined)); }
  maskIn(f: ErField, e: any): void { const m = maskFor(f.key); if (m && typeof e.values[f.key] === 'string') { e.values[f.key] = m(e.values[f.key]); } }
  fileFor(e: any, ev: any): void { e.file = ev.target.files?.[0] || null; }
  closePanel(): void { this.panel = null; }
  computed(t: Table, v: any): string {
    if (t.key === 'family' && v.ef_date_of_birth) { const b = new Date(v.ef_date_of_birth), n = new Date(); let a = n.getFullYear() - b.getFullYear(); if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) { a--; } return `Age ${a}`; }
    if (t.key === 'experience' && v.emp_jh_from_date && v.emp_jh_end_date) {
      const a = new Date(v.emp_jh_from_date), b = new Date(v.emp_jh_end_date); let m = (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth(); if (b.getDate() < a.getDate()) { m--; }
      return m >= 0 ? `Duration ${Math.floor(m / 12) ? Math.floor(m / 12) + ' yr ' : ''}${m % 12} mo` : '';
    }
    return '';
  }
  async savePanel(again = false): Promise<void> {
    const p = this.panel; if (!p) { return; }
    this.saving = true; let ok = 0;
    for (const e of p.entries) {
      e.errors = {};
      const data: any = {};
      p.fields.forEach((f: ErField) => { let v = e.values[f.key]; if (v === '') { v = null; } if (f.key === 'iban_number' && v) { v = String(v).replace(/\s/g, ''); } if (f.type !== 'file') { data[f.key] = v; } });
      try {
        if (e.file || p.table.key === 'files') {
          const fd = new FormData();
          fd.append('group', p.table.group); if (e.id) { fd.append('record_id', String(e.id)); }
          Object.entries(data).forEach(([k, v]) => { if (v !== null && v !== undefined) { fd.append(k, typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v)); } });
          if (e.file) { fd.append(p.table.key === 'files' ? 'emp_doc_document' : 'attachment', e.file); }
          await this.api.post(`employee-profile/api/change/${this.id}/`, fd);
        } else {
          await this.api.post(`employee-profile/api/change/${this.id}/`, { group: p.table.group, record_id: e.id, data });
        }
        e.saved = true; ok++;
      } catch (x) { e.errors = ErService.fieldErrors(x); e.open = true; zToast(ErService.error(x), 'err'); }
    }
    p.entries = p.entries.filter((e: any) => !e.saved);
    this.saving = false;
    if (ok) {
      zToast(p.adding ? (ok === 1 ? i18nT(p.table.saved) : i18nT(p.table.added, [ok])) : i18nT(p.table.saved), 'ok');
      await this.load();
    }
    if (!p.entries.length) { if (again) { this.openPanel(p.table.key); } else { this.panel = null; } }
    this.cd.markForCheck();
  }
  rowLabel(tk: string, r: any): string { return r.ef_member_name || r.name || r.emp_jh_company_name || r.emp_qualification || r.bank_name || r.type || r.emp_doc_number || ''; }
  async removeRow(tk: string, r: any): Promise<void> {
    const t = TABLES[tk];
    if (!confirm(i18nT('Remove {0}?', [this.rowLabel(tk, r) || i18nT(t.noun)]))) { return; }
    try { await this.api.post(`employee-profile/api/change/${this.id}/`, { group: t.group, record_id: r.id, action: 'delete' }); zToast(i18nT('{0} removed', [this.rowLabel(tk, r) || i18nT(t.noun)]), 'ok'); await this.load(); }
    catch (e) { zToast(ErService.error(e, 'It could not be removed.'), 'err'); }
  }

  // ---------------------------------------------------------------- employment / probation
  async unpaidSave(): Promise<void> {
    try {
      await this.api.put(`employee-profile/api/employment/${this.id}/`, { unpaid_days_before_golive: +(this.unpaidEdit || 0) });
      zToast(this.t('Saved'), 'ok'); this.unpaidEdit = null; await this.load();
    } catch (e) { zToast(ErService.error(e), 'err'); }
  }

  async probationDo(): Promise<void> {
    const p = this.probation; if (!p) { return; }
    try {
      const r: any = await this.api.post(`employee-profile/api/employment/${this.id}/${p.act}/`, p);
      zToast(p.act === 'confirm' ? 'Probation confirmed' : p.act === 'extend' ? 'Probation extended' : 'Probation ended', 'ok');
      if (r?.warning) { zToast(r.warning, 'err'); }
      this.probation = null; await this.load();
    } catch (e) { zToast(ErService.error(e), 'err'); }
  }

  // ---------------------------------------------------------------- header actions
  action(a: string): void {
    this.menu = '';
    const h = this.d.header;
    const nav = (u: string, q?: any) => this.router.navigate([u], q ? { queryParams: q } : {});
    if (a === 'transfer') { nav('/main-sidebar/sub-sidebar/employee-transfer', { employee: this.id }); }
    if (a === 'salary') { nav('/main-sidebar/salary-options/employee-salary', { employee: this.id }); }
    if (a === 'letter') { nav('/main-sidebar/self-service/hr-letters', { employee: this.id }); }
    if (a === 'probation') { this.go('job', 'employment'); }
    if (a === 'exit') { nav('/main-sidebar/sub-sidebar/resignation-request', { employee: this.id }); }
    if (a === 'print') { setTimeout(() => window.print(), 50); }
    if (a === 'classic') { nav(`/main-sidebar/sub-sidebar/employee-details/${this.id}/classic`); }
    if (a === 'deactivate') {
      if (!confirm(`${h.is_active ? 'Deactivate' : 'Activate'} ${h.name}?`)) { return; }
      this.api.patch(`employee/api/Employee/${this.id}/`, { is_active: !h.is_active })
        .then(() => { zToast(`${h.name} ${h.is_active ? 'deactivated' : 'activated'}`, 'ok'); this.load(); })
        .catch(e => zToast(ErService.error(e), 'err'));
    }
  }
  async photo(ev: any): Promise<void> {
    const f = ev.target.files?.[0]; if (!f) { return; }
    const fd = new FormData(); fd.append('emp_profile_pic', f);
    try { await this.api.patch(`employee/api/Employee/${this.id}/`, fd); zToast('Photo updated', 'ok'); await this.load(); }
    catch (e) { zToast(ErService.error(e, 'The photo could not be saved.'), 'err'); }
  }
  colour(s: string): string { return avatarColour(s); }
  ringDash(p: number): string { return `${(p * 1.5708).toFixed(1)} 157.08`; }

  // ---------------------------------------------------------------- time
  async loadAtt(month?: string): Promise<void> {
    const m = month || this.attMonth || new Date().toISOString().slice(0, 7);
    this.attMonth = m;
    try { this.att = await this.api.get(`employee-profile/api/record/${this.id}/attendance/`, { month: m }); } catch { this.att = { days: [], totals: {} }; }
    this.cd.markForCheck();
  }
  monthShift(n: number): void { const [y, m] = this.attMonth.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); this.loadAtt(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); }
  monthLabel(): string { if (!this.attMonth) { return ''; } const [y, m] = this.attMonth.split('-').map(Number); return new Date(y, m - 1, 1).toLocaleString(packLang() === 'ar' ? 'ar-AE' : 'en-GB', { month: 'long', year: 'numeric' }); }
  lead(): number[] { if (!this.att?.days?.length) { return []; } const d = new Date(this.att.days[0].date); return Array((d.getDay() + 6) % 7).fill(0); }
  dayNum(s: string): number { return +String(s).slice(8, 10); }
  attLabel: Record<string, string> = { present: 'Present', absent: 'Absent', leave: 'Leave', holiday: 'Holiday', weekly_off: 'Day off', half_day: 'Half day', missing_punch: 'Missing punch', not_marked: 'Not marked', future: '' };
  leaveBar(l: any): number { const tot = l.entitlement || (l.taken + l.balance) || 1; return Math.min(100, Math.round(l.taken / tot * 100)); }

  revisions(r: any): any[] { return (r.pay?.revisions || []).filter((v: any) => Number(v.old) !== Number(v.new)); }
  payMode(v: string): string {
    const m: Record<string, string> = { wps: 'WPS', cash: 'Cash', cheque: 'Cheque', bank: 'Bank transfer', non_wps: 'Bank (not WPS)' };
    return v ? i18nT(m[v] || v) : '–';
  }
  fixedComps(r: any): any[] { return (r.pay?.components || []).filter((c: any) => c.fixed); }
  calcComps(r: any): any[] { return (r.pay?.components || []).filter((c: any) => !c.fixed); }
  /** English text, or the Arabic of a context key where the plain word means something else ("Open" the link, not "open" the status). */
  tk(en: string, key: string): string { return packLang() === 'en' ? en : i18nT(key); }
  hasOpenSteps(r: any): boolean { return (r.next_steps || []).some((s: any) => !s.done); }
  isNum(v: any): boolean { return v !== null && v !== '' && !isNaN(Number(v)); }
  today(): string { return new Date().toISOString().slice(0, 10); }
  monthOf(v: any): string { if (!v) { return '–'; } const [y, m] = String(v).split('-').map(Number); return new Date(y, m - 1, 1).toLocaleString('en-GB', { month: 'short', year: 'numeric' }); }
  pdf(p: any): void { this.api.open(p.pdf, `payslip-${this.d.header.code}-${String(p.month).slice(0, 7)}.pdf`).catch(e => zToast(ErService.error(e, 'The payslip could not be opened.'), 'err')); }
  attKeys(): string[] { return Object.keys(this.att?.totals || {}).filter(k => k !== 'future' && this.att.totals[k]); }
  hasFileField(p: any): boolean { return p.fields.some((f: ErField) => f.type === 'file'); }

  async loadHistory(): Promise<void> {
    try { const r: any = await this.api.get(`employee-profile/api/history/${this.id}/`); this.history = r.events || []; } catch { this.history = []; }
    this.cd.markForCheck();
  }
}
