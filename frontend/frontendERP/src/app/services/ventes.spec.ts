import { TestBed } from '@angular/core/testing';

import { Ventes } from './ventes';

describe('Ventes', () => {
  let service: Ventes;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Ventes);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
