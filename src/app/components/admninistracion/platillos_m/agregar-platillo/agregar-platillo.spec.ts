import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarPlatillo } from './agregar-platillo';

describe('AgregarPlatillo', () => {
  let component: AgregarPlatillo;
  let fixture: ComponentFixture<AgregarPlatillo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarPlatillo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarPlatillo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
