import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCampaignComponent } from './create-campaign-component';

describe('CreateCampaignComponent', () => {
  let component: CreateCampaignComponent;
  let fixture: ComponentFixture<CreateCampaignComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateCampaignComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateCampaignComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
