import ouiData from '../data/oui.json';
import { useMemo } from "react";

export default function useGroupedManufacturers() {
  return useMemo(() => {
    const results: Record<string, string[]> = {};
    Object.entries(ouiData).forEach((entry) => {
      const [mac, name] = entry;
      if (!results[name]) {
        results[name] = [];
      }
      const formatted = mac.toLowerCase().match(/.{1,2}/g)?.join(':') ?? mac;
      results[name]!.push(formatted);
    });

    return Object.keys(results)
      .filter(key => results[key]!.length > 2)
      .sort((a, b) => a.localeCompare(b))
      .reduce<Record<string, string[]>>((acc, key) => {
        acc[key] = results[key]!.slice().sort((x, y) => x.localeCompare(y));
        return acc;
      }, {});
  }, []);
}
