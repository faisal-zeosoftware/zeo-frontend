import { Pipe, PipeTransform } from '@angular/core';

/**
 * v1.15.1 – one place that turns stored status values ("in_progress", "on_hold", "to_do", "IN-PROGRESS") into the
 * label users read ("In progress", "On hold", "To do"). Sentence case like the rest of the UI. Used by the dashboard
 * project / task cards and the project, task and timesheet lists (customer finding 18: "In_progress" on the dashboard).
 * Unknown values fall back to: underscores / hyphens → spaces, first letter capital, the rest lower case.
 * The label is English source text, so the language packs translate it (runtime translator / `t` pipe).
 */
export const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  draft: 'Draft',
  open: 'Open',
  active: 'Active',
  to_do: 'To do',
  todo: 'To do',
  not_started: 'Not started',
  in_progress: 'In progress',
  on_hold: 'On hold',
  pending: 'Pending',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  done: 'Done',
  completed: 'Completed',
  closed: 'Closed',
  cancelled: 'Cancelled',
  canceled: 'Cancelled',
  expired: 'Expired',
  not_applicable: 'Not applicable',
};

export function statusLabel(value: unknown): string {
  if (value === null || value === undefined) { return ''; }
  const raw = String(value).trim();
  if (!raw) { return ''; }
  const key = raw.toLowerCase().replace(/[\s-]+/g, '_');
  if (STATUS_LABELS[key]) { return STATUS_LABELS[key]; }
  const words = raw.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** `{{ project.status | zstatus }}` – for standalone components (NgModule screens call `statusLabel()` directly). */
@Pipe({ name: 'zstatus', standalone: true, pure: true })
export class ZStatusPipe implements PipeTransform {
  transform(value: unknown): string { return statusLabel(value); }
}
