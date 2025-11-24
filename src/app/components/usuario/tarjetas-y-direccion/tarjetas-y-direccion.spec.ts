import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarjetasYDireccion } from './tarjetas-y-direccion';

describe('TarjetasYDireccion', () => {
  let component: TarjetasYDireccion;
  let fixture: ComponentFixture<TarjetasYDireccion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetasYDireccion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TarjetasYDireccion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
