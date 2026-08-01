import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeveloperGamesComponent } from './developer-games-component';

describe('DeveloperGamesComponent', () => {
  let component: DeveloperGamesComponent;
  let fixture: ComponentFixture<DeveloperGamesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeveloperGamesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DeveloperGamesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
