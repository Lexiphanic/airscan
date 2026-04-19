import Header from "./components/Header.tsx";
import Console from "./components/Console.tsx";
import TransportSettingsModal from "./components/modal/TransportSettingsModal.tsx";
import useTransportDialogState from "./store/selectors/useTransportDialogState.ts";
import useAppStore from "./store/useAppStore.ts";
import useTransportConfig from "./store/selectors/useTransportConfig.ts";
import Dashboard from "./components/Dashboard.tsx";
import Welcome from "./components/Welcome.tsx";
import useSearchTermFromUrl from "./hooks/useSearchTermFromUrl.ts";

export default function App() {
  useSearchTermFromUrl();
  const transportDialogState = useTransportDialogState();
  const transportConfig = useTransportConfig();
  const setTransportDialogState = useAppStore(
    (state) => state.setTransportDialogState,
  );
  const setTransportConfig = useAppStore((state) => state.setTransportConfig);

  return (
    <div className="min-h-screen text-(--nb-text) selection:bg-(--nb-accent) selection:text-(--nb-bg)">
      <TransportSettingsModal
        config={transportConfig}
        isOpen={transportDialogState === "open"}
        onClose={() => setTransportDialogState("closed")}
        onSave={(config) => setTransportConfig(config)}
      />
      <Header />

      {transportConfig.type === "none" ? <Welcome /> : <Dashboard />}

      <Console />
    </div>
  );
}
