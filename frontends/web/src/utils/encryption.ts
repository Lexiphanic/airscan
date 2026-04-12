export function getEncryptionColor(enc: string): string {
  if ((enc ?? '').trim() === '') {
    return "text-gray-400";
  }
  if (enc === "OPEN" || enc === "WEP") return "text-red-400";
  if (enc.includes("WPA3")) return "text-emerald-400";
  if (enc.includes("WPA2")) return "text-blue-400";

  return "text-yellow-400";
};