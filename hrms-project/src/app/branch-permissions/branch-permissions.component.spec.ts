import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BranchPermissionsComponent } from './branch-permissions.component';

describe('BranchPermissionsComponent', () => {
  let component: BranchPermissionsComponent;
  let fixture: ComponentFixture<BranchPermissionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BranchPermissionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BranchPermissionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
