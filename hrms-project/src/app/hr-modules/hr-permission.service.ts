import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { DesignationService } from '../designation-master/designation.service';

export interface ModelPerms { view: boolean; add: boolean; change: boolean; delete: boolean; }

/**
 * Same rules as the existing *-options components: superusers see everything,
 * other users get what their permission groups allow (view_<model>, add_<model> ...).
 * Server-side checks are the real guard; this only hides buttons.
 */
@Injectable({ providedIn: 'root' })
export class HrPermissionService {
  private state$?: Observable<{ superuser: boolean; codes: Set<string> }>;

  constructor(private auth: AuthenticationService, private session: SessionService, private designations: DesignationService) {}

  private load(): Observable<{ superuser: boolean; codes: Set<string> }> {
    if (!this.state$) {
      const userId = this.session.getUserId();
      const schema = this.auth.getSelectedSchema() || '';
      this.state$ = (userId === null ? of({ is_superuser: false }) : this.auth.getUserData(userId)).pipe(
        switchMap((u: any) => {
          if (u?.is_superuser) return of({ superuser: true, codes: new Set<string>() });
          return this.designations.getDesignationsPermission(schema).pipe(
            map((data: any) => {
              const first = Array.isArray(data) && data.length ? data[0] : null;
              if (first?.is_superuser) return { superuser: true, codes: new Set<string>() };
              const codes = new Set<string>((first?.groups || []).flatMap((g: any) => (g.permissions || []).map((p: any) => p.codename)));
              return { superuser: false, codes };
            })
          );
        }),
        catchError(() => of({ superuser: false, codes: new Set<string>() })),
        shareReplay(1)
      );
    }
    return this.state$;
  }

  reset(): void {
    this.state$ = undefined;
  }

  can(model: string): Observable<ModelPerms> {
    return this.load().pipe(map(s => ({
      view: s.superuser || s.codes.has('view_' + model),
      add: s.superuser || s.codes.has('add_' + model),
      change: s.superuser || s.codes.has('change_' + model),
      delete: s.superuser || s.codes.has('delete_' + model),
    })));
  }

  isSuperuser(): Observable<boolean> {
    return this.load().pipe(map(s => s.superuser));
  }

  /** For menus: visible when the user can view the model or the item is self-service. */
  canView(model: string | undefined, selfService = false): Observable<boolean> {
    if (!model || selfService) return of(true);
    return this.can(model).pipe(map(p => p.view));
  }
}
