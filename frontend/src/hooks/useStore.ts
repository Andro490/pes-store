import { useState, useCallback } from 'react';
import { paymobApi, paddleApi } from '../services/api';
import type { PesAccount } from '../types';

declare global {
  interface Window {
    Paddle?: any;
  }
}

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
  // Purchase / Paddle
  isPayingWithPaddle: boolean;
  paddleError: string | null;
  handlePayWithPaddle: () => Promise<void>;
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

  // Paddle states
  const [isPayingWithPaddle, setIsPayingWithPaddle] = useState(false);
  const [paddleError, setPaddleError] = useState<string | null>(null);

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
    setPaddleError(null);
  }, []);

  const handleCloseOrder = useCallback(() => {
    setPurchaseSuccessAccount(null);
    setPaymobResponseData(null);
    setPaymobError(null);
    setPaddleError(null);
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
                gateway: 'paymob',
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

  const handlePayWithPaddle = useCallback(async () => {
    if (!purchaseSuccessAccount) return;
    setPaddleError(null);
    try {
      setIsPayingWithPaddle(true);
      const res = await paddleApi.initiate({
        accountId: purchaseSuccessAccount.id,
      });

      if (res.data) {
        const { transactionId, checkoutUrl, claimToken } = res.data;

        // Save pending purchase info
        try {
          localStorage.setItem(
            'pes_pending_purchase',
            JSON.stringify({
              gateway: 'paddle',
              transactionId,
              accountId: purchaseSuccessAccount.id,
              accountTitle: purchaseSuccessAccount.title,
              price: purchaseSuccessAccount.price,
              claimToken,
              timestamp: Date.now(),
            })
          );
        } catch {
          // ignore
        }

        // Check if client token is set and Paddle.js is loaded for in-page overlay
        const configRes = await paddleApi.getConfig().catch(() => null);
        const clientToken = configRes?.data?.clientToken;
        const paddleEnv = configRes?.data?.environment || 'production';

        if (typeof window !== 'undefined' && window.Paddle && clientToken) {
          try {
            window.Paddle.Environment.set(paddleEnv);
            window.Paddle.Initialize({
              token: clientToken,
            });

            window.Paddle.Checkout.open({
              transactionId,
              settings: {
                theme: 'dark',
                successUrl: `${window.location.origin}/?paddle_callback=true&success=true&txn_id=${transactionId}&account_id=${purchaseSuccessAccount.id}`,
              },
            });
            return;
          } catch (overlayErr) {
            console.warn('Paddle overlay failed, falling back to checkout URL:', overlayErr);
          }
        }

        // Direct redirect to hosted checkoutUrl
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          setPaddleError('لم يتم إرجاع رابط دفع من Paddle. يرجى التأكد من إعداد Default Payment Link في لوحة تحكم Paddle (Checkout -> Checkout configuration).');
        }
      }
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        'حدث خطأ غير متوقع في Paddle، يرجى المحاولة مجدداً';
      setPaddleError(serverMsg);
    } finally {
      setIsPayingWithPaddle(false);
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
    isPayingWithPaddle,
    paddleError,
    handlePayWithPaddle,
    handleOpenOrder,
    handleCloseOrder,
  };
}
