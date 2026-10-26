import { useState, useCallback } from 'react';
import { paymobApi } from '../services/api';
import type { PesAccount } from '../types';

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
  paymobError: string | null;
  handlePayWithPaymob: () => Promise<void>;
  handleOpenOrder: (account: PesAccount) => void;
  handleCloseOrder: () => void;
}

export function useStore(): UseStoreReturn {
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [selectedAccountForView, setSelectedAccountForView] = useState<PesAccount | null>(null);
  const [purchaseSuccessAccount, setPurchaseSuccessAccount] = useState<PesAccount | null>(null);
  const [isPayingWithPaymob, setIsPayingWithPaymob] = useState(false);
  const [paymobResponseData, setPaymobResponseData] = useState<any>(null);
  const [paymobError, setPaymobError] = useState<string | null>(null);

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
    setPaymobError(null);
  }, []);

  const handleCloseOrder = useCallback(() => {
    setPurchaseSuccessAccount(null);
    setPaymobResponseData(null);
    setPaymobError(null);
  }, []);

  const handlePayWithPaymob = useCallback(async () => {
    if (!purchaseSuccessAccount) return;
    setPaymobError(null);
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
          // Save pending purchase in localStorage to guarantee delivery even across tab switches
          try {
            localStorage.setItem(
              'pes_pending_purchase',
              JSON.stringify({
                accountId: purchaseSuccessAccount.id,
                accountTitle: purchaseSuccessAccount.title,
                price: purchaseSuccessAccount.price,
                claimToken: res.data.claimToken,
                timestamp: Date.now(),
              })
            );
          } catch {
            // ignore storage errors
          }
          window.location.href = res.data.checkoutUrl;
        }
      }
    } catch (err: any) {
      // استخراج رسالة الخطأ من السيرفر (مثل: نفد المخزون)
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        'حدث خطأ غير متوقع، يرجى المحاولة مجدداً';
      setPaymobError(serverMsg);
    } finally {
      setIsPayingWithPaymob(false);
    }
  }, [purchaseSuccessAccount]);

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
    paymobError,
    handlePayWithPaymob,
    handleOpenOrder,
    handleCloseOrder,
  };
}
