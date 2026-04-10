/*  
*  FILE          : CalendarConnectPanel.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Panel for connecting and managing Google and Microsoft calendar integrations.
*/ 

import React, { useState, useEffect, useCallback } from "react";
import {
  type CalendarProvider,
  getCalendarConnectionStatus,
  connectCalendarViaPopup,
  disconnectCalendar,
  syncCalendar,
} from "./CalendarImportService";
import styles from "./CalendarConnectPanel.module.css";

// ── Icons ─────────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#F35325" d="M1 1h10v10H1z" />
      <path fill="#81BC06" d="M13 1h10v10H13z" />
      <path fill="#05A6F0" d="M1 13h10v10H1z" />
      <path fill="#FFBA08" d="M13 13h10v10H13z" />
    </svg>
  );
}

function SyncIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProviderState {
  connected: boolean;
  loading: boolean;
  syncing: boolean;
  lastSynced: Date | null;
  error: string | null;
}

const defaultProviderState = (): ProviderState => ({
  connected: false,
  loading: true,
  syncing: false,
  lastSynced: null,
  error: null,
});

interface CalendarConnectPanelProps {
  userId: string | number;
  onSyncComplete?: () => void;
  onClose?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CalendarConnectPanel({
  userId,
  onSyncComplete,
  onClose,
}: CalendarConnectPanelProps) {
  const [google, setGoogle] = useState<ProviderState>(defaultProviderState);
  const [microsoft, setMicrosoft] =
    useState<ProviderState>(defaultProviderState);

  const setProvider = (
    provider: CalendarProvider,
    patch: Partial<ProviderState>,
  ) => {
    if (provider === "google") setGoogle((s) => ({ ...s, ...patch }));
    if (provider === "microsoft") setMicrosoft((s) => ({ ...s, ...patch }));
  };

  // ── Load connection status on mount ───────────────────────────────────────
  useEffect(() => {
    (["google", "microsoft"] as CalendarProvider[]).forEach(
      async (provider) => {
        const connected = await getCalendarConnectionStatus(userId, provider);
        setProvider(provider, { connected, loading: false });
      },
    );
  }, [userId]);

  // ── Connect ───────────────────────────────────────────────────────────────
  const handleConnect = useCallback(
    async (provider: CalendarProvider) => {
      setProvider(provider, { loading: true, error: null });
      try {
        await connectCalendarViaPopup(userId, provider);
        setProvider(provider, {
          connected: true,
          loading: false,
          lastSynced: new Date(),
        });
        onSyncComplete?.();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Connection failed";
        setProvider(provider, { loading: false, error: msg });
      }
    },
    [userId, onSyncComplete],
  );

  // ── Disconnect ────────────────────────────────────────────────────────────
  const handleDisconnect = useCallback(
    async (provider: CalendarProvider) => {
      setProvider(provider, { loading: true, error: null });
      try {
        await disconnectCalendar(userId, provider);
        setProvider(provider, {
          connected: false,
          loading: false,
          lastSynced: null,
        });
        onSyncComplete?.();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Disconnect failed";
        setProvider(provider, { loading: false, error: msg });
      }
    },
    [userId, onSyncComplete],
  );

  // ── Sync ──────────────────────────────────────────────────────────────────
  const handleSync = useCallback(
    async (provider: CalendarProvider) => {
      setProvider(provider, { syncing: true, error: null });
      try {
        await syncCalendar(userId, provider);
        setProvider(provider, { syncing: false, lastSynced: new Date() });
        onSyncComplete?.();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Sync failed";
        setProvider(provider, { syncing: false, error: msg });
      }
    },
    [userId, onSyncComplete],
  );

  // ── Render ────────────────────────────────────────────────────────────────
  const renderProvider = (
    provider: CalendarProvider,
    state: ProviderState,
    label: string,
    Icon: () => React.ReactElement,
  ) => (
    <div className={styles.providerRow} key={provider}>
      <div className={styles.providerInfo}>
        <span className={styles.providerIcon}>
          <Icon />
        </span>
        <div className={styles.providerMeta}>
          <span className={styles.providerName}>{label}</span>
          {state.connected && state.lastSynced && (
            <span className={styles.lastSynced}>
              Synced {formatRelative(state.lastSynced)}
            </span>
          )}
          {!state.connected && !state.loading && (
            <span className={styles.notConnected}>Not connected</span>
          )}
        </div>
      </div>

      <div className={styles.providerActions}>
        {state.loading ? (
          <span className={styles.spinner} aria-label="Loading" />
        ) : state.connected ? (
          <>
            <button
              type="button"
              className={styles.syncButton}
              onClick={() => handleSync(provider)}
              disabled={state.syncing}
              aria-label={`Sync ${label}`}
              title="Sync now"
            >
              {state.syncing ? (
                <span className={styles.spinner} aria-hidden="true" />
              ) : (
                <SyncIcon />
              )}
            </button>
            <button
              type="button"
              className={styles.disconnectButton}
              onClick={() => handleDisconnect(provider)}
              aria-label={`Disconnect ${label}`}
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            type="button"
            className={`${styles.connectButton} ${styles[`connectButton_${provider}`]}`}
            onClick={() => handleConnect(provider)}
          >
            Connect
          </button>
        )}
      </div>

      {state.error && (
        <p className={styles.errorMsg} role="alert">
          {state.error}
        </p>
      )}
    </div>
  );

  return (
    <div
      className={styles.panel}
      role="dialog"
      aria-label="Calendar connections"
    >
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>Connected Calendars</h3>
        {onClose && (
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>

      <p className={styles.panelSubtitle}>
        Imported events are view-only. You can edit their location.
      </p>

      <div className={styles.providers}>
        {renderProvider("google", google, "Google Calendar", GoogleIcon)}
        {renderProvider(
          "microsoft",
          microsoft,
          "Microsoft Calendar",
          MicrosoftIcon,
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return date.toLocaleDateString();
}
