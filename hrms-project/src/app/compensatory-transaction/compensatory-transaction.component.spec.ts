import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompensatoryTransactionComponent } from './compensatory-transaction.component';

describe('CompensatoryTransactionComponent', () => {
  let component: CompensatoryTransactionComponent;
  let fixture: ComponentFixture<CompensatoryTransactionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CompensatoryTransactionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CompensatoryTransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
