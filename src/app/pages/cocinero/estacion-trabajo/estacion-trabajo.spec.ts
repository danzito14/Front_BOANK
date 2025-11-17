import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstacionTrabajo } from './estacion-trabajo';

describe('EstacionTrabajo', () => {
  let component: EstacionTrabajo;
  let fixture: ComponentFixture<EstacionTrabajo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstacionTrabajo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstacionTrabajo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
