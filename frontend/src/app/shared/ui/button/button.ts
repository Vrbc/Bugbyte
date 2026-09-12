import { Component, computed, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-linear-to-br from-cyan to-purple text-white hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(56,189,248,0.3)]',
  secondary:
    'bg-transparent border border-border text-on-background hover:-translate-y-0.5 hover:border-cyan hover:shadow-[0_0_10px_rgba(56,189,248,0.1)]',
  ghost: 'bg-transparent text-on-surface-variant hover:text-on-background',
  danger:
    'bg-transparent border border-border text-on-surface-variant hover:-translate-y-0.5 hover:border-bug hover:text-bug',
};

// Exported so non-<button> elements (e.g. an <a routerLink> styled as a CTA) can reuse the
// exact same look without duplicating the class string.
export function buttonClasses(variant: ButtonVariant = 'primary', fullWidth = false): string {
  return `inline-flex items-center justify-center gap-bb-xs rounded-sm px-bb-sm py-bb-xs font-body text-body-md font-semibold transition-all duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-50 ${fullWidth ? 'w-full' : ''} ${VARIANT_CLASSES[variant]}`;
}

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button {
  variant = input<ButtonVariant>('primary');
  disabled = input(false);
  type = input<'button' | 'submit' | 'reset'>('button');
  fullWidth = input(false);

  protected readonly classes = computed(() => buttonClasses(this.variant(), this.fullWidth()));
}
