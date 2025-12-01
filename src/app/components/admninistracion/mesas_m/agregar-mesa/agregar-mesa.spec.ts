import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarMesa } from './agregar-mesa';

describe('AgregarMesa', () => {
  let component: AgregarMesa;
  let fixture: ComponentFixture<AgregarMesa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarMesa]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarMesa);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
