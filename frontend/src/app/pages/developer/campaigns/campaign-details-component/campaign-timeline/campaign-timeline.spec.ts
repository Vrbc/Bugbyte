import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideState, provideStore } from '@ngrx/store';

import { feedbackBytesFeature } from '../../../../../core/feedback-bytes/state/feedback-bytes.reducer';
import { CampaignTimeline } from './campaign-timeline';

describe('CampaignTimeline', () => {
  let component: CampaignTimeline;
  let fixture: ComponentFixture<CampaignTimeline>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampaignTimeline],
      providers: [provideStore(), provideState(feedbackBytesFeature)],
    }).compileComponents();

    fixture = TestBed.createComponent(CampaignTimeline);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('campaignId', 'campaign-1');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
