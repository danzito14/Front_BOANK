import { TestBed } from '@angular/core/testing';

import { Mineriadatos } from './mineriadatos';

describe('Mineriadatos', () => {
  let service: Mineriadatos;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Mineriadatos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
