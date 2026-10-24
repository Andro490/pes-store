import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, type Language, type TranslationKey } from './translations';

// EGP to USD approximate exchange rate
const EGP_TO_USD_RATE = 0.02; // 1 EGP ≈ 0.02 USD (adjust as needed)

export type Currency = 'EGP' | 'USD';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  dir: 'rtl' | 'ltr';
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (egpPrice: number) => string;
  isOutsideEgypt: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'pes_store_language';
const CURRENCY_KEY = 'pes_store_currency';
// Set ONLY when user manually clicks the language switcher — NOT by auto geo-detection.
// This ensures geo always re-detects on new sessions unless the user has deliberately chosen.
const USER_MANUAL_LANG_KEY = 'pes_lang_user_choice';
// Cache the geo API result for the current browser session to avoid repeated API calls.
const GEO_CACHE_KEY = 'pes_geo_country';

/** Detect user country via free IP-geolocation API */
async function detectCountry(): Promise<string | null> {
  // Use session cache to avoid calling the API on every component remount
  const cached = sessionStorage.getItem(GEO_CACHE_KEY);
  if (cached) return cached;

  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error('geo failed');
    const data = await res.json();
    const code = data.country_code || null; // e.g. "EG", "US", "SA"
    if (code) sessionStorage.setItem(GEO_CACHE_KEY, code);
    return code;
  } catch {
    try {
      // Fallback API
      const res2 = await fetch('https://api.country.is/', { signal: AbortSignal.timeout(4000) });
      if (!res2.ok) throw new Error('fallback geo failed');
      const data2 = await res2.json();
      const code2 = data2.country || null;
      if (code2) sessionStorage.setItem(GEO_CACHE_KEY, code2);
      return code2;
    } catch {
      return null;
    }
  }
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved === 'ar' || saved === 'en') return saved;
    return 'ar'; // Default to Arabic until geo-check resolves
  });

  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem(CURRENCY_KEY) as Currency | null;
    if (saved === 'EGP' || saved === 'USD') return saved;
    return 'EGP';
  });

  const [isOutsideEgypt, setIsOutsideEgypt] = useState(false);

  const isRTL = language === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';

  // ─── Geo-detection ───
  // Always detects the country but only overrides language/currency
  // when the user has NOT manually chosen a language via the switcher.
  useEffect(() => {
    const userManuallyChose = localStorage.getItem(USER_MANUAL_LANG_KEY);

    detectCountry().then((countryCode) => {
      const isEgypt = !countryCode || countryCode === 'EG';
      setIsOutsideEgypt(!isEgypt);

      if (!isEgypt && !userManuallyChose) {
        // Outside Egypt and user never manually picked a language → auto EN + USD
        setLanguageState('en');
        setCurrencyState('USD');
        localStorage.setItem(STORAGE_KEY, 'en');
        localStorage.setItem(CURRENCY_KEY, 'USD');
      }
    });
  }, []);

  // Sync to DOM and localStorage on language change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', language);
    if (document.body) {
      document.body.style.direction = dir;
      document.body.style.textAlign = isRTL ? 'right' : 'left';
    }
  }, [language, dir, isRTL]);

  // Sync currency to localStorage
  useEffect(() => {
    localStorage.setItem(CURRENCY_KEY, currency);
  }, [currency]);

  /** Called when user MANUALLY picks a language via the UI switcher */
  const setLanguage = (lang: Language) => {
    // Mark as a deliberate user choice so geo won't override it anymore
    localStorage.setItem(USER_MANUAL_LANG_KEY, '1');
    setLanguageState(lang);
  };

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
  };

  /** Toggles language — also marks as manual user choice */
  const toggleLanguage = () => {
    localStorage.setItem(USER_MANUAL_LANG_KEY, '1');
    setLanguageState((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const langDict = translations[language] || translations.ar;
    let text = langDict[key] || translations.ar[key] || key;

    if (params) {
      Object.entries(params).forEach(([placeholder, value]) => {
        text = text.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), String(value));
      });
    }

    return text;
  };

  /**
   * Format a price stored in EGP.
   * USD → convert and show "$xx"
   * EGP → show "xx جنيه" (Arabic) or "xx EGP" (English)
   */
  const formatPrice = (egpPrice: number): string => {
    if (currency === 'USD') {
      const usd = egpPrice * EGP_TO_USD_RATE;
      return `$${usd.toFixed(2)}`;
    }
    const label = language === 'ar' ? 'جنيه' : 'EGP';
    return `${egpPrice.toLocaleString()} ${label}`;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isRTL, dir, currency, setCurrency, formatPrice, isOutsideEgypt }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
