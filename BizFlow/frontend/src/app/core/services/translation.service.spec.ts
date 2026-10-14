import { TestBed } from '@angular/core/testing';
import { TranslationService } from './translation.service';

describe('TranslationService', () => {
  let service: TranslationService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [TranslationService]
    });
    service = TestBed.inject(TranslationService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with English as the active language', () => {
    expect(service.currentLang()).toBe('en');
    expect(service.languages.length).toBe(1);
    expect(service.languages[0].code).toBe('en');
  });

  it('should translate keys correctly in English', () => {
    expect(service.translate('nav.dashboard')).toBe('Dashboard');
    expect(service.translate('nav.finance')).toBe('Finance & Analytics');
    expect(service.translate('nav.operations')).toBe('Operations');
    expect(service.translate('nav.customers')).toBe('Customers');
  });

  it('should persist english language setting to localStorage', () => {
    expect(localStorage.getItem('bizflow_lang')).toBe('en');
  });

  it('should fallback gracefully when key is missing', () => {
    expect(service.translate('unknown.missing.key')).toBe('unknown.missing.key');
  });
});
