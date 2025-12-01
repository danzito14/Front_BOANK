import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarUsuarios } from './editar-usuarios';

describe('EditarUsuarios', () => {
  let component: EditarUsuarios;
  let fixture: ComponentFixture<EditarUsuarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarUsuarios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarUsuarios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
