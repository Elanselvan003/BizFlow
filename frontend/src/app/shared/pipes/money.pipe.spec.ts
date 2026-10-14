import { TestBed } from '@angular/core/testing';
import { MoneyPipe } from './money.pipe';

describe('MoneyPipe', () => {
  let pipe: MoneyPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MoneyPipe]
    });
    pipe = TestBed.inject(MoneyPipe);
  });

  it('should format cents into standard Rupees (₹) currency format', () => {
    expect(pipe.transform(15000)).toBe('₹150.00');
    expect(pipe.transform(4999)).toBe('₹49.99');
    expect(pipe.transform(0)).toBe('₹0.00');
  });

  it('should support custom currency symbols override', () => {
    expect(pipe.transform(25000, '₹')).toBe('₹250.00');
    expect(pipe.transform(10000, '$')).toBe('$100.00');
    expect(pipe.transform(5000, '€')).toBe('€50.00');
  });

  it('should handle null, undefined, or NaN safely', () => {
    expect(pipe.transform(null)).toBe('₹0.00');
    expect(pipe.transform(undefined)).toBe('₹0.00');
    expect(pipe.transform(NaN)).toBe('₹0.00');
  });
});
