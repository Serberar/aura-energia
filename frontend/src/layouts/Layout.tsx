import type { ReactNode } from "react";
import Menu from "../components/Menu";
import { CallWidget } from "../features/calls";
import { useCallsWebSocket } from "../features/calls";
import ReminderToast from "../features/calls/components/ReminderToast";
import WrapUpPanel from "../features/calls/components/WrapUpPanel";
import IncomingCallToast from "../features/calls/components/IncomingCallToast";
import { useAppSelector } from "../hooks/reduxHooks";
import styles from "./Layout.module.scss";

function DemoBanner() {
  const demoActive = useAppSelector((s) => s.calls.demoActive);
  if (!demoActive) return null;
  return (
    <div className={styles.demoBanner}>
      🧪 <strong>MODO DEMO</strong> — Simulación activa. No hay llamadas reales.
    </div>
  );
}

interface LayoutProps {
  children: ReactNode;
}

function CallsProvider() {
  useCallsWebSocket();
  return (
    <>
      <CallWidget />
      <WrapUpPanel />
      <ReminderToast />
      <IncomingCallToast />
    </>
  );
}

export default function Layout({ children }: LayoutProps) {
  const callsEnabled = useAppSelector((s) => s.appSettings.callsModuleEnabled);

  return (
    <div className={styles.container}>
      <DemoBanner />
      <Menu />
      <main className={styles.main}>{children}</main>
      {callsEnabled && <CallsProvider />}
    </div>
  );
}
