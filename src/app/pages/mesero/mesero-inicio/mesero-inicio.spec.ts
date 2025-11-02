import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeseroInicio } from './mesero-inicio';

describe('MeseroInicio', () => {
  let component: MeseroInicio;
  let fixture: ComponentFixture<MeseroInicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeseroInicio]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MeseroInicio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
