import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeveloperSessionReviewComponent } from './developer-session-review-component';

describe('DeveloperSessionReviewComponent', () => {
  let component: DeveloperSessionReviewComponent;
  let fixture: ComponentFixture<DeveloperSessionReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeveloperSessionReviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DeveloperSessionReviewComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
