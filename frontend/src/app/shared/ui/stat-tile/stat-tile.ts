import { Component, computed, input } from '@angular/core';

export type StatTileAccent = 'default' | 'cyan' | 'purple' | 'positive' | 'bug' | 'warning';

const ACCENT_TEXT: Record<StatTileAccent, string> = {
  default: 'text-on-background',
  cyan: 'text-cyan',
  purple: 'text-purple',
  positive: 'text-positive',
  bug: 'text-bug',
  warning: 'text-warning',
};

@Component({
  selector: 'app-stat-tile',
  imports: [],
  templateUrl: './stat-tile.html',
  styleUrl: './stat-tile.scss',
})
export class StatTile {
  icon = input<string>();
  label = input.required<string>();
  value = input.required<string | number>();
  accent = input<StatTileAccent>('default');
  live = input(false);

  protected readonly accentClasses = computed(() => ACCENT_TEXT[this.accent()]);
}
