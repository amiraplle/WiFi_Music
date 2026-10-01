#include "stream_client.h"
#include "audio_ringbuf.h"
#include "audio_i2s.h"
#include <WiFi.h>

extern AppSettings g_settings;
extern RuntimeStats g_stats;
extern volatile ReceiverState g_receiverState;
extern volatile bool g_bufferStarted;

StreamClient& StreamClient::instance() {
  static StreamClient inst;
  return inst;
}

StreamClient::StreamClient() : _lastRxMs(0) {
}

void StreamClient::begin() {
  _client.setTimeout(3); // 3 seconds timeout
}

void StreamClient::stop() {
  _client.stop();
}

bool StreamClient::isConnected() {
  return _client.connected();
}

bool StreamClient::readExact(uint8_t* buf, size_t len, uint32_t timeoutMs) {
  size_t got = 0;
  uint32_t start = millis();
  while (got < len) {
    int av = _client.available();
    if (av > 0) {
      size_t toRead = min((size_t)av, (size_t)(len - got));
      int n = _client.read(buf + got, toRead);
      if (n > 0) {
        got += n;
        start = millis();
      }
    } else {
      if (!_client.connected() || (millis() - start > timeoutMs)) {
        return false;
      }
      delay(1);
    }
  }
  return got == len;
}

bool StreamClient::readLine(String& line, uint32_t timeoutMs) {
  line = "";
  uint32_t start = millis();
  while (_client.connected() && (millis() - start < timeoutMs)) {
    if (_client.available()) {
      char c = (char)_client.read();
      line += c;
      if (line.endsWith("\r\n")) {
        return true;
      }
      start = millis();
    } else {
      delay(1);
    }
  }
  return false;
}

bool StreamClient::parseHttpHeaders() {
  String statusLine;
  if (!readLine(statusLine, 5000)) return false;
  statusLine.trim();
  if (!statusLine.startsWith("HTTP/") || statusLine.indexOf("200") < 0) {
    return false;
  }
  g_stats.lastHttpStatus = 200;

  String header;
  while (readLine(header, 5000)) {
    if (header == "\r\n" || header.length() == 0) return true;
  }
  return false;
}

bool StreamClient::parseWavHeader(StreamFormat& outFormat) {
  uint8_t riff[12];
  if (!readExact(riff, 12, 5000)) return false;
  if (memcmp(riff, "RIFF", 4) != 0 || memcmp(riff + 8, "WAVE", 4) != 0) {
    return false;
  }

  bool fmtFound = false;
  while (_client.connected()) {
    uint8_t chunkHeader[8];
    if (!readExact(chunkHeader, 8, 4000)) break;

    uint32_t chunkSize = (uint32_t)chunkHeader[4] | ((uint32_t)chunkHeader[5] << 8) |
                         ((uint32_t)chunkHeader[6] << 16) | ((uint32_t)chunkHeader[7] << 24);

    if (memcmp(chunkHeader, "fmt ", 4) == 0) {
      if (chunkSize < 16 || chunkSize > 64) return false;
      uint8_t fmtBuf[64];
      if (!readExact(fmtBuf, chunkSize, 4000)) return false;

      outFormat.audioFormat = fmtBuf[0] | (fmtBuf[1] << 8);
      outFormat.channels = fmtBuf[2] | (fmtBuf[3] << 8);
      outFormat.sampleRate = (uint32_t)fmtBuf[4] | ((uint32_t)fmtBuf[5] << 8) |
                             ((uint32_t)fmtBuf[6] << 16) | ((uint32_t)fmtBuf[7] << 24);
      outFormat.bitsPerSample = fmtBuf[14] | (fmtBuf[15] << 8);
      outFormat.valid = (outFormat.audioFormat == 1 && outFormat.bitsPerSample == 16);
      fmtFound = true;
    } else if (memcmp(chunkHeader, "data", 4) == 0) {
      return fmtFound;
    } else {
      // Skip unknown chunk
      uint8_t discard[64];
      uint32_t rem = chunkSize;
      while (rem > 0) {
        size_t toRead = min((size_t)sizeof(discard), (size_t)rem);
        if (!readExact(discard, toRead, 3000)) return false;
        rem -= toRead;
      }
      if (chunkSize & 1) _client.read(); // Pad byte
    }
  }
  return false;
}

bool StreamClient::connectTcp(const String& host, uint16_t port) {
  _client.stop();
  Serial.printf("[STREAM] Connecting to Raw TCP %s:%u...\n", host.c_str(), port);

  if (!_client.connect(host.c_str(), port)) {
    return false;
  }
  _client.setNoDelay(true);

  // Default raw PCM settings
  _format.sampleRate = DEFAULT_SAMPLE_RATE;
  _format.channels = DEFAULT_CHANNELS;
  _format.bitsPerSample = DEFAULT_BITS_PER_SAMPLE;
  _format.valid = true;

  AudioI2S::instance().begin(_format.sampleRate, _format.channels);
  return true;
}

bool StreamClient::connectHttp(const String& host, uint16_t port) {
  _client.stop();
  Serial.printf("[STREAM] Connecting to HTTP WAV http://%s:%u/ ...\n", host.c_str(), port);

  if (!_client.connect(host.c_str(), port)) {
    return false;
  }
  _client.setNoDelay(true);

  // Request root path for pkarthikmohan/wifi-audio-streamer
  _client.printf("GET / HTTP/1.1\r\nHost: %s:%u\r\nUser-Agent: C3Music/2.0\r\nAccept: audio/wav,*/*\r\nConnection: close\r\n\r\n",
                 host.c_str(), port);

  if (!parseHttpHeaders()) {
    _client.stop();
    return false;
  }

  StreamFormat wavFormat;
  if (!parseWavHeader(wavFormat) || !wavFormat.valid) {
    _client.stop();
    return false;
  }

  _format = wavFormat;
  Serial.printf("[STREAM] Auto-detected WAV format: %u Hz, %s\n", _format.sampleRate, _format.channels == 2 ? "Stereo" : "Mono");
  AudioI2S::instance().begin(_format.sampleRate, _format.channels);
  return true;
}

void StreamClient::processStream() {
  int availableBytes = _client.available();
  if (availableBytes > 0) {
    size_t toRead = min((size_t)availableBytes, (size_t)sizeof(_networkBuffer));
    int bytesRead = _client.read(_networkBuffer, toRead);

    if (bytesRead > 0) {
      g_stats.bytesReceived += bytesRead;
      _lastRxMs = millis();

      AudioRingBuffer::instance().write(_networkBuffer, bytesRead);

      // Pre-buffering threshold to start playback without stutter (~12KB)
      if (!g_bufferStarted && AudioRingBuffer::instance().available() >= 12000) {
        g_bufferStarted = true;
        g_receiverState = RX_STREAMING;
      }
    }
  } else {
    vTaskDelay(pdMS_TO_TICKS(1));
  }
}

bool StreamClient::autoDiscoverHost(String& foundHost, uint16_t& foundPort) {
  if (WiFi.status() != WL_CONNECTED) return false;

  Serial.println("[DISCOVERY] Scanning home Wi-Fi subnet for active audio transmitters...");

  // 1. First probe configured host if valid
  if (g_settings.phoneHost.length() > 0 && g_settings.phoneHost != "auto") {
    WiFiClient probe;
    probe.setTimeout(1);
    if (probe.connect(g_settings.phoneHost.c_str(), g_settings.tcpPort)) {
      probe.stop();
      foundHost = g_settings.phoneHost;
      foundPort = g_settings.tcpPort;
      return true;
    }
    if (probe.connect(g_settings.phoneHost.c_str(), g_settings.httpPort)) {
      probe.stop();
      foundHost = g_settings.phoneHost;
      foundPort = g_settings.httpPort;
      return true;
    }
  }

  // 2. Scan local subnet based on ESP32 IP
  IPAddress localIp = WiFi.localIP();
  IPAddress gateway = WiFi.gatewayIP();
  IPAddress target = localIp;

  // Scan nearest 40 host IPs around local IP and gateway
  int myLastOctet = localIp[3];
  int probeRange[] = { 119, 100, 101, 102, 105, 110, 115, 120, 150, 200, 50, 2, 3 };

  for (int octet : probeRange) {
    target[3] = octet;
    if (target == localIp) continue;

    WiFiClient probe;
    probe.setTimeout(1); // 1 second maximum socket connection probe

    // Test Port 50005 (TCP PCM)
    if (probe.connect(target, 50005)) {
      probe.stop();
      foundHost = target.toString();
      foundPort = 50005;
      Serial.printf("[DISCOVERY] Found active TCP PCM Streamer at %s:50005\n", foundHost.c_str());
      return true;
    }

    // Test Port 8080 (HTTP WAV)
    if (probe.connect(target, 8080)) {
      probe.stop();
      foundHost = target.toString();
      foundPort = 8080;
      Serial.printf("[DISCOVERY] Found active HTTP WAV Streamer at %s:8080\n", foundHost.c_str());
      return true;
    }
  }

  Serial.println("[DISCOVERY] No active transmitter detected. Ready for manual entry.");
  return false;
}
