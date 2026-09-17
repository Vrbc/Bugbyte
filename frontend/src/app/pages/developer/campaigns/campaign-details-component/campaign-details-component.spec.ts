import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideState, provideStore } from '@ngrx/store';

import { feedbackBytesFeature } from '../../../../core/feedback-bytes/state/feedback-bytes.reducer';
import { CampaignDetailsComponent } from './campaign-details-component';

describe('CampaignDetailsComponent', () => {
  let component: CampaignDetailsComponent;
  let fixture: ComponentFixture<CampaignDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampaignDetailsComponent],
      providers: [provideStore(), provideState(feedbackBytesFeature)],
    }).compileComponents();

    fixture = TestBed.createComponent(CampaignDetailsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
