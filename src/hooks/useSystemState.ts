import { useState, useEffect, useCallback } from "react";

let tauriInvoke: any = null;
try {
  import("@tauri-apps/api/core").then((mod) => {
    tauriInvoke = mod.invoke;
  }).catch(() => {
    // Ignore
  });
} catch {
  // Ignore
}

export interface SystemState {
  wifiActive: boolean;
  bluetoothActive: boolean;
  volume: number;
  brightness: number;
}

const DEFAULT_SYSTEM_STATE: SystemState = {
  wifiActive: true,
  bluetoothActive: false,
  volume: 70,
  brightness: 85,
};

const SYSTEM_STATE_KEY = "argus-system-state";

export function useSystemState() {
  const [state, setStateState] = useState<SystemState>(() => {
    try {
      const raw = localStorage.getItem(SYSTEM_STATE_KEY);
      if (raw) {
        return { ...DEFAULT_SYSTEM_STATE, ...JSON.parse(raw) };
      }
    } catch {
      // Ignore
    }
    return DEFAULT_SYSTEM_STATE;
  });

  const updateState = useCallback((updates: Partial<SystemState>) => {
    setStateState((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(SYSTEM_STATE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("argus:system-state-changed", { detail: next }));
      if (updates.wifiActive !== undefined && tauriInvoke) {
        tauriInvoke("set_wifi_state", { enabled: updates.wifiActive }).catch(() => {});
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const handleSync = (e: Event) => {
      const detail = (e as CustomEvent<SystemState>).detail;
      if (detail) {
        setStateState(detail);
      }
    };
    window.addEventListener("argus:system-state-changed", handleSync);
    return () => {
      window.removeEventListener("argus:system-state-changed", handleSync);
    };
  }, []);

  useEffect(() => {
    const queryHardware = async () => {
      if (tauriInvoke) {
        try {
          const hwActive = await tauriInvoke("get_wifi_state");
          if (typeof hwActive === "boolean" && hwActive !== state.wifiActive) {
            updateState({ wifiActive: hwActive });
          }
        } catch {}
      }
    };
    const timer = setTimeout(queryHardware, 300);
    return () => clearTimeout(timer);
  }, [updateState, state.wifiActive]);

  useEffect(() => {
    const handleOnline = () => updateState({ wifiActive: true });
    const handleOffline = () => updateState({ wifiActive: false });
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [updateState]);

  return { state, updateState };
}
