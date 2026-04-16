import { useState, useCallback } from "react";
import { Crosshair, Edit, Building, AlertTriangle, X } from "lucide-react";
import Card from "../../ui/Card.tsx";
import Badge from "../../ui/Badge.tsx";
import useAppStore from "../../../store/useAppStore.ts";
import useGroupedManufacturers from "@airscan/engine/selectors/useGroupedManufacturers.ts";
import DeauthFeatureList from "./DeauthFeatureList.tsx";
import type { EnabledFeature } from "@airscan/types/EnabledFeature";
import id from "@airscan/engine/utils/id.ts";

type FeatureConfig =
  | {
      type: "manufacturer-both";
      apPrefixes: string[];
      clientPrefixes: string[];
      channelNum: number;
    }
  | {
      type: "manufacturer-ap";
      apPrefixes: string[];
      clientValue: string;
      channelNum: number;
    }
  | {
      type: "manufacturer-client";
      clientPrefixes: string[];
      apValue: string;
      channelNum: number;
    }
  | {
      type: "single";
      apValue: string;
      clientValue: string;
      channelNum: number;
      isBroadcast: boolean;
    };

export default function DeauthFeature() {
  const [channel, setChannel] = useState<string>("");
  const [accessPoint, setAccessPoint] = useState<string>("");
  const [client, setClient] = useState<string>("");
  const [apMode, setApMode] = useState<"manual" | "manufacturer">("manual");
  const [clientMode, setClientMode] = useState<"manual" | "manufacturer">(
    "manual",
  );
  const [selectedApManufacturer, setSelectedApManufacturer] =
    useState<string>("");
  const [selectedClientManufacturer, setSelectedClientManufacturer] =
    useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [pendingFeature, setPendingFeature] = useState<EnabledFeature | null>(
    null,
  );

  const addEnabledFeature = useAppStore((state) => state.addEnabledFeature);
  const manufacturers = useGroupedManufacturers();

  const prepareFeature = useCallback((): FeatureConfig => {
    const channelNum = channel ? parseInt(channel, 10) : 0;
    const apValue = apMode === "manual" ? accessPoint : "";
    const clientValue = clientMode === "manual" ? client : "";

    const isBroadcast =
      !apValue &&
      !clientValue &&
      !(apMode === "manufacturer" && selectedApManufacturer) &&
      !(clientMode === "manufacturer" && selectedClientManufacturer);

    if (
      apMode === "manufacturer" &&
      selectedApManufacturer &&
      manufacturers[selectedApManufacturer]
    ) {
      const apPrefixes = manufacturers[selectedApManufacturer]!;

      if (
        clientMode === "manufacturer" &&
        selectedClientManufacturer &&
        manufacturers[selectedClientManufacturer]
      ) {
        return {
          type: "manufacturer-both",
          apPrefixes,
          clientPrefixes: manufacturers[selectedClientManufacturer]!,
          channelNum,
        };
      } else {
        return { type: "manufacturer-ap", apPrefixes, clientValue, channelNum };
      }
    } else if (
      clientMode === "manufacturer" &&
      selectedClientManufacturer &&
      manufacturers[selectedClientManufacturer]
    ) {
      return {
        type: "manufacturer-client",
        clientPrefixes: manufacturers[selectedClientManufacturer]!,
        apValue,
        channelNum,
      };
    } else {
      return { type: "single", apValue, clientValue, channelNum, isBroadcast };
    }
  }, [
    channel,
    accessPoint,
    client,
    apMode,
    clientMode,
    selectedApManufacturer,
    selectedClientManufacturer,
    manufacturers,
  ]);

  const executeFeatureCreation = useCallback(
    (featureConfig: FeatureConfig) => {
      switch (featureConfig.type) {
        case "manufacturer-both":
          featureConfig.apPrefixes.forEach((apPrefix) => {
            featureConfig.clientPrefixes.forEach((clientPrefix) => {
              addEnabledFeature({
                id: id(),
                type: "deauth",
                isActive: true,
                options: {
                  accessPoint: apPrefix,
                  station: clientPrefix,
                  channel: featureConfig.channelNum,
                },
              });
            });
          });
          break;

        case "manufacturer-ap":
          featureConfig.apPrefixes.forEach((prefix) => {
            addEnabledFeature({
              id: id(),
              type: "deauth",
              isActive: true,
              options: {
                accessPoint: prefix,
                station: featureConfig.clientValue,
                channel: featureConfig.channelNum,
              },
            });
          });
          break;

        case "manufacturer-client":
          featureConfig.clientPrefixes.forEach((prefix) => {
            addEnabledFeature({
              id: id(),
              type: "deauth",
              isActive: true,
              options: {
                accessPoint: featureConfig.apValue,
                station: prefix,
                channel: featureConfig.channelNum,
              },
            });
          });
          break;

        case "single":
          addEnabledFeature({
            id: id(),
            type: "deauth",
            isActive: true,
            options: {
              accessPoint: featureConfig.apValue,
              station: featureConfig.clientValue,
              channel: featureConfig.channelNum,
            },
          });
          break;
      }
    },
    [addEnabledFeature],
  );

  const handleSubmit = useCallback(() => {
    const featureConfig = prepareFeature();

    if (featureConfig.type === "single" && featureConfig.isBroadcast) {
      setPendingFeature({
        id: id(),
        type: "deauth",
        isActive: true,
        options: {
          accessPoint: "",
          station: "",
          channel: featureConfig.channelNum,
        },
      });
      setShowConfirmation(true);
      return;
    }

    executeFeatureCreation(featureConfig);

    setChannel("");
    setAccessPoint("");
    setClient("");
    setSelectedApManufacturer("");
    setSelectedClientManufacturer("");
  }, [prepareFeature, executeFeatureCreation]);

  const handleConfirm = useCallback(() => {
    if (pendingFeature) {
      addEnabledFeature(pendingFeature);
    }
    setShowConfirmation(false);
    setPendingFeature(null);

    setChannel("");
    setAccessPoint("");
    setClient("");
    setSelectedApManufacturer("");
    setSelectedClientManufacturer("");
  }, [pendingFeature, addEnabledFeature]);

  const handleCancel = useCallback(() => {
    setShowConfirmation(false);
    setPendingFeature(null);
  }, []);

  const canSubmit = true;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-[var(--nb-text-muted)]">
          <Crosshair className="w-4 h-4" /> Deauth
        </h2>
        <Badge color="purple">
          {Object.keys(manufacturers).length} Manufacturers
        </Badge>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="channel"
              className="text-sm text-[var(--nb-text-muted)] font-bold mb-2 block"
            >
              Channel (optional)
            </label>
            <input
              id="channel"
              type="number"
              min="1"
              max="14"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="All channels"
              className="w-full neobrutalist-input"
            />
            <div className="text-xs text-[var(--nb-text-muted)] mt-1">
              Leave empty for all channels
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="access-point"
                className="text-sm text-[var(--nb-text-muted)] font-bold"
              >
                Access Point
              </label>
              <div className="flex -space-x-px">
                <button
                  type="button"
                  onClick={() => setApMode("manual")}
                  className={`flex items-center gap-1 px-2 py-1 text-xs font-bold border-2 border-[var(--nb-border)] rounded-l-md cursor-pointer ${apMode === "manual" ? "bg-[var(--nb-accent)] text-[var(--nb-bg)]" : "bg-[var(--nb-bg)] hover:bg-[var(--nb-bg-secondary)]"}`}
                  title="Enter MAC manually"
                >
                  <Edit className="w-3 h-3" />
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => setApMode("manufacturer")}
                  className={`flex items-center gap-1 px-2 py-1 text-xs font-bold border-2 border-l-0 border-[var(--nb-border)] rounded-r-md cursor-pointer ${apMode === "manufacturer" ? "bg-[var(--nb-accent)] text-[var(--nb-bg)]" : "bg-[var(--nb-bg)] hover:bg-[var(--nb-bg-secondary)]"}`}
                  title="Select by manufacturer"
                >
                  <Building className="w-3 h-3" />
                  Manufacturer
                </button>
              </div>
            </div>

            {apMode === "manual" ? (
              <input
                id="access-point"
                type="text"
                value={accessPoint}
                onChange={(e) => setAccessPoint(e.target.value)}
                placeholder="ab:cd:ef:12:34:56"
                className="w-full neobrutalist-input font-mono"
              />
            ) : (
              <div className="space-y-2">
                <select
                  id="access-point"
                  value={selectedApManufacturer}
                  onChange={(e) => setSelectedApManufacturer(e.target.value)}
                  className="w-full neobrutalist-input"
                >
                  <option value="">Choose AP manufacturer...</option>
                  {Object.keys(manufacturers).map((manufacturer) => (
                    <option key={manufacturer} value={manufacturer}>
                      {manufacturer}
                    </option>
                  ))}
                </select>
                {selectedApManufacturer && (
                  <div className="border-2 border-[var(--nb-border)] p-2 rounded-lg">
                    <div className="text-xs text-[var(--nb-text-muted)] font-bold mb-1">
                      OUI Prefixes:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {manufacturers[selectedApManufacturer]!.map((prefix) => (
                        <Badge
                          key={prefix}
                          color="cyan"
                          className="font-mono text-[10px]"
                        >
                          {prefix}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="text-xs text-[var(--nb-text-muted)]">
              {apMode === "manual"
                ? "Specific AP MAC address"
                : "Target all APs from selected manufacturer"}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="client"
                className="text-sm text-[var(--nb-text-muted)] font-bold"
              >
                Client
              </label>
              <div className="flex -space-x-px">
                <button
                  type="button"
                  onClick={() => setClientMode("manual")}
                  className={`flex items-center gap-1 px-2 py-1 text-xs font-bold border-2 border-[var(--nb-border)] rounded-l-md cursor-pointer ${clientMode === "manual" ? "bg-[var(--nb-accent)] text-[var(--nb-bg)]" : "bg-[var(--nb-bg)] hover:bg-[var(--nb-bg-secondary)]"}`}
                  title="Enter MAC manually"
                >
                  <Edit className="w-3 h-3" />
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => setClientMode("manufacturer")}
                  className={`flex items-center gap-1 px-2 py-1 text-xs font-bold border-2 border-l-0 border-[var(--nb-border)] rounded-r-md cursor-pointer ${clientMode === "manufacturer" ? "bg-[var(--nb-accent)] text-[var(--nb-bg)]" : "bg-[var(--nb-bg)] hover:bg-[var(--nb-bg-secondary)]"}`}
                  title="Select by manufacturer"
                >
                  <Building className="w-3 h-3" />
                  Manufacturer
                </button>
              </div>
            </div>

            {clientMode === "manual" ? (
              <input
                id="client"
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="ab:cd:ef:12:34:56"
                className="w-full neobrutalist-input font-mono"
              />
            ) : (
              <div className="space-y-2">
                <select
                  id="client"
                  value={selectedClientManufacturer}
                  onChange={(e) =>
                    setSelectedClientManufacturer(e.target.value)
                  }
                  className="w-full neobrutalist-input"
                >
                  <option value="">Choose client manufacturer...</option>
                  {Object.keys(manufacturers).map((manufacturer) => (
                    <option key={manufacturer} value={manufacturer}>
                      {manufacturer}
                    </option>
                  ))}
                </select>
                {selectedClientManufacturer && (
                  <div className="border-2 border-[var(--nb-border)] p-2 rounded-lg">
                    <div className="text-xs text-[var(--nb-text-muted)] font-bold mb-1">
                      OUI Prefixes:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {manufacturers[selectedClientManufacturer]!.map(
                        (prefix) => (
                          <Badge
                            key={prefix}
                            color="cyan"
                            className="font-mono text-[10px]"
                          >
                            {prefix}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="text-xs text-[var(--nb-text-muted)]">
              {clientMode === "manual"
                ? "Specific client MAC address"
                : "Target all clients from selected manufacturer"}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 font-bold uppercase text-sm tracking-wider rounded-md neobrutalist-btn-danger ${!canSubmit ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Crosshair className="w-4 h-4" />
            {(() => {
              if (
                apMode === "manufacturer" &&
                selectedApManufacturer &&
                clientMode === "manufacturer" &&
                selectedClientManufacturer
              ) {
                return `Deauth ${selectedApManufacturer} APs → ${selectedClientManufacturer} Clients`;
              } else if (apMode === "manufacturer" && selectedApManufacturer) {
                return `Deauth ${selectedApManufacturer} APs`;
              } else if (
                clientMode === "manufacturer" &&
                selectedClientManufacturer
              ) {
                return `Deauth ${selectedClientManufacturer} Clients`;
              } else if (
                apMode === "manual" &&
                !accessPoint &&
                clientMode === "manual" &&
                !client
              ) {
                return "Broadcast";
              } else {
                return "Enable Deauth";
              }
            })()}
          </button>
        </div>
      </Card>

      <DeauthFeatureList />

      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <Card className="w-full max-w-md border-4 border-red-600">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 border-2 border-[var(--nb-border)] bg-red-500 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold">Dangerous Operation</h3>
                </div>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="p-1 rounded-lg hover:bg-red-500 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-red-600 p-4 rounded-lg">
                  <div className="text-red-600 font-bold mb-2">
                    WARNING: Broadcast Deauth
                  </div>
                  <p className="text-sm">
                    You are about to enable a{" "}
                    <span className="font-bold text-red-600">
                      broadcast deauthentication attack
                    </span>
                    .
                  </p>
                  <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                    <li>
                      This will target{" "}
                      <span className="font-bold">ALL devices</span> on the
                      network
                    </li>
                    <li>Can cause widespread network disruption</li>
                    <li>May be detected as malicious activity</li>
                    <li>Use only for authorized testing</li>
                  </ul>
                </div>

                <div className="border-2 border-[var(--nb-border)] p-3 rounded-lg">
                  <div className="text-xs uppercase text-[var(--nb-text-muted)] font-bold mb-1">
                    Configuration
                  </div>
                  <div className="text-sm font-mono space-y-1">
                    <div>Channel: {channel || "All"}</div>
                    <div>
                      Access Point: <span className="text-red-600">ANY</span>
                    </div>
                    <div>
                      Client: <span className="text-red-600">ANY</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 neobrutalist-btn-outline font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="flex-1 px-4 py-2 neobrutalist-btn-danger flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Proceed
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
