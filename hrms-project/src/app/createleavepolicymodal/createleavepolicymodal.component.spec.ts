import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateleavepolicymodalComponent } from './createleavepolicymodal.component';

describe('CreateleavepolicymodalComponent', () => {
  let component: CreateleavepolicymodalComponent;
  let fixture: ComponentFixture<CreateleavepolicymodalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateleavepolicymodalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateleavepolicymodalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
