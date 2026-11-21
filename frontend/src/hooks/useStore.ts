import { useState, useCallback } from 'react';
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
  // Purchase modal
  purchaseSuccessAccount: PesAccount | null;
  setPurchaseSuccessAccount: (acc: PesAccount | null) => void;
  handleOpenOrder: (account: PesAccount) => void;
  handleCloseOrder: () => void;
}

export function useStore(): UseStoreReturn {
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [selectedAccountForView, setSelectedAccountForView] = useState<PesAccount | null>(null);
  const [purchaseSuccessAccount, setPurchaseSuccessAccount] = useState<PesAccount | null>(null);

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
  }, []);

  const handleCloseOrder = useCallback(() => {
    setPurchaseSuccessAccount(null);
  }, []);

  return {
    isDeviceModalOpen,
    setIsDeviceModalOpen,
    handleOpenBuyFlow,
    handleSelectDevice,
    selectedAccountForView,
    setSelectedAccountForView,
    purchaseSuccessAccount,
    setPurchaseSuccessAccount,
    handleOpenOrder,
    handleCloseOrder,
  };
}
