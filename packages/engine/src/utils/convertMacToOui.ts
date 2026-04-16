export default function convertMacToOui(mac: string): string {
  return mac.replace(/[:-]/g, "").slice(0, 6).toUpperCase();
}
