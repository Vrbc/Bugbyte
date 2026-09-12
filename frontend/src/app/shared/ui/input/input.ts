import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'url';

@Component({
  selector: 'app-input',
  imports: [],
  templateUrl: './input.html',
  styleUrl: './input.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Input),
      multi: true,
    },
  ],
})
export class Input implements ControlValueAccessor {
  label = input<string>();
  type = input<InputType>('text');
  icon = input<string>();
  placeholder = input('');
  required = input(false);
  error = input<string>();
  multiline = input(false);
  rows = input(3);

  protected value = signal('');
  protected disabled = signal(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.value.set(value);
    this.onChange(value);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  protected readonly inputClasses = computed(() => {
    const base =
      'w-full rounded-sm bg-level-1 border border-border py-bb-xs pr-bb-sm font-body text-body-md text-on-background placeholder:text-on-surface-variant focus:border-cyan focus:shadow-[0_0_10px_rgba(56,189,248,0.2)] focus:outline-none disabled:opacity-50';
    return this.icon() ? `${base} pl-8` : `${base} pl-bb-sm`;
  });
}
