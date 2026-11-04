/**
 * v1.62.1 (tester 30-10 items 186 / 187 / 196) – words for the rights in Permission groups (Create / Edit group).
 * "All other modules" showed the server's app names (ZeoAccounting, ZeoAdmin, ZeoAI, oauth2_provider, permissions,
 * PrintTemplates …) and every module in one list of about 700 record types. These give each app a module name in words
 * (several apps fold into one module: Leave, Assets, Projects …), a record-type label in words, and the technical apps
 * that a company administrator never assigns.
 */
export const PERM_APP_LABELS: Record<string, string> = {
  AssetPlus: 'Assets', ZeoAssets: 'Assets', OrganisationManager: 'Organisation', OrgStructure: 'Organisation',
  AttendancePlus: 'Time and attendance', ShiftPlanner: 'Shift planner', PerformanceManagement: 'Performance',
  RecruitmentManagement: 'Recruitment', LearningPlus: 'Learning', LearningManagement: 'Learning', ExpenseManagement: 'Expenses',
  PayrollPlus: 'Payroll', PayrollManagement: 'Payroll', LeavePolicy: 'Leave', calendars: 'Leave', EmpManagement: 'Employees',
  EmployeeProfile: 'Employees', ZeoPeople: 'Employees', ZeoHR: 'Employees', HRActions: 'HR actions', UserManagement: 'Users and rights',
  ZeoInvites: 'Users and rights', permissions: 'Users and rights', CountryPack: 'Country settings', LanguagePack: 'Languages',
  Translations: 'Languages', DataTools: 'Customisation', ZeoMasters: 'Customisation', PrintTemplates: 'Print templates',
  DashboardManagement: 'Dashboards and reports', ZeoInsights: 'Dashboards and reports', SelfService: 'Self service',
  ZeoHSE: 'HSE', ZeoCRM: 'CRM', ZeoProjects: 'Projects', ProjectManagement: 'Projects', ProjectControl: 'Projects',
  ZeoMaintenance: 'Maintenance', ZeoProperty: 'Property', ZeoGroup: 'Company group', ZeoApps: 'Apps', ZeoAccounting: 'Accounting',
  ZeoAdmin: 'Administration', AISettings: 'AI', ZeoAI: 'AI', ZeoFlow: 'Automation', Core: 'Company data',
};

/** Framework tables – nothing a company administrator assigns. */
export const PERM_TECHNICAL = new Set(['admin', 'auth', 'authtoken', 'contenttypes', 'sessions', 'django_celery_beat', 'django_celery_results',
  'token_blacklist', 'tenants', 'ZeoCloud', 'ZeoLicence', 'ZeoMobile', 'Chatter', 'SavedViews', 'AccessControl', 'otp', 'sites',
  'oauth2_provider', 'otp_totp', 'otp_static', 'django_otp', 'axes', 'silk', 'django_tenants']);

/** "ZeoAccounting" → "Accounting", "PrintTemplates" → "Print templates", "my_app" → "My app". */
export function words(s: string): string {
  const t = String(s || '').replace(/^Zeo(?=[A-Z])/, '').replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim().toLowerCase();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
}

export function permAppLabel(app: string): string { return PERM_APP_LABELS[app] || words(app); }

/** Record-type label from the permission's name ("Can add asset type config" → "Asset type config"); a name that is a
 *  code (no spaces: "lvbalancereport", "emp_master") is turned into words. */
export function permModelLabel(name: string, model: string): string {
  let l = String(name || '').replace(/^Can (add|change|delete|view|import|export|approve|run|manage)\s+/i, '').trim();
  if (!l || !/\s/.test(l)) { l = words(l || model); }
  l = l.replace(/\bemp\b/gi, 'employee').replace(/\bmstr\b/gi, 'master').replace(/\blv\b/gi, 'leave');
  return l.charAt(0).toUpperCase() + l.slice(1);
}
