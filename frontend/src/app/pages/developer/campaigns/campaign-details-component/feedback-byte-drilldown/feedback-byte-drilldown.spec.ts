import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideState, provideStore } from '@ngrx/store';

import { feedbackBytesFeature } from '../../../../../core/feedback-bytes/state/feedback-bytes.reducer';
import { FeedbackByteDrilldown } from './feedback-byte-drilldown';

describe('FeedbackByteDrilldown', () => {
  let component: FeedbackByteDrilldown;
  let fixture: ComponentFixture<FeedbackByteDrilldown>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackByteDrilldown],
      providers: [provideStore(), provideState(feedbackBytesFeature)],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackByteDrilldown);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('campaignId', 'campaign-1');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
