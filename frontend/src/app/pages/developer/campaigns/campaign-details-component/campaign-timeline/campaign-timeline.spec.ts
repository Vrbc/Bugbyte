import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampaignTimeline } from './campaign-timeline';

describe('CampaignTimeline', () => {
  let component: CampaignTimeline;
  let fixture: ComponentFixture<CampaignTimeline>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampaignTimeline],
    }).compileComponents();

    fixture = TestBed.createComponent(CampaignTimeline);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
