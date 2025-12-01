import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarUsuarios } from './agregar-usuarios';

describe('AgregarUsuarios', () => {
  let component: AgregarUsuarios;
  let fixture: ComponentFixture<AgregarUsuarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarUsuarios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarUsuarios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
