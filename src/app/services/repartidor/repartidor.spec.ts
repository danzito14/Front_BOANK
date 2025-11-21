import { TestBed } from '@angular/core/testing';

import { Repartidor } from './repartidor';

describe('Repartidor', () => {
  let service: Repartidor;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Repartidor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
