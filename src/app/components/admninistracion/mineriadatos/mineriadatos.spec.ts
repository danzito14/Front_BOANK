import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mineriadatos } from './mineriadatos';

describe('Mineriadatos', () => {
  let component: Mineriadatos;
  let fixture: ComponentFixture<Mineriadatos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mineriadatos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Mineriadatos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
