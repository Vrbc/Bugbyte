import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-toggle-chip-group',
  imports: [],
  templateUrl: './toggle-chip-group.html',
  styleUrl: './toggle-chip-group.scss',
})
export class ToggleChipGroup {
  options = input.required<string[]>();
  selected = input.required<string[]>();
  toggleOption = output<string>();
}
