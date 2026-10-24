import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, type Language, type TranslationKey } from './translations';

// Cache keys & fallback exchange rate (1 USD = ~50 EGP fallback if offline)
const RATE_CACHE_KEY = 'pes_usd_to_egp_rate';
const DEFAULT_USD_TO_EGP = 50.0;

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
  formatPriceParts: (egpPrice: number) => { amount: string; unit: string; prefix: boolean };
  isOutsideEgypt: boolean;
  usdToEgpRate: number;
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

/** Fetch today's live USD to EGP exchange rate via free open API */
async function fetchLiveUsdRate(): Promise<number> {
  const cached = sessionStorage.getItem(RATE_CACHE_KEY);
  if (cached) {
    const parsed = parseFloat(cached);
    if (!isNaN(parsed) && parsed > 20) return parsed;
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      const egpRate = data?.rates?.EGP;
      if (typeof egpRate === 'number' && egpRate > 0) {
        sessionStorage.setItem(RATE_CACHE_KEY, String(egpRate));
        return egpRate;
      }
    }
  } catch {
    try {
      const res2 = await fetch('https://api.exchangerate-api.com/v4/latest/USD', { signal: AbortSignal.timeout(4000) });
      if (res2.ok) {
        const data2 = await res2.json();
        const egpRate = data2?.rates?.EGP;
        if (typeof egpRate === 'number' && egpRate > 0) {
          sessionStorage.setItem(RATE_CACHE_KEY, String(egpRate));
          return egpRate;
        }
      }
    } catch {
      // offline fallback
    }
  }

  return DEFAULT_USD_TO_EGP;
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

  const [usdToEgpRate, setUsdToEgpRate] = useState<number>(() => {
    const cached = sessionStorage.getItem(RATE_CACHE_KEY);
    if (cached) {
      const parsed = parseFloat(cached);
      if (!isNaN(parsed) && parsed > 20) return parsed;
    }
    return DEFAULT_USD_TO_EGP;
  });

  const [isOutsideEgypt, setIsOutsideEgypt] = useState(false);

  // Fetch live USD to EGP rate on mount
  useEffect(() => {
    fetchLiveUsdRate().then((rate) => {
      setUsdToEgpRate(rate);
    });
  }, []);

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
    if (key === 'currency') {
      if (currency === 'USD') return 'USD';
      return language === 'ar' ? 'جنيه' : 'EGP';
    }

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
   * Split price into amount, unit and whether unit is a prefix ($) or suffix (جنيه / EGP)
   * Converts EGP to USD by dividing by today's live USD rate: (egpPrice / usdToEgpRate)
   */
  const formatPriceParts = (egpPrice: number): { amount: string; unit: string; prefix: boolean } => {
    if (currency === 'USD') {
      const rate = usdToEgpRate > 0 ? usdToEgpRate : DEFAULT_USD_TO_EGP;
      // تقسيم السعر بالمصري على سعر صرف الدولار اليوم
      const usd = egpPrice / rate;
      const formatted = (Math.round(usd * 100) / 100).toFixed(2);
      return { amount: formatted, unit: '$', prefix: true };
    }
    const label = language === 'ar' ? 'جنيه' : 'EGP';
    return { amount: egpPrice.toLocaleString(), unit: label, prefix: false };
  };

  /**
   * Format a price stored in EGP according to current selected currency.
   * USD → "$5.43"
   * EGP → "300 جنيه" (Arabic) or "300 EGP" (English)
   */
  const formatPrice = (egpPrice: number): string => {
    const { amount, unit, prefix } = formatPriceParts(egpPrice);
    return prefix ? `${unit}${amount}` : `${amount} ${unit}`;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isRTL, dir, currency, setCurrency, formatPrice, formatPriceParts, isOutsideEgypt, usdToEgpRate }}>
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
