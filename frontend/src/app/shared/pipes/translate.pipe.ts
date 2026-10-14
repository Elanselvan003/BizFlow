import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';

@Pipe({
  name: 't',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private trans?: TranslationService | null;

  constructor(trans?: TranslationService | null) {
    if (trans !== undefined) {
      this.trans = trans;
    } else {
      try {
        this.trans = inject(TranslationService, { optional: true });
      } catch {
        this.trans = null;
      }
    }
  }

  transform(key: string): string {
    return this.trans ? this.trans.translate(key) : key;
  }
}
