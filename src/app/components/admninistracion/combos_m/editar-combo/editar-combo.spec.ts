import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarCombo } from './editar-combo';

describe('EditarCombo', () => {
  let component: EditarCombo;
  let fixture: ComponentFixture<EditarCombo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarCombo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarCombo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
