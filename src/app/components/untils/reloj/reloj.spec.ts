import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Reloj } from './reloj';

describe('Reloj', () => {
  let component: Reloj;
  let fixture: ComponentFixture<Reloj>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reloj]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Reloj);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
