const WifiScannerPs1 = `
# Wifi Scanner
## Outputs in JSON using START and STOP markers for scan results.

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$AsTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | ? { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1' })[0]
[Windows.Devices.WiFi.WiFiAdapter,Windows.Devices.WiFi,ContentType = WindowsRuntime] | Out-Null

# Required to utilise UWP async methods
Function Wait-RunTimeTask($WinRtTask, $ResultType) 
{
    # https://fleexlab.blogspot.com/2018/02/using-winrts-iasyncoperation-in.html  
    $AsTask = $AsTaskGeneric.MakeGenericMethod($ResultType)
    $NetTask = $AsTask.Invoke($null, @($WinRtTask))
    $NetTask.Wait(-1) | Out-Null
    $NetTask.Result
}

Function Get-WiFiDeviceInfo
{
    [CmdletBinding()]
    param()
    
    $deviceInfo = @{
        name = "Unknown"
        driver = "Unknown"
        id = "Unknown"
    }
    
    try {
        $wifiAdapter = Get-NetAdapter | Where-Object { 
            $_.PhysicalMediaType -eq 'Native 802.11' -or 
            $_.PhysicalMediaType -eq 'Wireless LAN' -or
            $_.InterfaceDescription -match 'wi-fi|wireless|wlan|802.11'
        } | Select-Object -First 1
        
        if ($wifiAdapter) {
            $deviceInfo['id'] = $wifiAdapter.InterfaceGuid.ToString()
            $deviceInfo['name'] = $wifiAdapter.Name
            $deviceInfo['driver'] = $wifiAdapter.InterfaceDescription
        }
    } catch {
        # Silently fail and return defaults
    }
    
    return $deviceInfo
}

Function Get-WiFiAdapter
{
    [CmdletBinding()]
    param()
    # Check that we have access to the Adapters
    if(Wait-RunTimeTask ([Windows.Devices.WiFi.WiFiAdapter]::RequestAccessAsync()) ([Windows.Devices.WiFi.WiFiAccessStatus]))
    {
        # Check that there is a WiFi adaptor
        if($WiFiAdapterList = Wait-RunTimeTask ([Windows.Devices.Enumeration.DeviceInformation]::FindAllAsync([Windows.Devices.WiFi.WiFiAdapter]::GetDeviceSelector())) ([Windows.Devices.Enumeration.DeviceInformationCollection]))
        {
            # Grab the first WiFi adapter ID
            Wait-RunTimeTask ([Windows.Devices.WiFi.WiFiAdapter]::FromIdAsync($WiFiAdapterList[0].Id)) ([Windows.Devices.WiFi.WiFiAdapter])
        }
        else
        {
            throw "No adapters found"
        }
    }
    else
    {
        throw "Access denied"
    }
}

Function Invoke-WiFiScan
{
    [CmdletBinding()]
    param()
    
    [Void](Get-WiFiAdapter).ScanAsync()
}

Function Convert-FrequencyToChannel
{
    param([int]$frequencyKhz)
    
    $freqMhz = $frequencyKhz / 1000
    
    # 2.4 GHz band (Channels 1-14)
    if ($freqMhz -eq 2484) {
        return 14  # Special case for Japan
    }
    elseif ($freqMhz -ge 2412 -and $freqMhz -le 2484) {
        return [math]::Round(($freqMhz - 2412) / 5) + 1
    }
    # 5 GHz band (Channels 36-165, with gaps)
    elseif ($freqMhz -ge 5170 -and $freqMhz -le 5825) {
        # UNII-1: 36, 40, 44, 48 (5180, 5200, 5220, 5240)
        # UNII-2A: 52, 56, 60, 64 (5260, 5280, 5300, 5320)
        # UNII-2C: 100-144 (5500-5720)
        # UNII-3: 149-165 (5745-5825)
        return [math]::Round(($freqMhz - 5000) / 5)
    }
    # 6 GHz band (Wi-Fi 6E/7, Channels 1-233)
    elseif ($freqMhz -ge 5925 -and $freqMhz -le 7125) {
        if ($freqMhz -eq 5935) {
            return 2  # Special case
        }
        return [math]::Round(($freqMhz - 5950) / 5) + 1
    }
    else {
        return $null  # Unknown frequency
    }
}

# Get device info once at startup
$deviceInfo = Get-WiFiDeviceInfo
$deviceResult = @{
    device = $deviceInfo
} | ConvertTo-Json -Depth 10 -Compress;

# Output with Start and Stop markers
Write-Host $StartMarker
Write-Host $deviceResult;
Write-Host $EndMarker

while ($true) {
    try {
        Invoke-WiFiScan;
        Start-Sleep -Seconds 2;
        $adapter = Get-WiFiAdapter;
        $report = $adapter.NetworkReport;
        $timestamp = $report.Timestamp.UtcTicks;

        $accessPoints = @();
        foreach ($net in $report.AvailableNetworks) {
            $channel = Convert-FrequencyToChannel -frequencyKhz $net.ChannelCenterFrequencyInKilohertz
            $accessPoints += @{
                bssid = $net.Bssid;
                ssid = $net.SSID;
                channel = $channel;
                rssi = $net.NetworkRssiInDecibelMilliwatts;
                authentication = $net.SecuritySettings.NetworkAuthenticationType.ToString().ToUpper();
                encryption = $net.SecuritySettings.NetworkEncryptionType.ToString().ToUpper();
                beaconInterval = $net.BeaconInterval.TotalMilliseconds;
                uptime = $net.Uptime.TotalSeconds;
            };
        }

        # Output as single line JSON using -Compress
        $result = @{
            timestamp = $timestamp;
            accessPoints = $accessPoints;
        } | ConvertTo-Json -Depth 10 -Compress;

        # Output with Start and Stop markers
        Write-Host $StartMarker
        Write-Host $result;
        Write-Host $EndMarker
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)";
    }
    Start-Sleep -Seconds 2;
}
`;

export default WifiScannerPs1;
