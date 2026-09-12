import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedbackByteItem } from './feedback-byte-item';

describe('FeedbackByteItem', () => {
  let component: FeedbackByteItem;
  let fixture: ComponentFixture<FeedbackByteItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackByteItem],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackByteItem);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('byte', {
      id: '1',
      sessionId: 's1',
      testerId: 't1',
      type: 'BUG',
      timestampSeconds: 65,
      comment: 'Test comment',
      createdAt: new Date().toISOString(),
    });
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
