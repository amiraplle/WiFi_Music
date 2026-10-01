#pragma once

#include <Arduino.h>
#include <IPAddress.h>

// Device Metadata
#define DEVICE_NAME       "C3 Music Receiver"
#define MDNS_HOSTNAME     "c3music"
#define FIRMWARE_VERSION  "2.0.0"

// Hardware Pin Configuration
// I2S connections for UDA1334A DAC (Only 3 wires needed: BCK, WSEL, DIN)
constexpr int PIN_I2S_BCLK  = 3;   // Bit Clock
constexpr int PIN_I2S_LRCLK = 1;   // Word Select / LRCK
constexpr int PIN_I2S_DOUT  = 10;  // Serial Data Out (connects to DIN)

// I2C connections for 0.42" OLED (SSD1306 72x40)
constexpr uint8_t PIN_I2C_SDA  = 5;
constexpr uint8_t PIN_I2C_SCL  = 6;
constexpr uint8_t OLED_WIDTH   = 72;
constexpr uint8_t OLED_HEIGHT  = 40;

// Network Defaults
static const char DEFAULT_WIFI_SSID[] = "GFiber_2.4_Coverage_AECD9";
static const char DEFAULT_WIFI_PASS[] = "006BF4FD";
static const char DEFAULT_PHONE_HOST[] = "192.168.254.119";

constexpr uint16_t DEFAULT_TCP_PORT  = 50005; // Raw PCM (Zero latency)
constexpr uint16_t DEFAULT_HTTP_PORT = 8080;  // HTTP WAV Server

// Audio & Ring Buffer Parameters
constexpr uint32_t DEFAULT_SAMPLE_RATE     = 44100;
constexpr uint8_t  DEFAULT_CHANNELS        = 2;
constexpr uint8_t  DEFAULT_BITS_PER_SAMPLE = 16;
constexpr size_t   AUDIO_RING_BYTES        = 65536;
constexpr size_t   NETWORK_READ_CHUNK      = 1460;
constexpr size_t   I2S_DMA_CHUNK           = 1024;
constexpr uint32_t STREAM_RETRY_INTERVAL_MS = 2000;
constexpr uint32_t WIFI_RETRY_INTERVAL_MS   = 8000;

// Enums
enum StreamMode : uint8_t {
  STREAM_MODE_TCP = 0,
  STREAM_MODE_HTTP = 1
};

enum ReceiverState : uint8_t {
  RX_BOOTING = 0,
  RX_WIFI_CONNECTING,
  RX_WIFI_OFFLINE,
  RX_IDLE,
  RX_CONNECTING,
  RX_BUFFERING,
  RX_STREAMING,
  RX_STOPPED,
  RX_ERROR,
  RX_UPDATING
};

struct StreamFormat {
  uint32_t sampleRate = DEFAULT_SAMPLE_RATE;
  uint16_t channels = DEFAULT_CHANNELS;
  uint16_t bitsPerSample = DEFAULT_BITS_PER_SAMPLE;
  uint16_t audioFormat = 1;
  bool valid = false;
};

struct RuntimeStats {
  uint32_t reconnects = 0;
  uint32_t underruns = 0;
  uint32_t streamErrors = 0;
  uint32_t bytesReceived = 0;
  uint32_t bytesPlayed = 0;
  uint32_t sessionStartedMs = 0;
  uint32_t lastReceiveMs = 0;
  int lastHttpStatus = 0;
  String lastError = "";
};

struct AppSettings {
  String phoneHost = DEFAULT_PHONE_HOST;
  uint16_t tcpPort = DEFAULT_TCP_PORT;
  uint16_t httpPort = DEFAULT_HTTP_PORT;
  StreamMode preferredMode = STREAM_MODE_TCP;
  bool autoFallback = true;
  bool autoReconnect = true;
  bool autoDiscover = true;
  bool oledEnabled = true;
  bool streamEnabled = true;
  uint16_t targetBufferMs = 180;
};
