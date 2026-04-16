import { useState } from "react";
import AccessPointList from "./AccessPointList.tsx";
import ClientsList from "./ClientsList.tsx";
import FeatureMonitor from "./FeatureMonitor.tsx";
import { RadioTower, Smartphone, Zap } from "lucide-react";
import useDeviceConfig from "@airscan/engine/selectors/useDeviceConfig.ts";
import useTransportState from "../store/selectors/useTransportState.ts";

const tabs = [
  { id: "accessPoints", label: "Access Points", icon: RadioTower },
  { id: "clients", label: "Clients", icon: Smartphone },
  { id: "features", label: "Features", icon: Zap },
] as const;

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<
    "accessPoints" | "clients" | "features"
  >("accessPoints");
  const deviceConfig = useDeviceConfig();
  const connectionState = useTransportState();
  const hasScanSupport = deviceConfig.features.includes("scan");
  const enabledFeatureCount = deviceConfig.features.filter(
    (feature) => feature === "deauth" /* || feature === 'fake-ap'*/,
  ).length;
  const hasActiveFeatures = hasScanSupport || enabledFeatureCount > 0;

  if (connectionState === "connecting" || connectionState === "reconnecting") {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="neobrutalist-card p-6 text-center">
          <div className="text-[var(--nb-accent)] text-2xl mb-2">Wait...</div>
          <p className="text-[var(--nb-text-muted)]">
            {connectionState === "reconnecting"
              ? "Reconnecting to device..."
              : "Connecting to device..."}
          </p>
        </div>
      </div>
    );
  }

  if (connectionState === "disconnected") {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="neobrutalist-card p-6 text-center">
          <div className="text-[var(--nb-text-muted)] text-2xl mb-2">
            Not Connected
          </div>
          <p className="text-[var(--nb-text-muted)]">
            Please connect to a device first to view the dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (!hasActiveFeatures) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="neobrutalist-card p-6 text-center">
          <div className="text-amber-600 text-2xl mb-2">No Features</div>
          <p className="text-[var(--nb-text-muted)]">
            Your device doesn't appear to support any features. Please check
            your device and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <nav className="lg:hidden sticky top-0 z-40 bg-[var(--nb-bg)] border-b-4 border-[var(--nb-border)]">
        <div className="flex divide-x-2 divide-[var(--nb-border)]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                cursor-pointer flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold
                ${
                  activeTab === tab.id
                    ? "bg-[var(--nb-accent)] text-[var(--nb-bg)]"
                    : "bg-[var(--nb-bg)] text-[var(--nb-text)] hover:bg-[var(--nb-bg-secondary)]"
                }
              `}
              >
                <span>
                  <Icon className="w-5 h-5"></Icon>
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          className={`
          lg:col-span-6 xl:col-span-4 space-y-6
          ${activeTab === "accessPoints" ? "block" : "hidden lg:block"}
        `}
        >
          <AccessPointList />
        </div>

        <div
          className={`
          lg:col-span-6 xl:col-span-4 space-y-6
          ${activeTab === "clients" ? "block" : "hidden lg:block"}
        `}
        >
          <ClientsList />
        </div>

        <div
          className={`
          lg:col-span-12 xl:col-span-4 space-y-6
          ${activeTab === "features" ? "block" : "hidden lg:block"}
        `}
        >
          <FeatureMonitor />
        </div>
      </main>
    </>
  );
}
