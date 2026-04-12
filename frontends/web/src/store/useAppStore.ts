import { create } from 'zustand';
import { createEngine, type Engine } from '@airscan/engine/engine.ts';
import { createTransport } from '../transport/factory.ts';
import type { ITransport, TransportConfig } from '@airscan/types/Transport';
import type { EnabledFeature } from '@airscan/types/EnabledFeature';

let currentEngine: Engine | null = null;
let currentTransport: ITransport | null = null;

const getOrCreateEngine = (): Engine => {
  if (!currentEngine) {
    currentEngine = createEngine({
      onFeatureEnable: (feature) => {
        currentTransport?.enableFeature(feature);
      },
      onFeatureDisable: (feature) => {
        currentTransport?.disableFeature(feature);
      },
    });
  }
  return currentEngine;
};

export interface AppState {
  transport: ITransport | null;
  transportDialogState: 'open' | 'closed';
  transportConfig: TransportConfig;
  transportState: 'connected' | "connecting" | "reconnecting" | "disconnected";

  engine: Engine;

  setTransportDialogState: (state: 'open' | 'closed') => void;
  setTransportConfig: (config: TransportConfig) => void;
  toggleScanning: () => void;

  addEnabledFeature: (feature: EnabledFeature) => void;
  removeEnabledFeature: (feature: EnabledFeature) => void;
  resumeEnabledFeature: (feature: EnabledFeature) => void;
  pauseEnabledFeature: (feature: EnabledFeature) => void;

  connect: () => void;
  disconnect: () => void;
}

export const useAppStore = create<AppState>((set, get) => {
  const engine = getOrCreateEngine();

  return {
    transport: null,
    transportDialogState: 'closed',
    transportConfig: { type: 'none' },
    transportState: 'disconnected',

    engine,

    setTransportDialogState: (state) => set({ transportDialogState: state }),
    setTransportConfig: (config) => set({ transportConfig: config }),

    addEnabledFeature: (feature) => {
      engine.addEnabledFeature(feature);
    },

    removeEnabledFeature: (feature) => {
      engine.removeEnabledFeature(feature);
    },

    resumeEnabledFeature: (feature) => {
      engine.resumeEnabledFeature(feature);
    },

    pauseEnabledFeature: (feature) => {
      engine.pauseEnabledFeature(feature);
    },

    toggleScanning: () => {
      const { transport, engine } = get();
      if (!transport) return;

      // Check if scan feature is already enabled
      const enabledFeatures = engine.store.getState().enabledFeatures;
      const scanFeature = enabledFeatures.find(f => f.type === 'scan');
      
      if (scanFeature) {
        // Stop scanning - engine will call transport.disableFeature via onFeatureDisable callback
        engine.removeEnabledFeature(scanFeature);
      } else {
        // Start scanning - engine will call transport.enableFeature via onFeatureEnable callback
        engine.addEnabledFeature({
          type: "scan",
          options: {
            channels: [44],
          }
        });
      }
    },

    connect: () => {
      const { transportConfig } = get();

      const transport = createTransport(transportConfig, {
        ...engine.callbacks,
        onConnect: () => set({ transportState: "connected" }),
        onDisconnect: () => set({ transportState: "disconnected", transport: null }),
      });

      if (transport) {
        currentTransport = transport;
        transport.connect();
        set({ transportState: "connecting", transport });
      }
    },

    disconnect: () => {
      get().transport?.disconnect();
      currentTransport = null;
      set({ transport: null, transportState: "disconnected" });
    },
  };
});

export default useAppStore;
