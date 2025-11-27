import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarEmpleado } from './agregar-empleado';

describe('AgregarEmpleado', () => {
  let component: AgregarEmpleado;
  let fixture: ComponentFixture<AgregarEmpleado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarEmpleado]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarEmpleado);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
