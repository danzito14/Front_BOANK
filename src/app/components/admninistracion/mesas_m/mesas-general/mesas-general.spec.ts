import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MesasGeneral } from './mesas-general';

describe('MesasGeneral', () => {
  let component: MesasGeneral;
  let fixture: ComponentFixture<MesasGeneral>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesasGeneral]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MesasGeneral);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
