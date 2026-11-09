/**
 * v1.23.0 – flags that menus and screens test with the same "country" expressions as the country pack:
 *   app:payroll   the app is active in the selected company (Settings → Apps)
 *   cloud:owner   the user owns the ZEO Cloud account of the selected company (Subscription, Security)
 *   cloud:linked  the company belongs to a ZEO Cloud account
 *   licence:admin the server is an Enterprise installation and the user is a server administrator (Settings → Licence)
 * Set by ZSuiteService (apps) and ZeoCloudService (cloud). Unknown while loading → apps shown, cloud items hidden.
 */
export const ZEO_FLAGS: { apps: string[] | null; cloudOwner: boolean; cloudLinked: boolean; licenceAdmin: boolean; payCycles: string[]; bareLogin: boolean } = { apps: null, cloudOwner: false, cloudLinked: false, licenceAdmin: false, payCycles: [], bareLogin: false };

/** true / false for app: and cloud: expressions, null for anything else (country features). */
export function flagAllows(k: string): boolean | null {
  // v1.67.8 (fixes) item 4: "app:payroll|property" – any of the apps is active
  if (k.startsWith('app:')) { const a = ZEO_FLAGS.apps; return !a || k.slice(4).split('|').some(x => a.includes(x)); }
  if (k === 'cloud:owner') { return ZEO_FLAGS.cloudOwner; }
  if (k === 'cloud:linked') { return ZEO_FLAGS.cloudLinked; }
  if (k === 'licence:admin') { return ZEO_FLAGS.licenceAdmin; }   // v1.28.0 Enterprise server, server administrator
  if (k === 'pay:cycles') { return ZEO_FLAGS.payCycles.length > 0; }   // v1.55.0 weekly / bi-weekly / semi-monthly switched on in Payroll controls
  if (k.startsWith('pay:')) { return ZEO_FLAGS.payCycles.includes(k.slice(4)); }
  return null;
}

/** An expression of only app: / cloud: parts (comma = and); country parts are left to the country pack. */
export function flagsVisible(expr: string | undefined): boolean {
  if (!expr) { return true; }
  return expr.split(',').map(s => s.trim()).filter(Boolean).every(e => {
    const neg = e.startsWith('!'); const k = neg ? e.slice(1).trim() : e;
    const f = flagAllows(k);
    return f === null ? true : (neg ? !f : f);
  });
}

/** v1.67.6 (setup) item 1: is the app active in the selected company? (true while not known, so nothing flickers away).
 *  The masters show the fields of an app only when it is active (HR: labour / establishment, probation, self service;
 *  Payroll: WPS, pension and insurance registrations). Hidden fields keep their values. */
export function appOn(key: string): boolean { const a = ZEO_FLAGS.apps; return !a || a.includes(key); }
