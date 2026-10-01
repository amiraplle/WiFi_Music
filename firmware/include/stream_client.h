#pragma once

#include "config.h"
#include <WiFiClient.h>

class StreamClient {
public:
  static StreamClient& instance();

  void begin();
  bool connect(uint16_t port);
  void stop();
  bool isConnected();

  // Primary stream loop: reads from socket into AudioRingBuffer
  void processStream();

  StreamFormat currentFormat() const { return _format; }
  void setFormat(const StreamFormat& f) { _format = f; }

  bool connectTcp(const String& host, uint16_t port);
  bool connectHttp(const String& host, uint16_t port);
  bool autoDiscoverHost(String& foundHost, uint16_t& foundPort);

private:
  StreamClient();
  WiFiClient _client;
  StreamFormat _format;
  uint8_t _networkBuffer[NETWORK_READ_CHUNK];
  uint32_t _lastRxMs;

  bool readExact(uint8_t* buf, size_t len, uint32_t timeoutMs);
  bool readLine(String& line, uint32_t timeoutMs);
  bool parseHttpHeaders();
  bool parseWavHeader(StreamFormat& outFormat);
};
