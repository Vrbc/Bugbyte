import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-card',
  imports: [],
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class Card {
  hoverable = input(false);
  padded = input(true);

  protected readonly classes = computed(() => {
    const base = `rounded-card border border-border bg-level-1 overflow-hidden transition-all duration-300 ${this.padded() ? 'p-bb-sm' : ''}`;
    return this.hoverable() ? `${base} hover:-translate-y-0.5 hover:border-cyan` : base;
  });
}
