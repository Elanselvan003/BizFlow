import { TestBed } from '@angular/core/testing';
import { TranslatePipe } from './translate.pipe';
import { TranslationService } from '../../core/services/translation.service';

describe('TranslatePipe', () => {
  let pipe: TranslatePipe;
  let service: TranslationService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [TranslationService, TranslatePipe]
    });
    service = TestBed.inject(TranslationService);
    pipe = TestBed.inject(TranslatePipe);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should transform keys to English text', () => {
    expect(pipe.transform('nav.dashboard')).toBe('Dashboard');
    expect(pipe.transform('nav.finance')).toBe('Finance & Analytics');
  });

  it('should handle unmapped keys gracefully by returning key name', () => {
    expect(pipe.transform('some.random.key')).toBe('some.random.key');
  });
});
