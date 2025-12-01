import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutosGeneral } from './autos-general';

describe('AutosGeneral', () => {
  let component: AutosGeneral;
  let fixture: ComponentFixture<AutosGeneral>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutosGeneral]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutosGeneral);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
