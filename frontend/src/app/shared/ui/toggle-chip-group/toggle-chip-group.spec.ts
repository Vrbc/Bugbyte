import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToggleChipGroup } from './toggle-chip-group';

describe('ToggleChipGroup', () => {
  let component: ToggleChipGroup;
  let fixture: ComponentFixture<ToggleChipGroup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToggleChipGroup],
    }).compileComponents();

    fixture = TestBed.createComponent(ToggleChipGroup);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', ['PC', 'Web']);
    fixture.componentRef.setInput('selected', []);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
