import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarOferta } from './agregar-oferta';

describe('AgregarOferta', () => {
  let component: AgregarOferta;
  let fixture: ComponentFixture<AgregarOferta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarOferta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarOferta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
