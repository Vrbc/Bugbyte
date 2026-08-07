import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TesterSessionsComponent } from './tester-sessions-component';

describe('TesterSessionsComponent', () => {
  let component: TesterSessionsComponent;
  let fixture: ComponentFixture<TesterSessionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TesterSessionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TesterSessionsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
