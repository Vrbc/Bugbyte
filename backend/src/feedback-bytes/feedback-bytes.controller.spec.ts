import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackBytesController } from './feedback-bytes.controller';

describe('FeedbackBytesController', () => {
  let controller: FeedbackBytesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackBytesController],
    }).compile();

    controller = module.get<FeedbackBytesController>(FeedbackBytesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
