import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpleadosGeneral } from './empleados-general';

describe('EmpleadosGeneral', () => {
  let component: EmpleadosGeneral;
  let fixture: ComponentFixture<EmpleadosGeneral>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmpleadosGeneral]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmpleadosGeneral);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
