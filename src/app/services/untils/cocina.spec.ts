import { TestBed } from '@angular/core/testing';

import { Cocina } from './cocina';

describe('Cocina', () => {
  let service: Cocina;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Cocina);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
