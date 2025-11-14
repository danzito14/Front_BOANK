import { TestBed } from '@angular/core/testing';

import { ObtenerListas } from './obtener-listas';

describe('ObtenerListas', () => {
  let service: ObtenerListas;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ObtenerListas);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
