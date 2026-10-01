#include "web_server.h"
#include "web_assets.h"
#include "audio_ringbuf.h"
#include "audio_i2s.h"
#include "display_oled.h"
#include "stream_client.h"
#include <WiFi.h>
#include <ESPmDNS.h>
#include <Update.h>
#include <Preferences.h>

extern AppSettings g_settings;
extern RuntimeStats g_stats;
extern volatile ReceiverState g_receiverState;
extern Preferences g_preferences;
extern void savePreferences();
extern void restartStreaming();

WebServerManager& WebServerManager::instance() {
  static WebServerManager inst;
  return inst;
}

WebServerManager::WebServerManager()
  : _server(80), _mdnsStarted(false), _otaFailed(false) {
}

void WebServerManager::begin() {
  setupRoutes();
  _server.begin();
  Serial.println("[WEB] Material AMOLED Web Server started on port 80");
}

void WebServerManager::handleClient() {
  _server.handleClient();
}

void WebServerManager::beginMdnsIfNeeded() {
  if (_mdnsStarted || WiFi.status() != WL_CONNECTED) return;
  if (MDNS.begin(MDNS_HOSTNAME)) {
    MDNS.addService("http", "tcp", 80);
    _mdnsStarted = true;
    Serial.printf("[MDNS] http://%s.local/\n", MDNS_HOSTNAME);
  }
}

void WebServerManager::sendJsonResponse(int code, const String& json) {
  _server.sendHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  _server.send(code, "application/json", json);
}

void WebServerManager::handleFirmwareUpload() {
  HTTPUpload& up = _server.upload();
  if (up.status == UPLOAD_FILE_START) {
    _otaFailed = false;
    _otaError = "";
    g_receiverState = RX_UPDATING;
    StreamClient::instance().stop();
    AudioRingBuffer::instance().clear();

    if (!Update.begin(UPDATE_SIZE_UNKNOWN, U_FLASH)) {
      _otaFailed = true;
      _otaError = Update.errorString();
    }
  } else if (up.status == UPLOAD_FILE_WRITE) {
    if (!_otaFailed && Update.write(up.buf, up.currentSize) != up.currentSize) {
      _otaFailed = true;
      _otaError = Update.errorString();
    }
  } else if (up.status == UPLOAD_FILE_END) {
    if (!_otaFailed && !Update.end(true)) {
      _otaFailed = true;
      _otaError = Update.errorString();
    }
  } else if (up.status == UPLOAD_FILE_ABORTED) {
    _otaFailed = true;
    _otaError = "Upload aborted";
    Update.abort();
  }
}

void WebServerManager::setupRoutes() {
  // Main Web App (HTML_INDEX from web_assets.h)
  _server.on("/", HTTP_GET, [this]() {
    _server.sendHeader("Cache-Control", "no-store, no-cache");
    _server.send_P(200, "text/html", HTML_INDEX);
  });

  // Telemetry JSON
  _server.on("/api/status", HTTP_GET, [this]() {
    uint32_t sessionSec = (g_stats.sessionStartedMs > 0 && g_receiverState == RX_STREAMING)
      ? (millis() - g_stats.sessionStartedMs) / 1000
      : 0;

    String json = "{";
    json += "\"device\":\"" + String(DEVICE_NAME) + "\",";
    json += "\"version\":\"" + String(FIRMWARE_VERSION) + "\",";
    json += "\"state\":\"" + String(g_receiverState == RX_STREAMING ? "Streaming" : g_receiverState == RX_BUFFERING ? "Buffering" : "Ready") + "\",";
    json += "\"host\":\"" + g_settings.phoneHost + "\",";
    json += "\"mode\":\"" + String(g_settings.preferredMode == STREAM_MODE_HTTP ? "HTTP WAV" : "Raw TCP") + "\",";
    json += "\"sampleRate\":" + String(StreamClient::instance().currentFormat().sampleRate) + ",";
    json += "\"channels\":" + String(StreamClient::instance().currentFormat().channels) + ",";
    json += "\"bufferPercent\":" + String(AudioRingBuffer::instance().percentFull()) + ",";
    json += "\"underruns\":" + String(g_stats.underruns) + ",";
    json += "\"sessionSeconds\":" + String(sessionSec) + ",";
    json += "\"bytesReceived\":" + String(g_stats.bytesReceived) + ",";
    json += "\"ssid\":\"" + String(WiFi.SSID()) + "\",";
    json += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
    json += "\"rssi\":" + String(WiFi.RSSI()) + ",";
    json += "\"volume\":" + String(g_settings.volume) + ",";
    json += "\"muted\":" + String(g_settings.muted ? "true" : "false") + ",";
    json += "\"oled\":" + String(g_settings.oledEnabled ? "true" : "false");
    json += "}";
    sendJsonResponse(200, json);
  });

  // Config JSON GET
  _server.on("/api/config", HTTP_GET, [this]() {
    String json = "{";
    json += "\"host\":\"" + g_settings.phoneHost + "\",";
    json += "\"tcpPort\":" + String(g_settings.tcpPort) + ",";
    json += "\"httpPort\":" + String(g_settings.httpPort) + ",";
    json += "\"mode\":\"" + String(g_settings.preferredMode == STREAM_MODE_HTTP ? "http" : "tcp") + "\",";
    json += "\"bufferMs\":" + String(g_settings.targetBufferMs) + ",";
    json += "\"autoFallback\":" + String(g_settings.autoFallback ? "true" : "false") + ",";
    json += "\"autoReconnect\":" + String(g_settings.autoReconnect ? "true" : "false") + ",";
    json += "\"volume\":" + String(g_settings.volume) + ",";
    json += "\"muted\":" + String(g_settings.muted ? "true" : "false") + ",";
    json += "\"oled\":" + String(g_settings.oledEnabled ? "true" : "false");
    json += "}";
    sendJsonResponse(200, json);
  });

  // Config POST
  _server.on("/api/config", HTTP_POST, [this]() {
    if (_server.hasArg("host")) g_settings.phoneHost = _server.arg("host");
    if (_server.hasArg("tcpPort")) g_settings.tcpPort = _server.arg("tcpPort").toInt();
    if (_server.hasArg("httpPort")) g_settings.httpPort = _server.arg("httpPort").toInt();
    if (_server.hasArg("bufferMs")) g_settings.targetBufferMs = _server.arg("bufferMs").toInt();
    if (_server.hasArg("mode")) g_settings.preferredMode = (_server.arg("mode") == "http") ? STREAM_MODE_HTTP : STREAM_MODE_TCP;
    if (_server.hasArg("autoFallback")) g_settings.autoFallback = (_server.arg("autoFallback") == "1");
    if (_server.hasArg("autoReconnect")) g_settings.autoReconnect = (_server.arg("autoReconnect") == "1");

    savePreferences();
    restartStreaming();
    sendJsonResponse(200, "{\"ok\":true}");
  });

  // Digital Volume Control POST
  _server.on("/api/volume", HTTP_POST, [this]() {
    if (_server.hasArg("val")) {
      int v = _server.arg("val").toInt();
      if (v < 0) v = 0;
      if (v > 100) v = 100;
      g_settings.volume = (uint8_t)v;
      AudioI2S::instance().setVolume(g_settings.volume);
      DisplayOLED::instance().showVolume(g_settings.volume, g_settings.muted);
      savePreferences();
    }
    String json = "{\"ok\":true,\"volume\":" + String(g_settings.volume) + ",\"muted\":" + (g_settings.muted ? "true" : "false") + "}";
    sendJsonResponse(200, json);
  });

  // Mute Control POST
  _server.on("/api/mute", HTTP_POST, [this]() {
    if (_server.hasArg("val")) {
      g_settings.muted = (_server.arg("val") == "1" || _server.arg("val") == "true");
    } else {
      g_settings.muted = !g_settings.muted;
    }
    AudioI2S::instance().setMute(g_settings.muted);
    DisplayOLED::instance().showVolume(g_settings.volume, g_settings.muted);
    savePreferences();
    String json = "{\"ok\":true,\"volume\":" + String(g_settings.volume) + ",\"muted\":" + (g_settings.muted ? "true" : "false") + "}";
    sendJsonResponse(200, json);
  });

  // OLED Toggle
  _server.on("/api/config/oled", HTTP_POST, [this]() {
    if (_server.hasArg("oled")) {
      g_settings.oledEnabled = (_server.arg("oled") == "1");
      DisplayOLED::instance().setEnabled(g_settings.oledEnabled);
      savePreferences();
    }
    sendJsonResponse(200, "{\"ok\":true}");
  });

  // Playback Controls
  _server.on("/api/stream/discover", HTTP_GET, [this]() {
    String foundHost = "";
    uint16_t foundPort = 0;
    bool ok = StreamClient::instance().autoDiscoverHost(foundHost, foundPort);
    if (ok) {
      g_settings.phoneHost = foundHost;
      if (foundPort == 50005) g_settings.preferredMode = STREAM_MODE_TCP;
      else if (foundPort == 8080) g_settings.preferredMode = STREAM_MODE_HTTP;
      savePreferences();
      String res = "{\"ok\":true,\"found\":true,\"host\":\"" + foundHost + "\",\"port\":" + String(foundPort) + "}";
      sendJsonResponse(200, res);
    } else {
      sendJsonResponse(200, "{\"ok\":true,\"found\":false,\"message\":\"No active streamer found on subnet\"}");
    }
  });

  _server.on("/api/stream/start", HTTP_POST, [this]() {
    g_settings.streamEnabled = true;
    restartStreaming();
    sendJsonResponse(200, "{\"ok\":true}");
  });

  _server.on("/api/stream/stop", HTTP_POST, [this]() {
    g_settings.streamEnabled = false;
    StreamClient::instance().stop();
    AudioRingBuffer::instance().clear();
    g_receiverState = RX_STOPPED;
    sendJsonResponse(200, "{\"ok\":true}");
  });

  _server.on("/api/stream/reconnect", HTTP_POST, [this]() {
    restartStreaming();
    sendJsonResponse(200, "{\"ok\":true}");
  });

  _server.on("/api/wifi/reconnect", HTTP_POST, [this]() {
    WiFi.disconnect();
    WiFi.begin(DEFAULT_WIFI_SSID, DEFAULT_WIFI_PASS);
    sendJsonResponse(200, "{\"ok\":true}");
  });

  _server.on("/api/system/reboot", HTTP_POST, [this]() {
    sendJsonResponse(200, "{\"ok\":true,\"message\":\"Rebooting\"}");
    delay(200);
    ESP.restart();
  });

  // OTA Firmware Upload
  _server.on("/api/ota", HTTP_POST, [this]() {
    if (_otaFailed) {
      sendJsonResponse(500, "{\"ok\":false,\"error\":\"" + _otaError + "\"}");
    } else {
      sendJsonResponse(200, "{\"ok\":true,\"message\":\"Update complete\"}");
      delay(500);
      ESP.restart();
    }
  }, [this]() {
    handleFirmwareUpload();
  });
}
