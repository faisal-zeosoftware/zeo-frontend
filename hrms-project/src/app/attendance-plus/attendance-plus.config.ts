import { LOOKUPS } from '../hr-modules/module-api.service';
import { PageConfig } from '../hr-modules/page-config';
import { AP_API } from './ap-api';

/** Attendance Plus pages (v1.12.0) rendered by the shared CrudPageComponent. */
const opt = (pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }));
export const METHOD_OPTIONS = opt([['web', 'Web'], ['mobile', 'Mobile app'], ['biometric', 'Biometric / face'], ['kiosk', 'Kiosk'],
  ['device', 'Attendance device'], ['qr', 'QR / barcode']]);
const ACTIVE = { key: 'is_active', label: 'Active', type: 'bool' as const };
const BRANCH = { key: 'branch_id', label: 'Branch', type: 'select' as const, lookup: LOOKUPS.branches, width: 4, help: 'Empty = every branch.' };
const STATUS_TAGS = { present: 'green', absent: 'red', half_day: 'orange', leave: 'blue', holiday: 'cyan', weekly_off: 'grey', missing_punch: 'red', not_marked: 'grey' };


export const RULE_PAGE: PageConfig = {
  title: 'Attendance Rules', itemName: 'Rule', endpoint: AP_API + 'rules/', model: 'attendance',
  intro: 'Grace period, tolerances, minimum / maximum hours, overtime, night and cross-midnight shifts, breaks, rounding, absence marking, '
    + 'allowed punch methods and corrections. The most specific active rule wins: employee > category > department > branch > whole company '
    + '(priority breaks a tie). Values set on a shift in the shift planner (grace, minimum hours, OT start) win over the rule.',
  columns: [
    { key: 'name', label: 'Rule' }, { key: 'scope_label', label: 'Applies to' }, { key: 'branch_display', label: 'Branch' },
    { key: 'grace_in_minutes', label: 'Grace (min)', type: 'number' }, { key: 'min_hours_full_day', label: 'Full day (h)', type: 'number' },
    { key: 'ot_enabled', label: 'OT', type: 'bool' }, { key: 'mark_absent_if_no_punch', label: 'Absent if no punch', type: 'bool' },
    { key: 'priority', label: 'Priority', type: 'number' }, ACTIVE,
  ],
  filters: [{ key: 'scope', label: 'Applies to', options: opt([['company', 'Whole company'], ['branch', 'Branch'], ['department', 'Department'], ['category', 'Category'], ['employee', 'Employee']]) }],
  fields: [
    { key: 'name', label: 'Rule name', type: 'text', required: true, width: 6 },
    { key: 'scope', label: 'Applies to', type: 'select', default: 'company', width: 3, options: opt([['company', 'Whole company'], ['branch', 'Branch'], ['department', 'Department'], ['category', 'Category'], ['employee', 'One employee']]) },
    { key: 'priority', label: 'Priority', type: 'number', default: 0, width: 3, help: 'Higher wins when two rules of the same level match.' },
    { ...BRANCH, showIf: m => m.scope === 'branch' },
    { key: 'department_id', label: 'Department', type: 'select', lookup: LOOKUPS.departments, width: 4, showIf: m => m.scope === 'department' },
    { key: 'category_id', label: 'Category', type: 'select', lookup: LOOKUPS.categories, width: 4, showIf: m => m.scope === 'category' },
    { key: 'employee_id', label: 'Employee', type: 'select', lookup: LOOKUPS.employees, width: 6, showIf: m => m.scope === 'employee' },
    { key: 'is_active', label: 'Active', type: 'checkbox', default: true, width: 2 },
    // late / early
    { key: 'grace_in_minutes', label: 'Grace period (minutes)', type: 'number', default: 0, width: 3, help: 'Arriving up to this many minutes after the shift start is on time.' },
    { key: 'late_from', label: 'Count late minutes from', type: 'select', default: 'shift_start', width: 3, options: opt([['shift_start', 'Shift start'], ['grace_end', 'End of the grace period']]) },
    { key: 'late_tolerance_minutes', label: 'Late tolerance (minutes)', type: 'number', default: 0, width: 3, help: 'Later than this → the action on the right. 0 = off.' },
    { key: 'late_beyond_action', label: 'When later than the tolerance', type: 'select', default: 'half_day', width: 3, options: opt([['none', 'Only flag late'], ['half_day', 'Half day'], ['absent', 'Absent']]) },
    { key: 'grace_out_minutes', label: 'Early-out grace (minutes)', type: 'number', default: 0, width: 3, help: 'Leaving up to this many minutes before the shift end is not early.' },
    { key: 'early_tolerance_minutes', label: 'Early-out tolerance (minutes)', type: 'number', default: 0, width: 3, help: 'Leaving earlier than this → the action on the right. 0 = off.' },
    { key: 'early_beyond_action', label: 'When earlier than the tolerance', type: 'select', default: 'half_day', width: 3, options: opt([['none', 'Only flag early'], ['half_day', 'Half day'], ['absent', 'Absent']]) },
    { key: 'late_policy_id', label: 'Late coming penalty policy (id)', type: 'number', width: 3, help: 'Optional: id of a Late coming policy whose penalty applies.' },
    // hours
    { key: 'min_hours_full_day', label: 'Minimum hours for a full day', type: 'number', default: 0, width: 3, help: 'Fewer hours → half day. 0 = off.' },
    { key: 'min_hours_half_day', label: 'Minimum hours for a half day', type: 'number', default: 0, width: 3, help: 'Fewer hours → absent. 0 = off.' },
    { key: 'max_hours', label: 'Maximum hours a day', type: 'number', default: 0, width: 3, help: '0 = no maximum.' },
    { key: 'max_hours_action', label: 'Above the maximum', type: 'select', default: 'cap', width: 3, options: opt([['cap', 'Count only the maximum'], ['flag', 'Count all, flag the day']]) },
    { key: 'half_day_unpaid_fraction', label: 'Unpaid part of a half day', type: 'number', default: 0.5, width: 3, help: '0.5 = half a day unpaid in payroll.' },
    { key: 'default_start', label: 'Hours when no shift is planned: start', type: 'time', width: 3 },
    { key: 'default_end', label: 'end', type: 'time', width: 3 },
    // overtime
    { key: 'ot_enabled', label: 'Overtime counted', type: 'checkbox', default: true, width: 3 },
    { key: 'ot_basis', label: 'Overtime starts', type: 'select', default: 'shift', width: 3, options: opt([['shift', 'After the shift hours'], ['daily', 'After a daily threshold']]), showIf: m => m.ot_enabled !== false },
    { key: 'ot_daily_threshold_hours', label: 'Daily threshold (hours)', type: 'number', default: 8, width: 3, showIf: m => m.ot_enabled !== false && m.ot_basis === 'daily' },
    { key: 'ot_after_minutes', label: 'OT starts after (minutes extra)', type: 'number', default: 0, width: 3, showIf: m => m.ot_enabled !== false },
    { key: 'ot_min_minutes', label: 'Minimum OT to count (minutes)', type: 'number', default: 0, width: 3, showIf: m => m.ot_enabled !== false },
    { key: 'ot_max_hours_per_day', label: 'Maximum OT a day (hours)', type: 'number', default: 0, width: 3, showIf: m => m.ot_enabled !== false },
    { key: 'ot_weekly_threshold_hours', label: 'Weekly threshold (hours)', type: 'number', default: 0, width: 3, help: 'Hours above this in a week are overtime. 0 = off.', showIf: m => m.ot_enabled !== false },
    { key: 'ot_monthly_threshold_hours', label: 'Monthly threshold (hours)', type: 'number', default: 0, width: 3, help: 'Used when no weekly threshold is set.', showIf: m => m.ot_enabled !== false },
    { key: 'ot_needs_approval', label: 'Overtime needs approval before payroll', type: 'checkbox', default: true, width: 4, showIf: m => m.ot_enabled !== false },
    { key: 'ot_rate_normal', label: 'Rate: working day', type: 'number', width: 2, placeholder: '1.25', showIf: m => m.ot_enabled !== false },
    { key: 'ot_rate_weekend', label: 'Rate: off day', type: 'number', width: 2, placeholder: '1.50', showIf: m => m.ot_enabled !== false },
    { key: 'ot_rate_holiday', label: 'Rate: holiday', type: 'number', width: 2, placeholder: '1.50', showIf: m => m.ot_enabled !== false },
    { key: 'ot_rate_night', label: 'Rate: night shift', type: 'number', width: 2, placeholder: '1.50', showIf: m => m.ot_enabled !== false },
    // night / cross midnight
    { key: 'night_start', label: 'Night window from', type: 'time', default: '22:00', width: 3 },
    { key: 'night_end', label: 'Night window to', type: 'time', default: '06:00', width: 3 },
    { key: 'night_min_minutes', label: 'Night shift if at least (minutes in window)', type: 'number', default: 120, width: 3 },
    { key: 'cross_midnight', label: 'Punches after midnight belong to', type: 'select', default: 'shift_start', width: 3, options: opt([['shift_start', 'The day the shift started'], ['calendar', 'Their own calendar day']]) },
    { key: 'day_change_hour', label: 'Without a shift: day changes at (hour)', type: 'number', default: 4, width: 3 },
    // breaks & rounding
    { key: 'break_minutes', label: 'Break (minutes) when the shift has none', type: 'number', default: 0, width: 3 },
    { key: 'break_paid', label: 'Break is paid', type: 'checkbox', default: false, width: 3 },
    { key: 'auto_deduct_break', label: 'Deduct the break when no break is punched', type: 'checkbox', default: true, width: 3 },
    { key: 'auto_deduct_after_hours', label: '… only after (hours worked)', type: 'number', default: 5, width: 3, showIf: m => m.auto_deduct_break !== false },
    { key: 'rounding_mode', label: 'Round punch times', type: 'select', default: 'none', width: 3, options: opt([['none', 'No rounding'], ['nearest', 'To the nearest step'], ['strict', 'In up, out down'], ['lenient', 'In down, out up']]) },
    { key: 'rounding_minutes', label: 'Rounding step (minutes)', type: 'number', default: 0, width: 3, showIf: m => m.rounding_mode && m.rounding_mode !== 'none' },
    // absence
    { key: 'mark_absent_if_no_punch', label: 'Mark absent when a working day has no punch', type: 'checkbox', default: true, width: 6, help: 'Absent days are unpaid in payroll.' },
    { key: 'exempt_manual_source', label: 'Not for employees with manual attendance', type: 'checkbox', default: false, width: 6, showIf: m => m.mark_absent_if_no_punch !== false },
    { key: 'exempt_category_ids', label: 'Not for these categories', type: 'multiselect', lookup: LOOKUPS.categories, width: 6, showIf: m => m.mark_absent_if_no_punch !== false },
    { key: 'exempt_employee_ids', label: 'Not for these employees', type: 'multiselect', lookup: LOOKUPS.employees, width: 6, showIf: m => m.mark_absent_if_no_punch !== false },
    { key: 'missing_punch_after_hours', label: 'Missing punch after shift end + (hours)', type: 'number', default: 4, width: 4 },
    // methods
    { key: 'allowed_methods', label: 'Allowed punch methods (empty = all)', type: 'multiselect', options: METHOD_OPTIONS, width: 12 },
    { key: 'require_gps', label: 'Location (GPS) required', type: 'checkbox', default: false, width: 3 },
    { key: 'require_geofence', label: 'Must be inside the geofence', type: 'checkbox', default: false, width: 3 },
    { key: 'require_selfie', label: 'Selfie photo required', type: 'checkbox', default: false, width: 3 },
    { key: 'require_ip', label: 'Office network (IP list) only', type: 'checkbox', default: false, width: 3 },
    { key: 'min_minutes_between_punches', label: 'Minutes between two punches', type: 'number', default: 1, width: 3 },
    // corrections
    { key: 'correction_window_days', label: 'Corrections within (days)', type: 'number', default: 30, width: 3 },
    { key: 'correction_max_per_month', label: 'Corrections a month (0 = no limit)', type: 'number', default: 5, width: 3 },
    { key: 'correction_needs_hr', label: 'HR gives the final approval', type: 'checkbox', default: true, width: 3, help: 'Off = the manager\'s approval is final.' },
  ],
  canDelete: true,
};

export const IP_PAGE: PageConfig = {
  title: 'Office Networks (IP restriction)', itemName: 'Network list', endpoint: AP_API + 'ip-restrictions/', model: 'attendance',
  intro: 'Networks employees may punch from when their rule has "Office network only". Use one address or network per line, e.g. 94.200.1.5 or 10.0.0.0/24. Empty branch = every branch.',
  columns: [{ key: 'name', label: 'Name' }, { key: 'branch_display', label: 'Branch' }, { key: 'cidrs', label: 'Networks' }, ACTIVE],
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true, width: 8 }, BRANCH,
    { key: 'cidrs', label: 'Allowed addresses / networks (one per line)', type: 'textarea', required: true, width: 12, placeholder: '94.200.1.5\n10.0.0.0/24' },
    { key: 'is_active', label: 'Active', type: 'checkbox', default: true },
  ],
  canDelete: true,
};

export const DEVICE_PAGE: PageConfig = {
  title: 'Attendance Devices', itemName: 'Device', endpoint: AP_API + 'devices/', model: 'attendance',
  intro: 'ZKTeco devices push punches to <server>/iclock/cdata (ADMS / cloud server setting: server address and port only). '
    + 'Other devices post JSON to /attendance-plus/api/device/push/?schema=<company> with the header X-Device-Key. '
    + 'The device user number (PIN) is matched to the employee through Employee machine mapping, else the employee code. Repeated pushes never duplicate punches.',
  columns: [
    { key: 'name', label: 'Device' }, { key: 'serial_number', label: 'Serial number' }, { key: 'device_type', label: 'Type', type: 'tag', tagColors: { zkteco: 'blue', other: 'grey' } },
    { key: 'branch_display', label: 'Branch' }, { key: 'last_seen', label: 'Last seen', type: 'datetime' }, { key: 'punches_received', label: 'Punches', type: 'number' }, ACTIVE,
  ],
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true, width: 6 },
    { key: 'serial_number', label: 'Serial number (SN)', type: 'text', required: true, width: 6 },
    { key: 'device_type', label: 'Type', type: 'select', default: 'zkteco', width: 4, options: opt([['zkteco', 'ZKTeco (ADMS push)'], ['other', 'Other (JSON push)']]) },
    BRANCH,
    { key: 'use_status_keys', label: 'Use the in / out / break keys pressed on the device', type: 'checkbox', default: false, width: 6, help: 'Off = punches alternate in / out.' },
    { key: 'is_active', label: 'Active', type: 'checkbox', default: true, width: 3 },
  ],
  detailFields: [{ key: 'api_key', label: 'API key (JSON push)' }, { key: 'last_ip', label: 'Last address' }, { key: 'last_stamp', label: 'Last ADMS stamp' }],
  rowActions: [{ label: 'New API key', icon: 'key', action: 'new_key', color: 'orange', confirm: 'The old key stops working. Continue?' }],
  canDelete: true,
};

export const KIOSK_PAGE: PageConfig = {
  title: 'Kiosks', itemName: 'Kiosk', endpoint: AP_API + 'kiosks/', model: 'attendance',
  intro: 'A shared tablet or PC where employees punch with their QR badge / card, employee code + PIN or face. Open the kiosk link on the device once; '
    + 'it keeps working without a login. "Show site QR" displays a code that changes every few seconds for employees to scan with their phone.',
  columns: [
    { key: 'name', label: 'Kiosk' }, { key: 'branch_display', label: 'Branch' }, { key: 'allow_qr', label: 'QR / card', type: 'bool' },
    { key: 'allow_pin', label: 'Code + PIN', type: 'bool' }, { key: 'allow_face', label: 'Face', type: 'bool' }, { key: 'show_site_qr', label: 'Site QR', type: 'bool' },
    { key: 'last_seen', label: 'Last used', type: 'datetime' }, ACTIVE,
  ],
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true, width: 8 }, BRANCH,
    { key: 'allow_qr', label: 'Accept QR badges / cards', type: 'checkbox', default: true, width: 4 },
    { key: 'allow_pin', label: 'Accept employee code + PIN', type: 'checkbox', default: true, width: 4 },
    { key: 'allow_face', label: 'Accept face recognition', type: 'checkbox', default: false, width: 4 },
    { key: 'show_site_qr', label: 'Show a rotating site QR', type: 'checkbox', default: false, width: 4 },
    { key: 'site_qr_seconds', label: 'Site QR changes every (seconds)', type: 'number', default: 30, width: 4, showIf: m => !!m.show_site_qr },
    { key: 'is_active', label: 'Active', type: 'checkbox', default: true, width: 4 },
  ],
  detailFields: [{ key: 'token', label: 'Kiosk link', value: (r: any) => `${location.origin}/attendance-kiosk/${r.token}?schema=${localStorage.getItem('selectedSchema') || ''}` }],
  rowActions: [{ label: 'New link', icon: 'link', action: 'new_token', color: 'orange', confirm: 'The kiosk must be opened again with the new link. Continue?' }],
  canDelete: true,
};

export const PUNCH_PAGE: PageConfig = {
  title: 'Punches', itemName: 'Punch', endpoint: AP_API + 'punches/', model: 'attendance',
  intro: 'Every clock-in, clock-out, break and lunch punch with its method (web, mobile, kiosk, QR, device, import, correction), device and address. '
    + 'HR can add a missed punch for an employee or remove a wrong one; the day is recalculated at once.',
  defaultParams: { from: new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10) },
  columns: [
    { key: 'employee_display', label: 'Employee' }, { key: 'work_date', label: 'Work day', type: 'date' }, { key: 'local_time', label: 'Time' },
    { key: 'kind_label', label: 'Punch' }, { key: 'source_label', label: 'Method', type: 'tag', colorKey: 'source', tagColors: { web: 'blue', mobile: 'cyan', kiosk: 'green', device: 'grey', qr: 'green', import: 'orange', correction: 'orange', manual: 'orange', biometric: 'cyan' } },
    { key: 'device_display', label: 'Device / kiosk' }, { key: 'ip', label: 'Address' }, { key: 'geofence_ok', label: 'In fence', type: 'bool' }, { key: 'is_void', label: 'Removed', type: 'bool' },
  ],
  filters: [
    { key: 'employee', label: 'Employee', lookup: LOOKUPS.employees },
    { key: 'source', label: 'Method', options: opt([['web', 'Web'], ['mobile', 'Mobile'], ['biometric', 'Biometric'], ['kiosk', 'Kiosk'], ['device', 'Device'], ['qr', 'QR'], ['import', 'Import'], ['correction', 'Correction'], ['manual', 'Manual']]) },
    { key: 'void', label: 'Removed', options: opt([['false', 'No'], ['true', 'Yes']]) },
  ],
  fields: [
    { key: 'employee_id', label: 'Employee', type: 'select', lookup: LOOKUPS.employees, required: true, width: 6 },
    { key: 'ts', label: 'Date and time', type: 'datetime', required: true, width: 3 },
    { key: 'kind', label: 'Punch', type: 'select', default: 'auto', width: 3, options: opt([['auto', 'Automatic (in or out)'], ['in', 'Clock in'], ['out', 'Clock out'], ['break_out', 'Break start'], ['break_in', 'Break end'], ['lunch_out', 'Lunch start'], ['lunch_in', 'Lunch end']]) },
    { key: 'note', label: 'Note', type: 'text', width: 12 },
  ],
  canEdit: false, canDelete: false,
  rowActions: [{ label: 'Remove', icon: 'block', action: 'void', color: 'red', showIf: r => !r.is_void, prompt: [{ key: 'reason', label: 'Why is this punch wrong?', type: 'text', required: true }] }],
};

const dayColumns = [
  { key: 'employee_display', label: 'Employee' }, { key: 'date', label: 'Date', type: 'date' as const }, { key: 'shift_name', label: 'Shift' },
  { key: 'status_label', label: 'Status', type: 'tag' as const, colorKey: 'status', tagColors: STATUS_TAGS },
  { key: 'first_in_local', label: 'In' }, { key: 'last_out_local', label: 'Out' }, { key: 'worked', label: 'Worked' }, { key: 'break', label: 'Break' },
  { key: 'late', label: 'Late' }, { key: 'early', label: 'Early' }, { key: 'ot', label: 'OT' }, { key: 'is_night_shift', label: 'Night', type: 'bool' as const },
];

export const DAY_PAGE: PageConfig = {
  title: 'Daily Attendance', itemName: 'Day', endpoint: AP_API + 'days/', model: 'attendance',
  intro: 'The daily result of every employee: status from the shift and the attendance rules, in / out, worked hours after breaks, late, early and overtime. '
    + 'It is recalculated on every punch and correction, and every night for the day before.',
  defaultParams: { from: new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10) },
  columns: dayColumns,
  filters: [
    { key: 'employee', label: 'Employee', lookup: LOOKUPS.employees }, { key: 'branch', label: 'Branch', lookup: LOOKUPS.branches },
    { key: 'status', label: 'Status', options: opt([['present', 'Present'], ['absent', 'Absent'], ['half_day', 'Half day'], ['missing_punch', 'Missing punch'], ['leave', 'Leave'], ['holiday', 'Holiday'], ['weekly_off', 'Weekly off']]) },
    { key: 'late', label: 'Late', options: opt([['true', 'Late']]) }, { key: 'early', label: 'Early out', options: opt([['true', 'Early out']]) },
  ],
  canCreate: false, canEdit: false, canDelete: false,
  toolbarActions: [{ label: 'Recalculate', icon: 'refresh', action: 'recompute', color: 'blue',
    prompt: [{ key: 'from', label: 'From', type: 'date', required: true }, { key: 'to', label: 'To', type: 'date', required: true }, { key: 'employee', label: 'Employee (empty = all)', type: 'select', lookup: LOOKUPS.employees }] }],
};

export const MISSING_PAGE: PageConfig = {
  ...DAY_PAGE, title: 'Missing Punches', endpoint: AP_API + 'days/', defaultParams: { missing: 'true' },
  intro: 'Days with a clock-in but no clock-out after the shift end plus the hours set in the rule. The employee is notified to request a correction; HR can also add the missing punch under Punches.',
  toolbarActions: [],
};

export const CORRECTION_PAGE: PageConfig = {
  title: 'Attendance Corrections', itemName: 'Correction request', endpoint: AP_API + 'corrections/',
  intro: 'Employees ask to correct a missing or wrong punch. The reporting manager approves first, then HR gives the final approval; the punches are then written '
    + '(old ones kept as history) and the day is recalculated.',
  multipart: true,
  columns: [
    { key: 'employee_display', label: 'Employee' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'kind_label', label: 'Type' },
    { key: 'proposed_in_local', label: 'Correct in' }, { key: 'proposed_out_local', label: 'Correct out' }, { key: 'reason', label: 'Reason' },
    { key: 'status_label', label: 'Status', type: 'tag', colorKey: 'status', tagColors: { manager: 'orange', hr: 'blue', approved: 'green', rejected: 'red', cancelled: 'grey' } },
  ],
  filters: [
    { key: 'stage', label: 'Waiting for me', options: opt([['manager', 'As manager'], ['hr', 'As HR']]) },
    { key: 'status', label: 'Status', options: opt([['manager', 'Waiting for manager'], ['hr', 'Waiting for HR'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['cancelled', 'Cancelled']]) },
    { key: 'employee', label: 'Employee', lookup: LOOKUPS.employees },
  ],
  fields: [
    { key: 'employee_id', label: 'Employee (HR only – empty = me)', type: 'select', lookup: LOOKUPS.employees, width: 6 },
    { key: 'date', label: 'Date to correct', type: 'date', required: true, width: 3 },
    { key: 'kind', label: 'Type', type: 'select', default: 'missing_punch', width: 3, options: opt([['missing_punch', 'Missing punch'], ['wrong_time', 'Wrong time'], ['forgot', 'Forgot to punch'], ['on_duty', 'On duty / outside work'], ['wfh', 'Work from home']]) },
    { key: 'proposed_in', label: 'Correct clock-in', type: 'datetime', width: 3 },
    { key: 'proposed_out', label: 'Correct clock-out', type: 'datetime', width: 3 },
    { key: 'waive_penalty', label: 'Ask to waive the late / early penalty', type: 'checkbox', default: false, width: 6 },
    { key: 'reason', label: 'Reason', type: 'textarea', required: true, width: 12 },
    { key: 'attachment', label: 'Attachment (optional)', type: 'file', width: 12 },
  ],
  canEdit: false, canDelete: false,
  detailFields: [{ key: 'manager_note', label: 'Manager note' }, { key: 'hr_note', label: 'HR note' }],
  rowActions: [
    { label: 'Approve (manager)', icon: 'check', action: 'manager_approve', color: 'green', showIf: r => r.can_manager_act },
    { label: 'Reject (manager)', icon: 'close', action: 'manager_reject', color: 'red', showIf: r => r.can_manager_act, prompt: [{ key: 'note', label: 'Why is it rejected?', type: 'textarea', required: true }] },
    { label: 'Final approval (HR)', icon: 'done_all', action: 'hr_approve', color: 'green', showIf: r => r.can_hr_act, confirm: 'The punches will be written and the day recalculated. Approve?' },
    { label: 'Reject (HR)', icon: 'close', action: 'hr_reject', color: 'red', showIf: r => r.can_hr_act, prompt: [{ key: 'note', label: 'Why is it rejected?', type: 'textarea', required: true }] },
    { label: 'Cancel', icon: 'undo', action: 'cancel', color: 'grey', showIf: r => r.status === 'manager' || r.status === 'hr', confirm: 'Cancel this request?' },
  ],
};
