import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CombosGeneral } from './combos-general';

describe('CombosGeneral', () => {
  let component: CombosGeneral;
  let fixture: ComponentFixture<CombosGeneral>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CombosGeneral]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CombosGeneral);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
