import { TestBed } from '@angular/core/testing';

import { Webhook } from './webhook';

describe('Webhook', () => {
  let service: Webhook;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Webhook);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
