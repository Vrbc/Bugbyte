import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-card',
  imports: [],
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class Card {
  hoverable = input(false);

  protected readonly classes = computed(() => {
    const base = 'rounded-card border border-border bg-level-1 p-bb-sm transition-all duration-300';
    return this.hoverable()
      ? `${base} hover:-translate-y-0.5 hover:border-cyan`
      : base;
  });
}
