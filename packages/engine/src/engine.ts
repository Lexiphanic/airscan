import { create } from 'zustand';
import type { DeviceConfig } from '@airscan/types/Device';
import type { AccessPointsMap } from '@airscan/types/AccessPoint';
import type { ClientsMap } from '@airscan/types/Client';
import type { LogEntry } from '@airscan/types/Logs';
import type { EnabledFeature, EnabledFeatureDeauthType } from '@airscan/types/EnabledFeature';

export interface EngineCallbacks {
  setDeviceConfig: (deviceConfig: DeviceConfig) => void;
  addAccessPoints: (accessPoints: AccessPointsMap) => void;
  addClients: (clients: ClientsMap) => void;
  addLog: (message: string, type: LogEntry['type']) => void;
  addEnabledFeature: (feature: EnabledFeature) => void;
  removeEnabledFeature: (feature: EnabledFeature) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export interface EngineState {
  deviceConfig: DeviceConfig;
  accessPoints: AccessPointsMap;
  clients: ClientsMap;
  searchTerm: string;
  logs: LogEntry[];
  enabledFeatures: EnabledFeature[];

  setSearchTerm: (term: string) => void;
  setDeviceConfig: (deviceConfig: DeviceConfig) => void;
  setAccessPoints: (accessPoints: AccessPointsMap) => void;
  addAccessPoints: (accessPoints: AccessPointsMap) => void;
  setClients: (clients: ClientsMap) => void;
  addClients: (clients: ClientsMap) => void;
  addLog: (message: string, type: LogEntry['type']) => void;
  clearLogs: () => void;
  addEnabledFeature: (feature: EnabledFeature) => void;
  removeEnabledFeature: (feature: EnabledFeature) => void;
  updateEnabledFeature: (feature: EnabledFeature) => void;
}

const generateId = () => Math.random().toString(36).slice(2, 11);

const deepMerge = <T extends object>(target: T, source: Partial<T>): T => {
  const result = { ...target } as Record<string, unknown>;
  for (const key of Object.keys(source)) {
    const sourceValue = source[key as keyof T];
    const targetValue = result[key];
    if (
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue !== null &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as object,
        sourceValue as object
      );
    } else if (key === 'probes' && Array.isArray(sourceValue) && Array.isArray(targetValue)) {
      const newProbes = sourceValue.filter((p): p is string => p !== '' && p.trim() !== '');
      const existingProbes = new Set(targetValue);
      const mergedProbes = [...targetValue];
      for (const probe of newProbes) {
        if (!existingProbes.has(probe)) {
          mergedProbes.push(probe);
        }
      }
      result[key] = mergedProbes;
    } else if (Array.isArray(sourceValue) && Array.isArray(targetValue) && sourceValue.length === 0) {
      continue;
    } else if (sourceValue !== undefined) {
      if (sourceValue === null && targetValue !== undefined) {
        continue;
      }
      result[key] = sourceValue;
    }
  }
  return result as T;
};

export const createEngineStore = () => {
  return create<EngineState>((set, get) => ({
    deviceConfig: {
      id: "unknown",
      name: "unknown",
      driver: "unknown",
      features: [],
    },
    accessPoints: {},
    clients: {},
    searchTerm: '',
    logs: [],
    enabledFeatures: [],

    setSearchTerm: (term) => set({ searchTerm: term }),
    setDeviceConfig: (deviceConfig) => set({ deviceConfig }),
    setAccessPoints: (accessPoints) => set({ accessPoints }),
    addAccessPoints: (accessPoints) => set((state) => {
      const merged: AccessPointsMap = { ...state.accessPoints };
      for (const [mac, newAp] of Object.entries(accessPoints)) {
        const existing = merged[mac];
        if (existing) {
          merged[mac] = {
            ...newAp,
            packetCount: (existing.packetCount ?? 0) + 1,
          };
        } else {
          merged[mac] = {
            ...newAp,
            packetCount: 1,
          };
        }
      }
      return { accessPoints: merged };
    }),
    setClients: (clients) => set({ clients }),
    addClients: (clients) => set((state) => {
      const merged: ClientsMap = { ...state.clients };
      for (const [mac, newClient] of Object.entries(clients)) {
        const existing = merged[mac];
        if (existing) {
          merged[mac] = {
            ...newClient,
            packetCount: (existing.packetCount ?? 0) + 1,
          };
        } else {
          merged[mac] = {
            ...newClient,
            packetCount: 1,
          };
        }
      }
      return { clients: merged };
    }),

    addLog: (message, type) => set((state) => ({
      logs: [{
        timestamp: new Date(),
        message,
        type
      }, ...state.logs].slice(0, 50)
    })),

    clearLogs: () => set({ logs: [] }),

    addEnabledFeature: (feature) => set((state) => ({
      enabledFeatures: [feature, ...state.enabledFeatures]
    })),

    removeEnabledFeature: (feature) => set((state) => ({
      enabledFeatures: state.enabledFeatures.filter(currentFeature => currentFeature.id !== feature.id)
    })),

    updateEnabledFeature: (feature) => set((state) => ({
      enabledFeatures: state.enabledFeatures.map(
        currentFeature =>
          currentFeature.id === feature.id ? feature : currentFeature
      )
    })),
  }));
};

export type EngineStore = ReturnType<typeof createEngineStore>;

export interface Engine {
  store: EngineStore;
  callbacks: EngineCallbacks;
  addEnabledFeature: (feature: Omit<EnabledFeature, 'id' | 'isActive'>) => EnabledFeature;
  removeEnabledFeature: (feature: EnabledFeature) => void;
  resumeEnabledFeature: (feature: EnabledFeature) => void;
  pauseEnabledFeature: (feature: EnabledFeature) => void;
}

let globalEngine: Engine | undefined = undefined;

export const createEngine = (
  transportCallbacks?: {
    onFeatureEnable?: (feature: EnabledFeature) => void;
    onFeatureDisable?: (feature: EnabledFeature) => void;
  }
): Engine => {
  if (globalEngine) {
    return globalEngine;
  }

  const store = engineStore;

  const callbacks: EngineCallbacks = {
    setDeviceConfig: store.getState().setDeviceConfig,
    addAccessPoints: store.getState().addAccessPoints,
    addClients: store.getState().addClients,
    addLog: store.getState().addLog,
    addEnabledFeature: store.getState().addEnabledFeature,
    removeEnabledFeature: store.getState().removeEnabledFeature,
  };

  const addEnabledFeature = (feature: Omit<EnabledFeature, 'id' | 'isActive'>): EnabledFeature => {
    const newFeature: EnabledFeature = {
      ...feature,
      id: generateId(),
      isActive: true,
    } as EnabledFeature;

    transportCallbacks?.onFeatureEnable?.(newFeature);

    let logMessage = `Enabled feature: type="${feature.type}"`;
    if (feature.type === 'deauth') {
      const opts = (feature as EnabledFeatureDeauthType).options;
      logMessage += `, AP="${opts.accessPoint || 'any'}", STA="${opts.station || 'any'}", CH=${opts.channel || 'any'}`;
    } else if (feature.type === 'scan') {
      logMessage += ' (WiFi scanning)';
    // } else if (feature.type === 'fake-ap') {
    //   const opts = feature.options as { essid: string; channel: number };
    //   logMessage += `, ESSID="${opts.essid}", CH=${opts.channel}`;
    }

    store.getState().addLog(logMessage, 'success');

    store.getState().addEnabledFeature(newFeature);
    return newFeature;
  };

  const removeEnabledFeature = (feature: EnabledFeature): void => {
    transportCallbacks?.onFeatureDisable?.(feature);

    let logMessage = `Disabled feature: ${feature.type}`;
    if (feature.type === 'deauth') {
      const opts = feature.options as { accessPoint: string; station: string; channel: number };
      logMessage += ` (${opts.accessPoint || opts.station || 'wildcard'})`;
    } else if (feature.type === 'scan') {
      logMessage += ' (WiFi scanning)';
    // } else if (feature.type === 'fake-ap') {
    //   const opts = feature.options as { essid: string; channel: number };
    //   logMessage += ` (${opts.essid})`;
    }

    store.getState().addLog(logMessage, 'info');
    store.getState().removeEnabledFeature(feature);
  };

  const resumeEnabledFeature = (feature: EnabledFeature): void => {
    const updatedFeature = { ...feature, isActive: true };
    store.getState().updateEnabledFeature(updatedFeature);
    transportCallbacks?.onFeatureEnable?.(updatedFeature);
  };

  const pauseEnabledFeature = (feature: EnabledFeature): void => {
    const updatedFeature = { ...feature, isActive: false };
    store.getState().updateEnabledFeature(updatedFeature);
    transportCallbacks?.onFeatureDisable?.(updatedFeature);
  };

  globalEngine = {
    store,
    callbacks,
    addEnabledFeature,
    removeEnabledFeature,
    resumeEnabledFeature,
    pauseEnabledFeature,
  };

  return globalEngine;
};

export const engineStore = createEngineStore();
export const useEngineStore = engineStore;

export default createEngineStore;
