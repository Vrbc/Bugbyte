import { Component, computed, input } from '@angular/core';
import { FeedbackByte, FeedbackType } from '../../../core/feedback-bytes/feedback-bytes.models';
import { ResolveUploadUrlPipe } from '../../../core/uploads/resolve-upload-url.pipe';
import { StatusBadge } from '../status-badge/status-badge';

const DOT_CLASSES: Record<FeedbackType, string> = {
  BUG: 'bg-bug',
  CONFUSION: 'bg-confused',
  SUGGESTION: 'bg-purple',
  POSITIVE: 'bg-positive',
  DIFFICULTY_SPIKE: 'bg-warning',
  COMMENT: 'bg-on-surface-variant',
};

@Component({
  selector: 'app-feedback-byte-item',
  imports: [ResolveUploadUrlPipe, StatusBadge],
  templateUrl: './feedback-byte-item.html',
  styleUrl: './feedback-byte-item.scss',
})
export class FeedbackByteItem {
  byte = input.required<FeedbackByte>();
  isLast = input(false);

  protected readonly dotClasses = computed(() => DOT_CLASSES[this.byte().type]);

  protected readonly formattedTime = computed(() => {
    const totalSeconds = this.byte().timestampSeconds;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });
}
