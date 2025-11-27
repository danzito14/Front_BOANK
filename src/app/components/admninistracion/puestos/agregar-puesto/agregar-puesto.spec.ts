import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarPuesto } from './agregar-puesto';

describe('AgregarPuesto', () => {
  let component: AgregarPuesto;
  let fixture: ComponentFixture<AgregarPuesto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarPuesto]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarPuesto);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
