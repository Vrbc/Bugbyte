import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackBytesService } from './feedback-bytes.service';

describe('FeedbackBytesService', () => {
  let service: FeedbackBytesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedbackBytesService],
    }).compile();

    service = module.get<FeedbackBytesService>(FeedbackBytesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
