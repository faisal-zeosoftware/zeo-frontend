import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeProfileService } from './employee-profile.service';

/** v1.13.0 – "Emergency contacts" tab: list, add, edit, delete, one primary contact. HR edits; the employee reads. */
@Component({
  selector: 'z-emp-emergency',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../leave-policy/leave-policy.css', './employee-profile.css'],
  template: `
<div class="ep">
  <div class="ep-bar">
    <span class="grow lp-muted">The primary contact is called first in an emergency.</span>
    <button type="button" class="lp-btn primary" *ngIf="canEdit && !readonly && !form" (click)="open(null)">Add contact</button>
  </div>
  <div class="ep-note err" *ngIf="error">{{ error }}</div>
  <div class="ep-row-form" *ngIf="form">
    <div class="ep-grid">
      <label class="ep-f" [class.bad]="ferr['name']"><span>Name *</span><input type="text" [(ngModel)]="form.name"><small class="err" *ngIf="ferr['name']">{{ ferr['name'] }}</small></label>
      <label class="ep-f" [class.bad]="ferr['relation']"><span>Relation *</span><input type="text" [(ngModel)]="form.relation" list="ep-rel" placeholder="Spouse, Father, Friend…"><small class="err" *ngIf="ferr['relation']">{{ ferr['relation'] }}</small></label>
      <label class="ep-f" [class.bad]="ferr['mobile']"><span>Mobile *</span><input type="tel" [(ngModel)]="form.mobile" placeholder="+971 50 123 4567"><small class="err" *ngIf="ferr['mobile']">{{ ferr['mobile'] }}</small></label>
      <label class="ep-f" [class.bad]="ferr['alt_phone']"><span>Other phone</span><input type="tel" [(ngModel)]="form.alt_phone"><small class="err" *ngIf="ferr['alt_phone']">{{ ferr['alt_phone'] }}</small></label>
      <label class="ep-f" [class.bad]="ferr['email']"><span>E-mail</span><input type="email" [(ngModel)]="form.email"><small class="err" *ngIf="ferr['email']">{{ ferr['email'] }}</small></label>
      <label class="ep-f"><span>Address</span><input type="text" [(ngModel)]="form.address"></label>
      <label class="ep-f check"><input type="checkbox" [(ngModel)]="form.is_primary"> Primary contact</label>
    </div>
    <datalist id="ep-rel"><option *ngFor="let r of relations" [value]="r"></option></datalist>
    <div class="ep-actions">
      <button type="button" class="lp-btn primary" [disabled]="saving" (click)="save()">{{ saving ? 'Saving…' : 'Save contact' }}</button>
      <button type="button" class="lp-btn" (click)="form = null">Cancel</button>
    </div>
  </div>
  <div class="ep-empty" *ngIf="!loading && !rows.length && !denied">No emergency contact yet.{{ canEdit && !readonly ? ' Add one so HR knows whom to call.' : '' }}</div>
  <div class="ep-empty" *ngIf="denied">{{ denied }}</div>
  <div class="ep-scroll" *ngIf="rows.length">
    <table class="ep-table" zPlain>
      <thead><tr><th>Name</th><th>Relation</th><th>Mobile</th><th>Other phone</th><th>E-mail</th><th>Address</th><th></th></tr></thead>
      <tbody>
        <tr *ngFor="let c of rows">
          <td>{{ c.name }} <span class="ep-tag blue" *ngIf="c.is_primary">Primary</span></td>
          <td>{{ c.relation }}</td><td>{{ c.mobile }}</td><td>{{ c.alt_phone || '–' }}</td><td>{{ c.email || '–' }}</td><td>{{ c.address || '–' }}</td>
          <td style="white-space:nowrap">
            <ng-container *ngIf="canEdit && !readonly">
              <button type="button" class="ep-link" (click)="open(c)">Edit</button>
              <button type="button" class="ep-link danger" (click)="remove(c)">Delete</button>
            </ng-container>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`,
})
export class ZEmpEmergencyComponent implements OnChanges {
  @Input() employeeId: number | string | null | undefined = null;
  @Input() readonly = false;
  rows: any[] = [];
  form: any = null;
  ferr: Record<string, string> = {};
  canEdit = false;
  loading = true;
  saving = false;
  error = '';
  denied = '';
  relations = ['Spouse', 'Father', 'Mother', 'Brother', 'Sister', 'Son', 'Daughter', 'Friend', 'Relative'];

  constructor(private svc: EmployeeProfileService, private cd: ChangeDetectorRef) {}

  ngOnChanges(ch: SimpleChanges): void { if (ch['employeeId'] && this.employeeId) { this.load(); } }

  async load(fresh = false): Promise<void> {
    this.loading = true;
    try {
      const p = await this.svc.profile(this.employeeId!, fresh);
      this.rows = p.emergency_contacts || [];
      this.canEdit = !!p.can_edit;
    } catch (e: any) { this.denied = e?.status === 403 ? 'You do not have access to these details.' : 'The contacts could not be loaded.'; }
    this.loading = false;
    this.cd.markForCheck();
  }

  open(c: any): void {
    this.form = c ? { ...c } : { name: '', relation: '', mobile: '', alt_phone: '', email: '', address: '', is_primary: !this.rows.length };
    this.ferr = {};
    this.error = '';
  }

  async save(): Promise<void> {
    this.saving = true;
    this.ferr = {};
    this.error = '';
    const body = { name: this.form.name, relation: this.form.relation, mobile: this.form.mobile, alt_phone: this.form.alt_phone || '',
                   email: this.form.email || '', address: this.form.address || '', is_primary: !!this.form.is_primary };
    try {
      if (this.form.id) { await this.svc.put(`emergency-contacts/${this.form.id}/`, body); }
      else { await this.svc.post('emergency-contacts/', { ...body, employee: this.employeeId }); }
      this.form = null;
      this.svc.forget(this.employeeId!);
      await this.load(true);
    } catch (e: any) {
      const r = this.svc.errors(e);
      this.ferr = r.fields;
      this.error = r.fields['detail'] || 'Please correct the fields marked below.';
    }
    this.saving = false;
    this.cd.markForCheck();
  }

  async remove(c: any): Promise<void> {
    if (!confirm(`Delete the emergency contact ${c.name}?`)) { return; }
    try {
      await this.svc.del(`emergency-contacts/${c.id}/`);
      this.svc.forget(this.employeeId!);
      await this.load(true);
    } catch (e: any) { this.error = this.svc.errors(e, 'The contact could not be deleted.').text; this.cd.markForCheck(); }
  }
}
