import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TesterDashboard } from './tester-dashboard';

describe('TesterDashboard', () => {
  let component: TesterDashboard;
  let fixture: ComponentFixture<TesterDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TesterDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(TesterDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
