import { Pipe, PipeTransform, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Pipe({
  name: 'money',
  standalone: true,
  pure: false
})
export class MoneyPipe implements PipeTransform {
  private auth?: AuthService | null;

  constructor(auth?: AuthService | null) {
    if (auth !== undefined) {
      this.auth = auth;
    } else {
      try {
        this.auth = inject(AuthService, { optional: true });
      } catch {
        this.auth = null;
      }
    }
  }

  transform(cents: number | null | undefined, symbolOverride?: string): string {
    const symbol = symbolOverride || this.auth?.businessSettings()?.currency_symbol || '₹';
    if (cents === null || cents === undefined || isNaN(cents)) {
      return `${symbol}0.00`;
    }
    const amount = cents / 100;
    return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
