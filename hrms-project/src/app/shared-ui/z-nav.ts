/** v1.8.1 – where a drill-down goes: the record's own page when it has one, else the record view. */
export const MS = '/main-sidebar/';

export function recordUrl(model: string, id: number | string): string {
  if (model === 'EmpManagement.emp_master') { return `${MS}sub-sidebar/employee-details/${id}/details`; }
  if (model === 'PayrollManagement.PayrollRun') { return `${MS}salary-options/payroll-details/${id}`; }
  return `${MS}report-options/rec/${model}/${id}`;
}

export function employeeUrl(id: number | string): string { return recordUrl('EmpManagement.emp_master', id); }

/** A drill to the rows of a report: {report, f: {column: value}, from, to} → [path, queryParams]. */
export function reportLink(d: any): [string, Record<string, string>] {
  const q: Record<string, string> = {};
  Object.entries(d?.f || {}).forEach(([k, v]) => { q['f_' + k] = String(v); });
  if (d?.from) { q['from'] = d.from; }
  if (d?.to) { q['to'] = d.to; }
  return [`${MS}report-options/r/${d.report}`, q];
}
