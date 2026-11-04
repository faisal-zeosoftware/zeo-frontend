// v1.62.0 talent-ops: the first page of a Talent hub depends on who signs in – HR / L&D (who can see the model) land on the
// company view (data.hr), an employee on their own page (data.self). Before, HR landed on an empty "my" page or an error.
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HrPermissionService } from './hr-permission.service';

@Component({
  selector: 'app-hub-landing',
  standalone: true,
  template: `<p class="text-muted" style="padding:24px">Loading…</p>`,
})
export class HubLandingComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router, private perms: HrPermissionService) {}

  ngOnInit(): void {
    const d = this.route.snapshot.data;
    this.perms.can(d['model']).subscribe(p => {
      this.router.navigateByUrl(`${d['base']}/${p.view ? d['hr'] : d['self']}`, { replaceUrl: true });
    });
  }
}
