import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TesterCampaignsComponent } from './tester-campaigns-component';

describe('TesterCampaignsComponent', () => {
  let component: TesterCampaignsComponent;
  let fixture: ComponentFixture<TesterCampaignsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TesterCampaignsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TesterCampaignsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
