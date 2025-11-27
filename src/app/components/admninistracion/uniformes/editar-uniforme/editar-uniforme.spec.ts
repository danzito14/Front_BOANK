import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarUniforme } from './editar-uniforme';

describe('EditarUniforme', () => {
  let component: EditarUniforme;
  let fixture: ComponentFixture<EditarUniforme>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarUniforme]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarUniforme);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
