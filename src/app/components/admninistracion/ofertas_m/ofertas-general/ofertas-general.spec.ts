import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfertasGeneral } from './ofertas-general';

describe('OfertasGeneral', () => {
  let component: OfertasGeneral;
  let fixture: ComponentFixture<OfertasGeneral>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfertasGeneral]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfertasGeneral);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
