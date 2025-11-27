import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatillosGeneral } from './platillos-general';

describe('PlatillosGeneral', () => {
  let component: PlatillosGeneral;
  let fixture: ComponentFixture<PlatillosGeneral>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatillosGeneral]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlatillosGeneral);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
