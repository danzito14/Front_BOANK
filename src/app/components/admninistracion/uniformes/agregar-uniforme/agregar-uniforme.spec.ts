import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarUniforme } from './agregar-uniforme';

describe('AgregarUniforme', () => {
  let component: AgregarUniforme;
  let fixture: ComponentFixture<AgregarUniforme>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarUniforme]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarUniforme);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
