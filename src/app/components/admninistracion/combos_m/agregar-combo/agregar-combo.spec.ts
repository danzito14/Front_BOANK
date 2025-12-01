import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarCombo } from './agregar-combo';

describe('AgregarCombo', () => {
  let component: AgregarCombo;
  let fixture: ComponentFixture<AgregarCombo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarCombo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarCombo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
