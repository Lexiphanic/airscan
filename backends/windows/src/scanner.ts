import type { AccessPoint } from "@airscan/types/AccessPoint";
import type { WebSocketApi } from "@airscan/types/Api/WebSocket";
import type { DeviceConfig } from "@airscan/types/Device";
import WifiScannerPs1 from './WifiScanner.ps1.ts';

// Markers (must be longer than Network Names to prevent any false positives).
const START_MARKER = '____________START_MARKER____________';
const END_MARKER = '____________END_MARKER____________';


type DeviceResponse = {
  device: DeviceConfig
}

type ScanResponse = {
  timestamp: number,
  accessPoints: AccessPoint[],
}

export type Response = ScanResponse | DeviceResponse;

function processResponse(jsonString: string): WebSocketApi | undefined {
  try {
    const response = JSON.parse(jsonString) as Response;

    if ("device" in response) {
      return {
        type: "setDeviceConfig",
        config: response.device,
      } satisfies WebSocketApi
    }

    // Check if we have scan results
    if ("accessPoints" in response) {
      // Convert array to map keyed by BSSID
      const map: Record<string, AccessPoint> = {};
      for (const ap of response.accessPoints) {
        if (ap && ap.bssid) map[ap.bssid] = ap;
      }

      return {
        type: "addAccessPoints",
        accessPoints: map,
      } satisfies WebSocketApi;
    }


    console.warn('Unknown response: ' + jsonString.substring(0, 200));
  } catch (e) {
    console.error('Failed to parse scan result:', (e as Error).message);
    console.error('JSON string was:', jsonString.substring(0, 200));
  }

  return undefined;
}

export default function startScanner(callback: (response: WebSocketApi) => void) {
  const ps = Bun.spawn({
    cmd: [
      'powershell.exe',
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-Command',
      WifiScannerPs1
        .replace(/\$StartMarker/g, `"${START_MARKER}"`)
        .replace(/\$EndMarker/g, `"${END_MARKER}"`),
    ],
    stdout: 'pipe',
    stderr: 'pipe',
  });

  let buffer = '';
  let collectingJson = false;
  let jsonBuffer = '';

  // Read stdout
  (async () => {
    const reader = ps.stdout.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process line by line
        const lines = buffer.split(/\r?\n/);
        // Keep last partial line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();

          if (trimmed === START_MARKER) {
            collectingJson = true;
            jsonBuffer = '';
            continue;
          }

          if (trimmed === END_MARKER) {
            collectingJson = false;
            const result = processResponse(jsonBuffer);
            if (result) {
              callback(result);
            }
            jsonBuffer = '';
            continue;
          }

          if (collectingJson) {
            jsonBuffer += trimmed;
          } else if (trimmed.startsWith('ERROR:')) {
            console.error('PowerShell error:', trimmed.substring(6));
          } else if (trimmed) {
            // Debug: log unexpected output
            console.log('PS:', trimmed.substring(0, 100));
          }
        }
      }
    } catch (err) {
      console.error('Error reading stdout:', err);
    }
  })();

  // Read stderr
  (async () => {
    const reader = ps.stderr.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        console.error('PowerShell stderr:', decoder.decode(value));
      }
    } catch (err) {
      console.error('Error reading stderr:', err);
    }
  })();

  return ps;
}