import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarTipoPlatillo } from './editar-tipo-platillo';

describe('EditarTipoPlatillo', () => {
  let component: EditarTipoPlatillo;
  let fixture: ComponentFixture<EditarTipoPlatillo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarTipoPlatillo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarTipoPlatillo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
