import i18n from 'i18n-js';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from '../locales/en.json';
import ar from '../locales/ar.json';

// Configure i18n
i18n.translations = {
  en,
  ar,
};

// Set default locale
i18n.defaultLocale = 'en';
i18n.locale = 'en';

// Enable fallbacks
i18n.fallbacks = true;

// RTL support
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  isRTL: boolean;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    isRTL: false,
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    isRTL: true,
  },
];

class I18nService {
  private static instance: I18nService;
  private currentLanguage: string = 'en';

  private constructor() {
    this.initializeLanguage();
  }

  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService();
    }
    return I18nService.instance;
  }

  private async initializeLanguage(): Promise<void> {
    try {
      const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
      if (savedLanguage && this.isLanguageSupported(savedLanguage)) {
        await this.setLanguage(savedLanguage);
      } else {
        // Use device language if supported, otherwise default to English
        const deviceLanguage = this.getDeviceLanguage();
        if (this.isLanguageSupported(deviceLanguage)) {
          await this.setLanguage(deviceLanguage);
        } else {
          await this.setLanguage('en');
        }
      }
    } catch (error) {
      console.error('Error initializing language:', error);
      await this.setLanguage('en');
    }
  }

  private getDeviceLanguage(): string {
    // Get device language from React Native
    const deviceLanguage = require('react-native').NativeModules.SettingsManager?.settings?.AppleLocale ||
                          require('react-native').NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
                          'en';
    
    // Extract language code (e.g., 'en-US' -> 'en')
    return deviceLanguage.split('-')[0].split('_')[0];
  }

  private isLanguageSupported(languageCode: string): boolean {
    return SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode);
  }

  public async setLanguage(languageCode: string): Promise<void> {
    try {
      if (!this.isLanguageSupported(languageCode)) {
        throw new Error(`Language ${languageCode} is not supported`);
      }

      // Set i18n locale
      i18n.locale = languageCode;
      this.currentLanguage = languageCode;

      // Set RTL direction
      const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
      if (language) {
        I18nManager.forceRTL(language.isRTL);
      }

      // Save to storage
      await AsyncStorage.setItem('selectedLanguage', languageCode);

      console.log(`Language changed to: ${languageCode}`);
    } catch (error) {
      console.error('Error setting language:', error);
      throw error;
    }
  }

  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  public getSupportedLanguages(): Language[] {
    return SUPPORTED_LANGUAGES;
  }

  public isRTL(): boolean {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === this.currentLanguage);
    return language?.isRTL || false;
  }

  public t(key: string, options?: any): string {
    return i18n.t(key, options);
  }

  public formatCurrency(amount: number, region: string = 'INDIA'): string {
    const isArabic = this.currentLanguage === 'ar';
    const currencyMap = {
      'INDIA': { currency: 'INR', locale: isArabic ? 'ar-IN' : 'en-IN' },
      'UAE': { currency: 'AED', locale: isArabic ? 'ar-AE' : 'en-AE' },
      'SAUDI': { currency: 'SAR', locale: 'ar-SA' },
      'QATAR': { currency: 'QAR', locale: isArabic ? 'ar-QA' : 'en-QA' }
    } as const;

    const config = currencyMap[region as keyof typeof currencyMap] || currencyMap.INDIA;

    const formatter = new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
    });
    return formatter.format(amount);
  }

  public formatNumber(number: number, region: string = 'INDIA'): string {
    const isArabic = this.currentLanguage === 'ar';
    const localeMap = {
      'INDIA': isArabic ? 'ar-IN' : 'en-IN',
      'UAE': isArabic ? 'ar-AE' : 'en-AE',
      'SAUDI': 'ar-SA',
      'QATAR': isArabic ? 'ar-QA' : 'en-QA'
    } as const;

    const locale = localeMap[region as keyof typeof localeMap] || (isArabic ? 'ar-IN' : 'en-IN');
    const formatter = new Intl.NumberFormat(locale);
    return formatter.format(number);
  }

  public formatDate(date: Date, region: string = 'INDIA', options?: Intl.DateTimeFormatOptions): string {
    const localeMap = {
      'INDIA': 'en-IN',
      'UAE': 'en-AE',
      'SAUDI': 'ar-SA',
      'QATAR': 'en-QA'
    };
    
    const locale = localeMap[region as keyof typeof localeMap] || 'en-IN';
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    
    const formatter = new Intl.DateTimeFormat(locale, {
      ...defaultOptions,
      ...options,
    });
    return formatter.format(date);
  }

  public formatTime(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
    };
    
    const formatter = new Intl.DateTimeFormat(this.currentLanguage, {
      ...defaultOptions,
      ...options,
    });
    return formatter.format(date);
  }

  public formatDateTime(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    
    const formatter = new Intl.DateTimeFormat(this.currentLanguage, {
      ...defaultOptions,
      ...options,
    });
    return formatter.format(date);
  }

  public getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return this.t('time.justNow');
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return this.t('time.minutesAgo', { count: minutes });
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return this.t('time.hoursAgo', { count: hours });
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return this.t('time.daysAgo', { count: days });
    } else {
      return this.formatDate(date);
    }
  }

  public getPluralForm(key: string, count: number): string {
    return i18n.t(key, { count });
  }

  public interpolate(template: string, values: Record<string, any>): string {
    return i18n.t(template, values);
  }

  // Region-specific formatting methods
  public formatCurrencyByRegion(amount: number, region: string = 'INDIA'): string {
    return this.formatCurrency(amount, region);
  }

  public formatNumberByRegion(number: number, region: string = 'INDIA'): string {
    return this.formatNumber(number, region);
  }

  public formatDateByRegion(date: Date, region: string = 'INDIA', options?: Intl.DateTimeFormatOptions): string {
    return this.formatDate(date, region, options);
  }

  public getRegionConfig(region: string = 'INDIA') {
    const configs = {
      'INDIA': {
        currency: 'INR',
        locale: 'en-IN',
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: 'en-IN',
        taxName: 'GST',
        taxRate: 0.05
      },
      'UAE': {
        currency: 'AED',
        locale: 'en-AE',
        timezone: 'Asia/Dubai',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: 'en-AE',
        taxName: 'VAT',
        taxRate: 0.05
      },
      'SAUDI': {
        currency: 'SAR',
        locale: 'ar-SA',
        timezone: 'Asia/Riyadh',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: 'ar-SA',
        taxName: 'VAT',
        taxRate: 0.15
      },
      'QATAR': {
        currency: 'QAR',
        locale: 'en-QA',
        timezone: 'Asia/Qatar',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: 'en-QA',
        taxName: 'VAT',
        taxRate: 0.05
      }
    };
    
    return configs[region as keyof typeof configs] || configs.INDIA;
  }
}

export default I18nService;
