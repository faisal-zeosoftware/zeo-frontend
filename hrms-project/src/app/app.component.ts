import { Component } from '@angular/core';
import { AuthenticationService } from './login/authentication.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'hrms-project';


  constructor(private auth: AuthenticationService) {}

ngOnInit() {
  if (this.auth.isTokenExpired()) {
    this.auth.logout(); // auto remove expired tokens on page refresh
  }
}






  onsubmit() {
    // Add the logic you want to execute when the form is submitted
  }
  data: any = {}; // Assuming data is an object with a userName property

  // Other properties and methods may be present
}
