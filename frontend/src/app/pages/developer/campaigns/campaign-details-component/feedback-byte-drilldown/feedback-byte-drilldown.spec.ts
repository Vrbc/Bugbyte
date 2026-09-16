import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedbackByteDrilldown } from './feedback-byte-drilldown';

describe('FeedbackByteDrilldown', () => {
  let component: FeedbackByteDrilldown;
  let fixture: ComponentFixture<FeedbackByteDrilldown>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackByteDrilldown],
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
