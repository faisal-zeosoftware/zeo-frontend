import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { LOOKUPS, ModuleApiService } from '../module-api.service';

const APPS = '/recruitment/api/applications/';

/** Kanban: Applied → Screening → Interview → Offer → Hired (+ Rejected / Withdrawn). */
@Component({
  selector: 'app-hr-pipeline-board',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, DragDropModule],
  templateUrl: './pipeline-board.component.html',
  styleUrls: ['../hr-shared.css', './pipeline-board.component.css'],
})
export class PipelineBoardComponent implements OnInit {
  jobs: any[] = [];
  jobId: any = null;
  columns: any[] = [];
  selected: any = null;
  adding: any = null;
  nationalities: { value: any; label: string }[] = [];
  toast: { text: string; kind: 'ok' | 'err' } | null = null;

  readonly sources = [['careers', 'Careers page'], ['linkedin', 'LinkedIn'], ['bayt', 'Bayt'], ['naukrigulf', 'Naukrigulf'], ['indeed', 'Indeed'],
    ['nafis', 'Nafis portal'], ['referral', 'Employee referral'], ['agency', 'Recruitment agency'], ['walk_in', 'Walk-in'], ['other', 'Other']];
  readonly visas = [['uae_national', 'UAE National'], ['gcc_national', 'GCC National'], ['own_visa', 'Own / family visa'],
    ['employment_visa', 'Employment visa (needs transfer)'], ['visit_visa', 'Visit visa'], ['outside_uae', 'Outside UAE - needs sponsorship'], ['golden_visa', 'Golden visa']];

  constructor(private api: ModuleApiService) {}

  ngOnInit(): void {
    this.api.list('/recruitment/api/job-openings/', { status: 'published,interviewing,on_hold,filled' }).subscribe(j => {
      this.jobs = j;
      if (j.length) { this.jobId = j[0].id; this.load(); }
    });
    this.api.lookup(LOOKUPS.nationalities).subscribe(n => (this.nationalities = n));
  }

  get job(): any { return this.jobs.find(j => j.id === this.jobId); }
  get listIds(): string[] { return this.columns.map(c => 'col-' + c.stage); }

  load(): void {
    if (!this.jobId) return;
    this.api.get(`${APPS}board/`, { job: this.jobId }).subscribe({
      next: (b: any) => {
        this.columns = b.columns;
        if (this.selected) this.selected = this.columns.flatMap(c => c.items).find((i: any) => i.id === this.selected.id) || null;
      },
      error: e => this.err(e),
    });
  }

  drop(ev: CdkDragDrop<any[]>, target: any): void {
    if (ev.previousContainer === ev.container) return;
    const app = ev.previousContainer.data[ev.previousIndex];
    this.move(app, target.stage);
  }

  move(app: any, stage: string): void {
    let note = '';
    if (stage === 'rejected' || stage === 'withdrawn') {
      note = prompt(`Reason (${stage}):`) || '';
      if (!note) return;
    }
    this.api.action(APPS, app.id, 'move', { stage, note }).subscribe({
      next: () => { this.ok(`Moved to ${stage}.`); this.load(); },
      error: e => this.err(e),
    });
  }

  saveSelected(): void {
    const s = this.selected;
    this.api.update(APPS, s.id, { screening_score: s.screening_score === '' ? null : s.screening_score, rating: s.rating || null }).subscribe({
      next: () => { this.ok('Saved.'); this.load(); },
      error: e => this.err(e),
    });
  }

  startAdd(): void {
    this.adding = { first_name: '', last_name: '', email: '', phone: '', nationality: null, experience_years: 0, notice_period_days: 30,
      expected_salary: null, current_location: '', visa_status: 'outside_uae', source: 'careers', skills: '' };
  }

  saveAdd(): void {
    const a = this.adding;
    if (!a.first_name || !a.email) { this.err({ message: 'First name and email are required.' }); return; }
    this.api.create('/recruitment/api/candidates/', a).subscribe({
      next: (cand: any) => this.api.create(APPS, { candidate: cand.id, job: this.jobId }).subscribe({
        next: () => { this.adding = null; this.ok('Candidate added.'); this.load(); },
        error: e => this.err(e),
      }),
      error: e => this.err(e),
    });
  }

  stars(n: any): number[] { return [1, 2, 3, 4, 5].map(i => (i <= Number(n || 0) ? 1 : 0)); }
  initials(name: string): string { return (name || '?').split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase(); }
  color(i: number): string { return ['#5b4fe0', '#2e9d6a', '#e0794f', '#3a8fd6', '#c4479a', '#8a6d3b', '#2aa6b8', '#d64550'][i % 8]; }

  ok(text: string): void { this.toast = { text, kind: 'ok' }; setTimeout(() => (this.toast = null), 3500); }
  err(e: any): void { this.toast = { text: ModuleApiService.errorText(e), kind: 'err' }; setTimeout(() => (this.toast = null), 7000); }
}
