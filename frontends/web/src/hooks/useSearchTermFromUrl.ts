import { useEffect } from "react";
import { useEngineStore } from "@airscan/engine/engine.ts";

export default function useSearchTermFromUrl() {
  const setSearchTerm = useEngineStore((state) => state.setSearchTerm);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(hash);
      const query = params.get("q") ?? "";
      setSearchTerm(query);
    };

    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [setSearchTerm]);
}
