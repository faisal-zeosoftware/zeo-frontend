import { ZEmpIdentityComponent } from './z-emp-identity.component';
import { ZEmpEmergencyComponent } from './z-emp-emergency.component';
import { ZEmpExtrasComponent } from './z-emp-extras.component';
import { ZEmpEmploymentComponent } from './z-emp-employment.component';
import { ZEmpCompletenessComponent, ZEmpHistoryComponent, ZEmpSkillsComponent } from './z-emp-skills-history.component';
import { ZEmpProfileFieldsComponent } from './z-emp-profile-fields.component';

/** v1.13.0 – standalone pieces used on the employee screens (imported once into AppModule). */
export const EMPLOYEE_PROFILE_COMPONENTS = [
  ZEmpIdentityComponent, ZEmpEmergencyComponent, ZEmpExtrasComponent, ZEmpEmploymentComponent,
  ZEmpSkillsComponent, ZEmpHistoryComponent, ZEmpCompletenessComponent, ZEmpProfileFieldsComponent,
];

export { ZEmpIdentityComponent, ZEmpEmergencyComponent, ZEmpExtrasComponent, ZEmpEmploymentComponent, ZEmpSkillsComponent, ZEmpHistoryComponent,
         ZEmpCompletenessComponent, ZEmpProfileFieldsComponent };
