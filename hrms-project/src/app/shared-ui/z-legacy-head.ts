/**
 * v1.62.1 – the old register screens get the standard card header: the title and a one-line description under it, the
 * "+ New <thing>" button on the right. The description is looked up by the thing the screen's New button names, so no
 * screen template has to change. Runs outside Angular's zone (a MutationObserver on the page).
 */
import { i18nOriginal, i18nT } from './i18n-core';

const DESC: Record<string, string> = {
  'department': 'The departments of the organisation chart. Employees, approvals and reports are grouped by them.',
  'designation': 'Job titles. Employees, salary structures and reports use them.',
  'category': 'Employee categories (e.g. staff, labour). Leave, payroll and attendance rules can differ by category.',
  'branch': 'The branches of the company with their address, contact and probation period.',
  'company': 'The companies of this ZEO and their legal details.',
  'location': 'Work locations inside the branches.',
  'state': 'Emirates / states used in addresses.',
  'user': 'Sign-ins to ZEO for this company. Rights come from the permission groups; link a user to the employee on the employee page.',
  'document type': 'Kinds of employee documents (passport, visa, Emirates ID …). Expiry alerts and the document library use them.',
  'document request type': 'Documents employees can ask HR for (salary certificate, NOC …) and how many approvals each needs.',
  'request type': 'Kinds of general requests employees can raise and how many approvals each needs.',
  'leave type': 'Kinds of leave. Entitlements, accrual and pay rules are set on Leave policies.',
  'leave entitlement': 'The older leave entitlement rules (the current rules are on Leave policies).',
  'leave balance': 'Opening and adjusted leave balances per employee and leave type.',
  'leave request': 'Leave requests entered by HR for employees, with their approval stage.',
  'leave encashment': 'Requests to be paid for unused leave days.',
  'compensatory leave': 'Compensatory leave for work on a rest day or a holiday.',
  'compensatory transaction': 'Compensatory leave days credited or used.',
  'holiday calendar': 'Public holidays of each year. Assign a calendar to branches or employees under Assign holidays.',
  'holiday calendar assignment': 'Which holiday calendar applies to which branch, department, category or employee.',
  'weekend calendar': 'Weekly rest days (e.g. Saturday – Sunday).',
  'weekend assignment': 'Which weekend calendar applies to which branch, department, category or employee.',
  'employee shift': 'The shift each employee works.',
  'shift': 'Shift timings (start, end, breaks).',
  'shift pattern': 'Rotating shift patterns (e.g. two weeks day, two weeks night).',
  'shift override': 'One-off shift changes for an employee on given days.',
  'overtime policy': 'How overtime is calculated and paid.',
  'overtime rule': 'Overtime rates by day type (working day, rest day, holiday).',
  'overtime entry': 'Overtime hours recorded for employees.',
  'round-off policy': 'How punch times are rounded before attendance is calculated.',
  'attendance validation policy': 'Checks applied to punches (missing punches, minimum hours).',
  'late in / early out request': 'Requests to excuse a late arrival or an early departure.',
  'geofence': 'Areas where employees may punch from the mobile app.',
  'leave approval level': 'Who approves leave requests, level by level.',
  'resignation approval level': 'Who approves resignations, level by level.',
  'late in early out approval level': 'Who approves late in / early out requests, level by level.',
  'document approval level': 'Who approves document requests, level by level.',
  'asset approval level': 'Who approves asset requests, level by level.',
  'escalation rule': 'When a request waits too long at a level it is passed on to someone else.',
  'resignation request': 'Resignations entered by HR for employees.',
  'salary structure': 'Salary structures: the components and amounts given to employees.',
  'salary assignment': 'The salary components assigned to each employee.',
  'gratuity rule': 'End-of-service gratuity days per year of service (UAE labour law by default).',
  'numbering rule': 'How document numbers are made (prefix, next number) per document type and branch.',
  'company policy': 'Company policies employees read and acknowledge.',
  'announcement': 'Announcements shown to employees on Home and in self service.',
  'email configuration': 'The mail server used to send e-mails from ZEO.',
  'asset': 'The company assets handed to employees.',
  'asset type': 'Kinds of assets (laptop, phone, vehicle …).',
  'asset allocation': 'Assets issued to employees and their return.',
  'project': 'Projects for timesheets.', 'project stage': 'Stages of projects.', 'project task': 'Tasks of projects.', 'project timesheet': 'Time spent by employees on projects.',
  'employee': 'All employees of the company.',
};
const TEMPLATE_DESC = 'The e-mails sent at each step of this request. Placeholders such as {{ employee_name }} are filled in when the e-mail is sent.';

function descFor(thing: string): string {
  const t = thing.trim().toLowerCase();
  if (DESC[t]) { return DESC[t]; }
  if (/e-?mail template$/.test(t)) { return TEMPLATE_DESC; }
  return '';
}

function apply(root: ParentNode): void {
  root.querySelectorAll?.('button[data-z-new]').forEach(b => {
    const head = (b as HTMLElement).closest('.header_section') as HTMLElement | null;
    if (!head || head.querySelector('.z-legacy-desc') || head.querySelector('p')) { return; }
    const h1 = head.querySelector('h1');
    if (!h1) { return; }
    const thing = ((b as HTMLElement).dataset['zThing'] || (i18nOriginal(b as Element) || b.textContent || '').replace(/^\s*\+\s*New\s+/i, '')).trim();
    const d = descFor(thing);
    head.classList.add('z-card-head');
    if (!d) { return; }
    const p = document.createElement('p');
    p.className = 'z-legacy-desc';
    p.textContent = i18nT(d);
    h1.insertAdjacentElement('afterend', p);
  });
}

let started = false;
export function startLegacyHeads(): void {
  if (started || typeof document === 'undefined') { return; }
  started = true;
  const root = (window as any).Zone?.root;
  const go = () => {
    apply(document);
    let raf = 0;
    new MutationObserver(() => { if (!raf) { raf = requestAnimationFrame(() => { raf = 0; apply(document); }); } })
      .observe(document.body, { childList: true, subtree: true });
  };
  if (root && (window as any).Zone?.current !== root) { root.run(go); } else { go(); }
}
