import { TestBed } from '@angular/core/testing';

import { SessionSocketService } from './session-socket.service';

describe('SessionSocketService', () => {
  let service: SessionSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionSocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
