/**
 * v1.62.1 (tester 30-10 items 193 / 194) – employee selection of "Assign weekends" and "Assign holidays".
 *
 * Before: the ticks lived on the rows of the filtered list, so changing a filter or searching dropped the ticks of the
 * employees it hid and Save sent only the visible ticked ones; an assignment by branch / department / … opened with
 * no employee ticked (only an employee-by-employee assignment had ticks); the edit list showed 3 rows a page; the
 * weekend form sent no "related to" at all (the assignment was saved but given to nobody) and the holiday form always
 * sent "branch" (a department-only assignment reached nobody).
 * Now: the ticks are a set of employee ids kept across filters and search; an assignment opens with the employees it
 * covers ticked; "related to" follows what was picked: one filter (branch, department, category or designation) with
 * every matching employee ticked → that filter (new joiners are covered too); anything else → the ticked employees.
 */
export interface PickFilters { b: string[]; d: string[]; c: string[]; g: string[] }
export type Related = 'branch' | 'department' | 'category' | 'designation' | 'employee';

/** The employee rows of /employee/api/emplist/ carry names: emp_branch_id = branch name, emp_dept_id = department name … */
export function empMatches(emp: any, f: PickFilters): boolean {
  return (!f.b.length || f.b.includes(emp.emp_branch_id)) && (!f.d.length || f.d.includes(emp.emp_dept_id))
    && (!f.c.length || f.c.includes(emp.emp_ctgry_id)) && (!f.g.length || f.g.includes(emp.emp_desgntn_id));
}

export function searchHit(emp: any, q: string): boolean {
  if (!q) { return true; }
  return [emp.emp_first_name, emp.emp_last_name, emp.emp_code, emp.emp_name].some(x => !!x && String(x).toLowerCase().includes(q));
}

/** The employees an assignment covers (as listed by the API: names of branches …, codes of employees). */
export function coveredIds(asset: any, employees: any[]): Set<number> {
  const out = new Set<number>();
  const rel: string = asset?.related_to || '';
  const has = (list: any, v: any) => Array.isArray(list) && v != null && list.some((x: any) => x == v);
  for (const e of employees || []) {
    const byEmp = has(asset?.employee, e.id) || has(asset?.employee, e.emp_code);
    const hit = rel === 'employee' ? byEmp
      : rel === 'branch' ? has(asset?.branch, e.emp_branch_id)
      : rel === 'department' ? has(asset?.department, e.emp_dept_id)
      : rel === 'category' ? has(asset?.category, e.emp_ctgry_id)
      : rel === 'designation' ? has(asset?.designation, e.emp_desgntn_id)
      : byEmp;
    if (hit) { out.add(e.id); }
  }
  return out;
}

/** "related to" of the saved assignment, see the note at the top. */
export function relatedTo(dims: { branch: any[]; department: any[]; category: any[]; designation: any[] }, picked: Set<number>, matching: number[]): Related {
  const used = (['branch', 'department', 'category', 'designation'] as const).filter(k => (dims[k] || []).length);
  const all = matching.length > 0 && matching.length === picked.size && matching.every(id => picked.has(id));
  return used.length === 1 && all ? used[0] : 'employee';
}
