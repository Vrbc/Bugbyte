import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TesterApplicationsComponent } from './tester-applications-component';

describe('TesterApplicationsComponent', () => {
  let component: TesterApplicationsComponent;
  let fixture: ComponentFixture<TesterApplicationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TesterApplicationsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TesterApplicationsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
