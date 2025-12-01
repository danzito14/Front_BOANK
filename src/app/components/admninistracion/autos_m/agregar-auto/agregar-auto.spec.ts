import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarAuto } from './agregar-auto';

describe('AgregarAuto', () => {
  let component: AgregarAuto;
  let fixture: ComponentFixture<AgregarAuto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarAuto]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarAuto);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
