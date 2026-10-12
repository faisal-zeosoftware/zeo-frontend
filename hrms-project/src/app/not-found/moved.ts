import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Route, Router } from '@angular/router';

/**
 * v1.15.1 – a page that moved to another module. Angular 17 drops the query string on an absolute `redirectTo`,
 * so the old address is a route whose guard sends the browser to the new address WITH the query string and fragment
 * (old bookmarks such as …/asset-options/asset-master?asset=3 keep working).
 *   moved('asset-master', '/main-sidebar/asset-plus/register')
 */
export function moved(path: string, to: string): Route {
  const go: CanActivateFn = (r: ActivatedRouteSnapshot) =>
    inject(Router).createUrlTree([to], { queryParams: r.queryParams, fragment: r.fragment ?? undefined });
  return { path, pathMatch: 'full', canActivate: [go], children: [] };
}
