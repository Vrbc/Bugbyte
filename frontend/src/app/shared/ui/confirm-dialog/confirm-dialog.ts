import { Component, input, output } from '@angular/core';
import { Button, ButtonVariant } from '../button/button';

@Component({
  selector: 'app-confirm-dialog',
  imports: [Button],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  open = input(false);
  title = input('');
  message = input('');
  confirmLabel = input('Confirm');
  cancelLabel = input('Cancel');
  variant = input<Extract<ButtonVariant, 'primary' | 'danger'>>('primary');

  confirmed = output<void>();
  cancelled = output<void>();
}
