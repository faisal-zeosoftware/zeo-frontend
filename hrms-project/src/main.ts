import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { installToasts } from './app/shared-ui/z-toast';

installToasts();   // v1.19.0: messages as toasts instead of the browser's alert box

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
