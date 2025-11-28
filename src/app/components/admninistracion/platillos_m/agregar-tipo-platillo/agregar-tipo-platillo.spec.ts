import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarTipoPlatillo } from './agregar-tipo-platillo';

describe('AgregarTipoPlatillo', () => {
  let component: AgregarTipoPlatillo;
  let fixture: ComponentFixture<AgregarTipoPlatillo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarTipoPlatillo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarTipoPlatillo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
