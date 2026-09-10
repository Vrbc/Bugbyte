import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({
  name: 'resolveUploadUrl',
})
export class ResolveUploadUrlPipe implements PipeTransform {
  transform(value: string | null | undefined): string | null | undefined {
    if (!value) {
      return value;
    }

    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }

    return `${environment.wsUrl}${value}`;
  }
}
