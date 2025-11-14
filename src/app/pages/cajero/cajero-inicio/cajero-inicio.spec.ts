import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CajeroInicio } from './cajero-inicio';

describe('CajeroInicio', () => {
  let component: CajeroInicio;
  let fixture: ComponentFixture<CajeroInicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CajeroInicio]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CajeroInicio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
