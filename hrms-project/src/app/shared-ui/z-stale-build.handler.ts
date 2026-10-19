import { ErrorHandler, Injectable } from '@angular/core';

/**
 * v1.32.1 – After a deploy a browser that kept the previous index.html asks for bundles that no longer exist
 * ("ChunkLoadError", "Failed to fetch dynamically imported module", "Loading chunk … failed"). Instead of a blank screen or a
 * half-working old version, the page is reloaded once (the new index.html names the new bundles). Every other error is
 * logged as before.
 */
@Injectable()
export class ZStaleBuildHandler implements ErrorHandler {
  handleError(err: any): void {
    const msg = String(err?.message || err?.rejection?.message || err || '');
    if (/ChunkLoadError|Loading chunk [^ ]+ failed|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(msg)) {
      let n = 0;
      try { n = +(sessionStorage.getItem('zeoStaleReload') || '0'); } catch {}
      if (n < 2) {
        try { sessionStorage.setItem('zeoStaleReload', String(n + 1)); } catch {}
        location.reload();
        return;
      }
    }
    console.error(err);
  }
}
