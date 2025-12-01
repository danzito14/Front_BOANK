import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarMesa } from './editar-mesa';

describe('EditarMesa', () => {
  let component: EditarMesa;
  let fixture: ComponentFixture<EditarMesa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarMesa]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarMesa);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
