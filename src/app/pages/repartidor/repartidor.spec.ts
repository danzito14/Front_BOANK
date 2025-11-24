import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Repartidor } from './repartidor';

describe('Repartidor', () => {
  let component: Repartidor;
  let fixture: ComponentFixture<Repartidor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Repartidor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Repartidor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
