import ouiData from '../data/oui.json';

export default function getManufacturerByMac(mac: string): string | null {
  const oui = mac.replace(/[:-]/g, '').slice(0, 6).toLowerCase();
  return ouiData[oui as keyof typeof ouiData] ?? null;
}
