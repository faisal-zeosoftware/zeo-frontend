import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthenticationService } from './login/authentication.service';
import { FormSettingsService } from './shared-ui/form-settings.service';
import { ZRecordInjector } from './shared-ui/z-record-injector.service';
import { ZRecordService } from './shared-ui/z-record.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'hrms-project';


  constructor(private auth: AuthenticationService, router: Router, formSettings: FormSettingsService, injector: ZRecordInjector, rec: ZRecordService) {
    // the company's form designer settings (labels, mandatory, hidden fields) for every user and browser
    router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => formSettings.pull());
    // v1.7.0: notes, activities, files, history and extra fields inside every form; To-do count in the top bar
    injector.start();
    let last = 0;
    router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => { if (Date.now() - last > 60000) { last = Date.now(); rec.refreshTodo(); } });
  }

ngOnInit() {
  // if (this.auth.isTokenExpired()) {
  //   this.auth.logout(); // auto remove expired tokens on page refresh
  // }
}






  onsubmit() {
    // Add the logic you want to execute when the form is submitted
  }
  data: any = {}; // Assuming data is an object with a userName property

  // Other properties and methods may be present
}
