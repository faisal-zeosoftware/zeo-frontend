import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EndOfServiceComponent } from './end-of-service.component';

describe('EndOfServiceComponent', () => {
  let component: EndOfServiceComponent;
  let fixture: ComponentFixture<EndOfServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EndOfServiceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EndOfServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
