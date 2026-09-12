import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-select',
  imports: [],
  templateUrl: './select.html',
  styleUrl: './select.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Select),
      multi: true,
    },
  ],
})
export class Select implements ControlValueAccessor, AfterViewInit, OnDestroy {
  label = input<string>();
  hint = input<string>();

  protected value = signal('');
  protected disabled = signal(false);

  private readonly selectRef = viewChild.required<ElementRef<HTMLSelectElement>>('selectEl');
  private optionsObserver?: MutationObserver;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // <option>s are projected by the consumer and can arrive asynchronously (e.g. a
    // dependent "build" select loaded after its "game" select) — a plain [value] binding
    // silently fails to select an option that doesn't exist in the DOM yet, and Angular
    // never re-applies it once the option shows up. Re-sync imperatively whenever this
    // component re-renders...
    effect(() => {
      const currentValue = this.value();
      this.selectRef().nativeElement.value = currentValue;
    });
  }

  ngAfterViewInit(): void {
    // ...and also when the projected <option> list itself changes, since that alone
    // doesn't re-run the effect above.
    const el = this.selectRef().nativeElement;
    this.optionsObserver = new MutationObserver(() => {
      el.value = this.value();
    });
    this.optionsObserver.observe(el, { childList: true });
  }

  ngOnDestroy(): void {
    this.optionsObserver?.disconnect();
  }

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

  protected onSelectChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.value.set(value);
    this.onChange(value);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
