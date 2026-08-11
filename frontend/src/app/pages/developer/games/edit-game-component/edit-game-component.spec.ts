import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditGameComponent } from './edit-game-component';

describe('EditGameComponent', () => {
  let component: EditGameComponent;
  let fixture: ComponentFixture<EditGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditGameComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditGameComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
