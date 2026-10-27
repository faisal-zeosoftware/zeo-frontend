/**
 * v1.62.0 release checklist Part C §37 "Menu by rights": a page opened by typing its address is refused when its menu entry is
 * hidden for the user. The same check that hides the menu entries (menu-config itemVisible on the user's rights from
 * ZListService.permissions) decides; the server still refuses or limits the data as before.
 * - Only exact menu addresses are checked (the list / screen of a menu entry). Record pages and other deep links
 *   (an employee's own record from Self service, a manager opening a team member) are not menu entries and stay open.
 * - An address listed in several places opens when any of its entries is visible to the user (e.g. "My leave" in My work).
 * - Entries without perms, personal pages (Home, Self service, My …) and company administrators / superusers: always open.
 * - Refused: the "no access" page is shown in the app (the address bar keeps the typed address).
 */
import { inject } from '@angular/core';
import { Location } from '@angular/common';
import { CanActivateChildFn, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, take, timeout } from 'rxjs/operators';
import { ALL_APPS, MenuItem, itemVisible } from './menu-config';
import { ZListService } from './z-list.service';

// v1.62.0 personal pages – never refused (they show the user's own data)
const PERSONAL = /^\/main-sidebar\/(home|todo|wall|inbox|my-[\w-]+|self-service\/(home|profile|my-requests|documents|letters|leave|payslips|claims)|_reload|no-access)(\/|$)/;

function clean(url: string): string { return (url || '').split('?')[0].split('#')[0].replace(/\/+$/, ''); }

// v1.62.0 menu entries by address (built once)
let BY_LINK: Map<string, MenuItem[]> | null = null;
function entriesFor(url: string): MenuItem[] {
  if (!BY_LINK) {
    BY_LINK = new Map();
    for (const app of ALL_APPS) {
      for (const s of app.sections || []) {
        for (const it of s.items) { const k = clean(it.link); BY_LINK.set(k, [...(BY_LINK.get(k) || []), it]); }
      }
    }
  }
  return BY_LINK.get(url) || [];
}

/** v1.62.0: may the user open this address? null = not a guarded address (no menu entry with perms) */
export function menuRefusal(url: string, access: { admin: boolean; codes: Set<string> } | null): MenuItem | null {
  const u = clean(url);
  if (PERSONAL.test(u)) { return null; }
  const items = entriesFor(u);
  if (!items.length || items.some(i => !i.perms || !i.perms.length)) { return null; }
  if (access && access.admin) { return null; }
  return items.some(i => itemVisible(i.perms, access, i.link)) ? null : items[0];
}

export const menuRightsGuard: CanActivateChildFn = (_route, state): Observable<boolean> | boolean => {
  const url = state.url;
  const u = clean(url);
  if (PERSONAL.test(u)) { return true; }
  const items = entriesFor(u);
  if (!items.length || items.some(i => !i.perms || !i.perms.length)) { return true; }
  if (!localStorage.getItem('selectedSchema')) { return true; }   // no company picked yet – the page itself sends the user on
  const zlist = inject(ZListService), router = inject(Router), location = inject(Location);
  return zlist.permissions().pipe(
    take(1), timeout(20000),
    map(access => {
      const refused = menuRefusal(u, access);
      if (!refused) { return true; }
      // v1.62.0: show "no access" in the app; keep the typed address in the address bar
      router.navigateByUrl('/main-sidebar/no-access', { skipLocationChange: true, state: { page: refused.label, url } })
        .then(ok => { if (ok) { location.replaceState(url); } });
      return false;
    }),
    catchError(() => of(true)),   // rights could not be read: the server still refuses the data
  );
};
