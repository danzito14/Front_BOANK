import { TestBed } from '@angular/core/testing';

import { Automoviles } from './automoviles';

describe('Automoviles', () => {
  let service: Automoviles;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Automoviles);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
