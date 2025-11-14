import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagarMesa } from './pagar-mesa';

describe('PagarMesa', () => {
  let component: PagarMesa;
  let fixture: ComponentFixture<PagarMesa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagarMesa]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagarMesa);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
