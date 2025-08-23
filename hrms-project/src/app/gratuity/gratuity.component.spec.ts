import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GratuityComponent } from './gratuity.component';

describe('GratuityComponent', () => {
  let component: GratuityComponent;
  let fixture: ComponentFixture<GratuityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GratuityComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GratuityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
