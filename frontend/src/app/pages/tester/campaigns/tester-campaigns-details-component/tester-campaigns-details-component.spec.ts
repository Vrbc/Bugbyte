import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TesterCampaignsDetailsComponent } from './tester-campaigns-details-component';

describe('TesterCampaignsDetailsComponent', () => {
  let component: TesterCampaignsDetailsComponent;
  let fixture: ComponentFixture<TesterCampaignsDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TesterCampaignsDetailsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TesterCampaignsDetailsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
