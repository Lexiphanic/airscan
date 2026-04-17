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

const overlayContent = {
  connecting: {
    title: "Wait...",
    message: "Connecting to device...",
    titleClassName: "text-(--nb-accent)",
  },
  reconnecting: {
    title: "Wait...",
    message: "Reconnecting to device...",
    titleClassName: "text-(--nb-accent)",
  },
  disconnected: {
    title: "Not Connected",
    message: "Please connect to a device first to view the dashboard.",
    titleClassName: "text-(--nb-text-muted)",
  },
  noFeatures: {
    title: "No Features",
    message:
      "Your device doesn't appear to support any features. Please check your device and try again.",
    titleClassName: "text-amber-600",
  },
} as const;

function Overlay(props: {
  title: string;
  message: string;
  titleClassName: string;
}) {
  return (
    <div className="absolute inset-0 z-30 items-center justify-center bg-(--nb-bg)/50 backdrop-blur-sm p-8 md:p-20">
      <div className="neobrutalist-card p-6 text-center">
        <div className={`${props.titleClassName} text-2xl mb-2`}>
          {props.title}
        </div>
        <p className="text-(--nb-text-muted)">{props.message}</p>
      </div>
    </div>
  );
}

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

  return (
    <>
      <nav className="lg:hidden sticky top-0 z-40 bg-(--nb-bg) border-b-4 border-(--nb-border)">
        <div className="flex divide-x-2 divide-(--nb-border)">
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
                    ? "bg-(--nb-accent) text-(--nb-bg)"
                    : "bg-(--nb-bg) text-(--nb-text) hover:bg-(--nb-bg-secondary)"
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

      <main className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 relative min-h-[calc(100vh-120px)]">
        {(connectionState === "connecting" ||
          connectionState === "reconnecting") && (
          <Overlay
            title={overlayContent[connectionState].title}
            message={overlayContent[connectionState].message}
            titleClassName={overlayContent[connectionState].titleClassName}
          />
        )}

        {connectionState === "disconnected" && (
          <Overlay
            title={overlayContent.disconnected.title}
            message={overlayContent.disconnected.message}
            titleClassName={overlayContent.disconnected.titleClassName}
          />
        )}

        {!hasActiveFeatures && connectionState === "connected" && (
          <Overlay
            title={overlayContent.noFeatures.title}
            message={overlayContent.noFeatures.message}
            titleClassName={overlayContent.noFeatures.titleClassName}
          />
        )}

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
