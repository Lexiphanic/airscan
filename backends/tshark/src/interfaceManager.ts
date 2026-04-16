import { exec } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile } from "node:fs/promises";

const execAsync = promisify(exec);

const NM_CONFIG_PATH = "/etc/NetworkManager/NetworkManager.conf";

export default class InterfaceManager {
  private getMonitorInterface(interfaceName: string): string {
    return interfaceName.endsWith("mon")
      ? interfaceName
      : `${interfaceName}mon`;
  }

  async isMonitorMode(interfaceName: string): Promise<boolean> {
    try {
      const monitorIface = this.getMonitorInterface(interfaceName);
      const { stdout } = await execAsync(`iw dev ${monitorIface} info`);
      return stdout.includes("type monitor");
    } catch {
      return false;
    }
  }

  private async configureNetworkManager(interfaceName: string): Promise<void> {
    const content = await readFile(NM_CONFIG_PATH, "utf-8");
    const unmanagedEntry = `interface-name:${interfaceName}*`;

    let updatedContent = content;

    if (!updatedContent.includes("[keyfile]")) {
      updatedContent += "\n[keyfile]\n";
    }

    const keyfileMatch = updatedContent.match(/\[keyfile\]([^[]*)/);
    if (keyfileMatch?.[1]) {
      const keyfileSection = keyfileMatch[1];
      if (keyfileSection.includes("unmanaged-devices")) {
        updatedContent = updatedContent.replace(
          /(unmanaged-devices=)(.*?)(\n|$)/,
          (_, key, value) => `${key}${value}${unmanagedEntry};`,
        );
      } else {
        updatedContent = updatedContent.replace(
          /\[keyfile\]/,
          `[keyfile]\nunmanaged-devices=${unmanagedEntry}`,
        );
      }
    }

    await writeFile(NM_CONFIG_PATH, updatedContent);
    console.log(`Added ${interfaceName} to NetworkManager unmanaged devices`);
    await execAsync("systemctl restart NetworkManager");
    console.log("Restarted NetworkManager");
  }

  async setMonitorMode(interfaceName: string): Promise<void> {
    const { stdout: checkOut } = await execAsync("airmon-ng check");
    if (checkOut.trim()) {
      console.log("airmon-ng check warnings:\n" + checkOut);
      if (checkOut.includes("NetworkManager")) {
        await this.configureNetworkManager(interfaceName);
      }
    }
    await execAsync(`airmon-ng start ${interfaceName}`);
  }

  async stopMonitorMode(interfaceName: string): Promise<void> {
    const monitorIface = this.getMonitorInterface(interfaceName);
    await execAsync(`airmon-ng stop ${monitorIface}`);
  }

  async autoSetup(interfaceName: string): Promise<boolean> {
    if (await this.isMonitorMode(interfaceName)) {
      console.log(`Interface ${interfaceName} is already in monitor mode`);
      return false;
    }
    console.log(`Setting ${interfaceName} to monitor mode...`);
    await this.setMonitorMode(interfaceName);
    console.log(`Interface ${interfaceName} is now in monitor mode`);

    return true;
  }
}
