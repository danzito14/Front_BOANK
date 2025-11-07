import { TestBed } from '@angular/core/testing';

import { UntilsPedido } from './untils-pedido';

describe('UntilsPedido', () => {
  let service: UntilsPedido;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UntilsPedido);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
