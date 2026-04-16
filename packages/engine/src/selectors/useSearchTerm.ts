import { useEngineStore } from "../engine.ts";

export default function useSearchTerm(): string {
  return useEngineStore((state) => state.searchTerm);
}
