import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pagar } from './pagar';

describe('Pagar', () => {
  let component: Pagar;
  let fixture: ComponentFixture<Pagar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pagar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Pagar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
