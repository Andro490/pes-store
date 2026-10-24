import { useState, useCallback } from 'react';
import { paymobApi } from '../services/api';
import type { PesAccount } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

export interface UseStoreReturn {
  // Device selection modal
  isDeviceModalOpen: boolean;
  setIsDeviceModalOpen: (v: boolean) => void;
  handleOpenBuyFlow: () => void;
  handleSelectDevice: (platform: 'android' | 'ios' | 'all', onPlatformChange: (p: any) => void) => void;
  // Account detail modal
  selectedAccountForView: PesAccount | null;
  setSelectedAccountForView: (acc: PesAccount | null) => void;
  // Purchase / Paymob
  purchaseSuccessAccount: PesAccount | null;
  setPurchaseSuccessAccount: (acc: PesAccount | null) => void;
  isPayingWithPaymob: boolean;
  paymobResponseData: any;
  setPaymobResponseData: (d: any) => void;
  handlePayWithPaymob: () => Promise<void>;
  handleOpenOrder: (account: PesAccount) => void;
  handleCloseOrder: () => void;
}

export function useStore(): UseStoreReturn {
  const { t } = useLanguage();

  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [selectedAccountForView, setSelectedAccountForView] = useState<PesAccount | null>(null);
  const [purchaseSuccessAccount, setPurchaseSuccessAccount] = useState<PesAccount | null>(null);
  const [isPayingWithPaymob, setIsPayingWithPaymob] = useState(false);
  const [paymobResponseData, setPaymobResponseData] = useState<any>(null);

  const handleOpenBuyFlow = useCallback(() => {
    setIsDeviceModalOpen(true);
  }, []);

  const handleSelectDevice = useCallback(
    (platform: 'android' | 'ios' | 'all', onPlatformChange: (p: any) => void) => {
      onPlatformChange(platform);
      setIsDeviceModalOpen(false);
      const storeElem = document.getElementById('store-section');
      if (storeElem) storeElem.scrollIntoView({ behavior: 'smooth' });
    },
    []
  );

  const handleOpenOrder = useCallback((account: PesAccount) => {
    setPurchaseSuccessAccount(account);
    setPaymobResponseData(null);
  }, []);

  const handleCloseOrder = useCallback(() => {
    setPurchaseSuccessAccount(null);
    setPaymobResponseData(null);
  }, []);

  const handlePayWithPaymob = useCallback(async () => {
    if (!purchaseSuccessAccount) return;
    try {
      setIsPayingWithPaymob(true);
      const res = await paymobApi.initiate({
        accountId: purchaseSuccessAccount.id,
        accountTitle: purchaseSuccessAccount.title,
        amountEgp: purchaseSuccessAccount.price,
      });
      if (res.data) {
        setPaymobResponseData(res.data);
        if (res.data.checkoutUrl) {
          window.open(res.data.checkoutUrl, '_blank');
        }
      }
    } catch (err: any) {
      alert(t('paymobError') + err.message);
    } finally {
      setIsPayingWithPaymob(false);
    }
  }, [purchaseSuccessAccount, t]);

  return {
    isDeviceModalOpen,
    setIsDeviceModalOpen,
    handleOpenBuyFlow,
    handleSelectDevice,
    selectedAccountForView,
    setSelectedAccountForView,
    purchaseSuccessAccount,
    setPurchaseSuccessAccount,
    isPayingWithPaymob,
    paymobResponseData,
    setPaymobResponseData,
    handlePayWithPaymob,
    handleOpenOrder,
    handleCloseOrder,
  };
}
