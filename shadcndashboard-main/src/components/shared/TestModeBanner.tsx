import React, { useState, useEffect } from 'react';
import { isTestMode, setTestMode, getApiBaseUrl } from 'src/config/api.config';
import { useRestaurant } from 'src/context/restaurant-context/RestaurantContext';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { FlaskConical, AlertTriangle, RefreshCw, Radio, CheckCircle2 } from 'lucide-react';

export default function TestModeBanner() {
  const [testMode, setTestModeState] = useState<boolean>(isTestMode());
  const { isBackendConnected, refreshData } = useRestaurant();
  const [dismissedOfflineWarning, setDismissedOfflineWarning] = useState(false);

  useEffect(() => {
    const handleModeChange = (e: any) => {
      setTestModeState(Boolean(e.detail?.enabled));
    };
    window.addEventListener('servora-test-mode-change', handleModeChange);
    return () => {
      window.removeEventListener('servora-test-mode-change', handleModeChange);
    };
  }, []);

  const handleToggle = (enabled: boolean) => {
    setTestMode(enabled);
    setTestModeState(enabled);
    window.location.reload();
  };

  // 1. When Test Mode is active
  if (testMode) {
    return (
      <div className="w-full bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-amber-500 text-white border-amber-600 font-bold text-[10px] uppercase tracking-wider py-0 px-2 gap-1 flex items-center">
            <FlaskConical className="size-3" />
            <span>Test Mode</span>
          </Badge>
          <span className="font-medium">
            Isolated frontend preview active. Database persistence is <strong>offline</strong>. Real logins and database saves are disabled.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleToggle(false)}
            className="h-6 text-[11px] font-semibold bg-white/70 dark:bg-stone-900/70 border-amber-400 dark:border-amber-700 hover:bg-amber-100 text-amber-900 dark:text-amber-200"
          >
            <Radio className="size-3 mr-1 text-emerald-600" />
            Switch to Live API
          </Button>
        </div>
      </div>
    );
  }

  // 2. When Test Mode is OFF but backend is unreachable / disconnected
  if (!isBackendConnected && !dismissedOfflineWarning) {
    const configuredUrl = getApiBaseUrl();

    return (
      <div className="w-full bg-rose-500/10 border-b border-rose-500/25 text-rose-950 dark:text-rose-200 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span className="font-medium">
            Backend Offline: Unable to reach Servora API at {configuredUrl ? `"${configuredUrl}"` : '(Unconfigured)'}.
            To test digital menus, QR codes, and dashboard layouts offline, you can enable Frontend Test Mode.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleToggle(true)}
            className="h-6 text-[11px] font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-md"
          >
            <FlaskConical className="size-3 mr-1" />
            Enable Test Mode
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissedOfflineWarning(true)}
            className="h-6 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
