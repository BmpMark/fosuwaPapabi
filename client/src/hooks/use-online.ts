import { useState, useEffect, useCallback } from "react";

export interface UseOnlineReturn {
  isOnline: boolean;
  isOffline: boolean;
  wasOffline: boolean;
  connectionType?: string;
  effectiveType?: string;
  saveForLater: boolean;
  setSaveForLater: (value: boolean) => void;
  syncData: () => Promise<void>;
  isPWAInstalled: boolean;
  canInstallPWA: boolean;
  installPWA: () => Promise<void>;
}

export function useOnline(): UseOnlineReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [saveForLater, setSaveForLater] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<{
    type?: string;
    effectiveType?: string;
  }>({});
  const [pwaState, setPwaState] = useState<{
    installed: boolean;
    canInstall: boolean;
    deferredPrompt?: Event;
  }>({
    installed: false,
    canInstall: false,
  });

  // Check if app is running as PWA
  const isPWAInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true;

  // Update connection info
  const updateConnectionInfo = useCallback(() => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    if (connection) {
      setConnectionInfo({
        type: connection.type,
        effectiveType: connection.effectiveType,
      });
    }
  }, []);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Trigger sync when coming back online
        console.log("Back online - triggering sync");
        // Redirect to previous page if user was on offline page
        if (window.location.pathname === '/offline') {
          window.history.back();
        }
      }
      setWasOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      // Only redirect to offline page if not already there and not on auth pages
      if (window.location.pathname !== '/offline' &&
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/auth')) {
        // Store current location for redirect after coming back online
        sessionStorage.setItem('offline-redirect', window.location.pathname);
        window.location.href = '/offline';
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo);
      updateConnectionInfo();
    }

    // PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPwaState(prev => ({
        ...prev,
        canInstall: true,
        deferredPrompt: e,
      }));
    };

    const handleAppInstalled = () => {
      setPwaState(prev => ({
        ...prev,
        installed: true,
        canInstall: false,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo);
      }

      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [wasOffline, updateConnectionInfo]);

  // Sync data when coming back online
  const syncData = useCallback(async () => {
    if (!isOnline) return;

    try {
      // Trigger any pending sync operations
      console.log("Syncing data...");

      // You can add specific sync logic here for:
      // - Pending reservations
      // - Room service orders
      // - Cached form data

      // For example, you could dispatch custom events or use service worker sync
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        // Check if sync manager is available
        if ('sync' in registration) {
          // @ts-expect-error: Property 'sync' might not be typed in TS yet
          await registration.sync.register('background-sync');
        }
      }

      // Reset save for later flag
      setSaveForLater(false);
    } catch (error) {
      console.error("Sync failed:", error);
    }
  }, [isOnline]);

  // Install PWA
  const installPWA = useCallback(async () => {
    if (!pwaState.deferredPrompt) return;

    try {
      (pwaState.deferredPrompt as any).prompt();
      const { outcome } = await (pwaState.deferredPrompt as any).userChoice;

      if (outcome === 'accepted') {
        setPwaState(prev => ({
          ...prev,
          canInstall: false,
          deferredPrompt: undefined,
        }));
      }
    } catch (error) {
      console.error("PWA install failed:", error);
    }
  }, [pwaState.deferredPrompt]);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    connectionType: connectionInfo.type,
    effectiveType: connectionInfo.effectiveType,
    saveForLater,
    setSaveForLater,
    syncData,
    isPWAInstalled,
    canInstallPWA: pwaState.canInstall,
    installPWA,
  };
}