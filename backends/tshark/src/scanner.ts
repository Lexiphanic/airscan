import type { AccessPoint } from "@airscan/types/AccessPoint";
import type { Client } from "@airscan/types/Client";
import type { WebSocketApi } from "@airscan/types/Api/WebSocket";

interface TsharkCsvRow {
  "frame.time_epoch": string;
  "wlan.ta": string;
  "wlan.ra": string;
  "wlan.sa": string;
  "wlan.da": string;
  "wlan.bssid": string;
  "wlan.ssid": string;
  "radiotap.dbm_antsignal": string;
  "wlan_radio.channel": string;
  "wlan.fixed.capabilities": string;
  "wlan.rsn.pcs.type": string;
  "wlan.rsn.gcs.type": string;
  "wlan.rsn.akms.type": string;
  "wlan.wfa.ie.wpa.ucs.type": string;
  "wlan.wfa.ie.wpa.mcs.type": string;
  "wlan.wfa.ie.wpa.akms.type": string;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

const cleanValue = (val: string | undefined): string => {
  const cleaned = val?.replace(/^"|"$/g, "") ?? "";
  if (cleaned === "<MISSING>") return "";
  return cleaned;
};

const isFromAccessPoint = (row: TsharkCsvRow): boolean => {
  return (
    row["wlan.sa"] === row["wlan.bssid"] &&
    row["wlan.sa"] !== "<MISSING>" &&
    row["wlan.sa"] !== ""
  );
};

const CIPHER_SUITE: Record<number, string> = {
  1: "WEP-40",
  2: "TKIP",
  3: "WRAP",
  4: "CCMP",
  5: "WEP-104",
  7: "GCMP",
  11: "GCMP-256",
  12: "CCMP-256",
};

const AKM_SUITE: Record<number, string> = {
  1: "PMK",
  2: "PSK",
  3: "FT/PMK",
  4: "FT/PSK",
  5: "PMK+SHA256",
  6: "PSK+SHA256",
  8: "SAE",
  9: "FT/SAE",
  10: "PMK-P256",
  11: "PMK-P384",
  12: "PMK-P521",
  18: "OWE",
};

function mapValue(val: string, map: Record<number, string>): string {
  if (!val) return "";
  const num = parseInt(val, 10);
  if (!isNaN(num) && map[num]) return map[num];
  return val;
}

function parseAuthEncryption(
  capabilities: string,
  rsnPairwise: string,
  rsnGroup: string,
  rsnAkm: string,
  wpaPairwise: string,
  wpaGroup: string,
  wpaAkm: string,
): { authentication: string; encryption: string } | null {
  const hasRsn = rsnPairwise !== "" || rsnGroup !== "" || rsnAkm !== "";
  const hasWpa = wpaPairwise !== "" || wpaGroup !== "" || wpaAkm !== "";
  const capsNum = parseInt(capabilities, 16);
  const privBit =
    capabilities !== "" && !isNaN(capsNum) && (capsNum & 0x10) !== 0;

  if (!hasRsn && !hasWpa && !privBit) return null;

  let authentication = "UNK";
  let encryption = "UNK";

  if (hasRsn) {
    const akm = mapValue(rsnAkm, AKM_SUITE);
    const cipher = mapValue(rsnPairwise, CIPHER_SUITE);

    if (akm === "SAE" || akm === "FT/SAE") {
      authentication = "WPA3";
    } else if (akm === "OWE") {
      authentication = "OWE";
    } else if (hasWpa) {
      authentication = "WPA2/WPA3";
    } else {
      authentication = "WPA2";
    }

    encryption = cipher || "CCMP";
  } else if (hasWpa) {
    authentication = "WPA";
    encryption = mapValue(wpaPairwise, CIPHER_SUITE) || "TKIP";
  } else if (privBit) {
    authentication = "WEP";
    encryption = "WEP";
  }

  return { authentication, encryption };
}

const decodeSsid = (ssid: string): string => {
  if (/^[0-9a-fA-F]+$/.test(ssid)) {
    try {
      return Buffer.from(ssid, "hex").toString("utf8");
    } catch {
      return ssid;
    }
  }
  return ssid;
};

interface ParsedRow {
  type: "accessPoint" | "client";
  bssid: string;
  ssid: string;
  mac: string;
  rssi: number;
  channel: number;
  authEnc: { authentication: string; encryption: string } | null;
  raw: {
    transmitter: string;
    receiver: string;
    source: string;
    destination: string;
  };
}

function parseRow(headers: string[], values: string[]): ParsedRow | null {
  if (values.length !== headers.length) return null;

  const row = headers.reduce((obj, header, index) => {
    obj[header as keyof TsharkCsvRow] = cleanValue(values[index]);
    return obj;
  }, {} as TsharkCsvRow);

  const bssid = row["wlan.bssid"];
  if (!bssid || bssid === "ff:ff:ff:ff:ff:ff") return null;

  const isAp = isFromAccessPoint(row);
  const ssidText = decodeSsid(row["wlan.ssid"]);
  const channel = parseInt(row["wlan_radio.channel"], 10);
  const mac = isAp ? bssid : row["wlan.sa"];

  if (!mac) return null;

  const authEnc = parseAuthEncryption(
    row["wlan.fixed.capabilities"],
    row["wlan.rsn.pcs.type"],
    row["wlan.rsn.gcs.type"],
    row["wlan.rsn.akms.type"],
    row["wlan.wfa.ie.wpa.ucs.type"],
    row["wlan.wfa.ie.wpa.mcs.type"],
    row["wlan.wfa.ie.wpa.akms.type"],
  );

  return {
    type: isAp ? "accessPoint" : "client",
    bssid,
    ssid: ssidText,
    mac,
    rssi: Math.abs(parseInt(row["radiotap.dbm_antsignal"], 10)),
    channel,
    authEnc,
    raw: {
      transmitter: row["wlan.ta"],
      receiver: row["wlan.ra"],
      source: row["wlan.sa"],
      destination: row["wlan.da"],
    },
  };
}

function buildAccessPointResponse(parsed: ParsedRow): WebSocketApi {
  const accessPoint: AccessPoint = {
    bssid: parsed.bssid,
    ssid: parsed.ssid,
    rssi: parsed.rssi,
    channel: parsed.channel,
    encryption: parsed.authEnc?.encryption ?? "UNK",
    authentication: parsed.authEnc?.authentication ?? "UNK",
  };

  return {
    type: "addAccessPoints",
    accessPoints: {
      [accessPoint.bssid]: accessPoint,
    },
  };
}

function buildClientResponse(parsed: ParsedRow): WebSocketApi {
  const probes = parsed.ssid ? [parsed.ssid] : [];
  const client: Client = {
    mac: parsed.mac,
    bssid: [parsed.bssid],
    probes,
    rssi: parsed.rssi,
  };

  return {
    type: "addClients",
    clients: {
      [client.mac]: client,
    },
  };
}

export default function startScanner(
  interfaceName: string,
  channel: string | undefined,
  callback: (response: WebSocketApi) => void,
) {
  const ps = Bun.spawn({
    cmd: [
      "tshark",
      "-i",
      interfaceName,
      // "-I", // monitor mode (doesn't work well, just put in monitor mode yourself or use --mode auto)
      "-T",
      "fields",
      "-e",
      "frame.time_epoch",
      "-e",
      "wlan.ta",
      "-e",
      "wlan.ra",
      "-e",
      "wlan.sa",
      "-e",
      "wlan.da",
      "-e",
      "wlan.bssid",
      "-e",
      "wlan.ssid",
      "-e",
      "radiotap.dbm_antsignal",
      "-e",
      "wlan_radio.channel",
      "-e",
      "wlan.fixed.capabilities",
      "-e",
      "wlan.rsn.pcs.type",
      "-e",
      "wlan.rsn.gcs.type",
      "-e",
      "wlan.rsn.akms.type",
      "-e",
      "wlan.wfa.ie.wpa.ucs.type",
      "-e",
      "wlan.wfa.ie.wpa.mcs.type",
      "-e",
      "wlan.wfa.ie.wpa.akms.type",
      "-E",
      "header=y",
      "-E",
      "separator=,",
      "-E",
      "quote=d",
      "-E",
      "occurrence=f",
    ],
    stdout: "pipe",
    stderr: "pipe",
  });

  let buffer = "";
  let headers: string[] | null = null;

  const processLine = (line: string): void => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (!headers) {
      headers = parseCsvLine(trimmed).map(cleanValue);
      console.log("CSV headers:", headers);
      return;
    }

    const values = parseCsvLine(trimmed);
    const parsed = parseRow(headers, values);

    if (!parsed) return;

    const response =
      parsed.type === "accessPoint"
        ? buildAccessPointResponse(parsed)
        : buildClientResponse(parsed);

    callback(response);
  };

  (async () => {
    const reader = ps.stdout.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || "";

        for (const line of lines) {
          processLine(line);
        }
      }
    } catch (err) {
      console.error("Error reading stdout:", err);
    } finally {
      reader.releaseLock();
    }
  })();

  (async () => {
    const reader = ps.stderr.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        if (!text.includes("Capturing on") && !text.includes("%")) {
          console.error("tshark stderr:", text);
        }
      }
    } catch (err) {
      console.error("Error reading stderr:", err);
    } finally {
      reader.releaseLock();
    }
  })();

  return ps;
}
