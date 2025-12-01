import { TestBed } from '@angular/core/testing';

import { MesasService } from './mesas';

describe('Mesas', () => {
  let service: MesasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MesasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
