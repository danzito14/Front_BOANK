import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarEmpleado } from './editar-empleado';

describe('EditarEmpleado', () => {
  let component: EditarEmpleado;
  let fixture: ComponentFixture<EditarEmpleado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarEmpleado]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarEmpleado);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
