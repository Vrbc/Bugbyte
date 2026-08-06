import { TestBed } from '@angular/core/testing';

import { FeedbackBytesService } from './feedback-bytes.service';

describe('FeedbackBytesService', () => {
  let service: FeedbackBytesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FeedbackBytesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
