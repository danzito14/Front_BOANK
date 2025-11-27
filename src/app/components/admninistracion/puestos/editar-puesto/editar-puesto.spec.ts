import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarPuesto } from './editar-puesto';

describe('EditarPuesto', () => {
  let component: EditarPuesto;
  let fixture: ComponentFixture<EditarPuesto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarPuesto]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarPuesto);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
