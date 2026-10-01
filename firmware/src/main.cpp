/*
  =============================================================================
  C3 Music Receiver (Modular PlatformIO Architecture)
  Hardware: ESP32-C3 SuperMini + SSD1306 0.42" OLED + UDA1334A I2S DAC
  Web UI: Material Design 3 Minimal AMOLED App
  Audio: Port 50005 (Raw PCM) + Port 8080 (HTTP WAV)
  =============================================================================
*/

#include "config.h"
#include "audio_i2s.h"
#include "audio_ringbuf.h"
#include "stream_client.h"
#include "display_oled.h"
#include "web_server.h"

#include <WiFi.h>
#include <Preferences.h>

// Global System Objects
AppSettings g_settings;
RuntimeStats g_stats;
Preferences g_preferences;
volatile ReceiverState g_receiverState = RX_BOOTING;
volatile bool g_bufferStarted = false;
volatile bool g_stopRequested = false;

TaskHandle_t g_playbackTaskHandle = nullptr;
TaskHandle_t g_streamTaskHandle = nullptr;

uint32_t g_lastWifiAttemptMs = 0;
uint32_t g_lastStreamAttemptMs = 0;

void loadPreferences() {
  g_preferences.begin("c3music", false);
  g_settings.phoneHost = g_preferences.getString("host", DEFAULT_PHONE_HOST);
  g_settings.tcpPort = g_preferences.getUShort("tcpport", DEFAULT_TCP_PORT);
  g_settings.httpPort = g_preferences.getUShort("httpport", DEFAULT_HTTP_PORT);
  g_settings.preferredMode = (StreamMode)g_preferences.getUChar("mode", STREAM_MODE_TCP);
  g_settings.autoFallback = g_preferences.getBool("fallback", true);
  g_settings.autoReconnect = g_preferences.getBool("autorecon", true);
  g_settings.oledEnabled = g_preferences.getBool("oled", true);
  g_settings.streamEnabled = g_preferences.getBool("enabled", true);
  g_settings.targetBufferMs = g_preferences.getUShort("buffer", 180);
  g_settings.volume = g_preferences.getUChar("volume", 50);
  g_settings.muted = g_preferences.getBool("muted", false);
  AudioI2S::instance().setVolume(g_settings.volume);
  AudioI2S::instance().setMute(g_settings.muted);
}

void savePreferences() {
  g_preferences.putString("host", g_settings.phoneHost);
  g_preferences.putUShort("tcpport", g_settings.tcpPort);
  g_preferences.putUShort("httpport", g_settings.httpPort);
  g_preferences.putUChar("mode", g_settings.preferredMode);
  g_preferences.putBool("fallback", g_settings.autoFallback);
  g_preferences.putBool("autorecon", g_settings.autoReconnect);
  g_preferences.putBool("oled", g_settings.oledEnabled);
  g_preferences.putBool("enabled", g_settings.streamEnabled);
  g_preferences.putUShort("buffer", g_settings.targetBufferMs);
  g_preferences.putUChar("volume", g_settings.volume);
  g_preferences.putBool("muted", g_settings.muted);
}

void restartStreaming() {
  g_stopRequested = true;
  StreamClient::instance().stop();
  AudioRingBuffer::instance().clear();
  delay(50);
  g_stopRequested = false;
  g_bufferStarted = false;
  g_lastStreamAttemptMs = 0;
  g_receiverState = RX_IDLE;
}

// FreeRTOS Task: Streams PCM samples from ring buffer directly to I2S DAC FIFO
void playbackTask(void*) {
  uint8_t readBuffer[I2S_DMA_CHUNK];

  for (;;) {
    if (!AudioI2S::instance().isReady() || !g_bufferStarted) {
      vTaskDelay(pdMS_TO_TICKS(10));
      continue;
    }

    size_t bytesRead = AudioRingBuffer::instance().read(readBuffer, sizeof(readBuffer));
    if (bytesRead == 0) {
      g_stats.underruns++;
      xSemaphoreTake(AudioRingBuffer::instance().dataSemaphore(), pdMS_TO_TICKS(20));
      continue;
    }

    StreamFormat fmt = StreamClient::instance().currentFormat();
    if (fmt.channels == 1) {
      AudioI2S::instance().writeMonoAsStereo(readBuffer, bytesRead, 40);
      g_stats.bytesPlayed += (bytesRead / 2);
    } else {
      AudioI2S::instance().writeSamples(readBuffer, bytesRead, 40);
      g_stats.bytesPlayed += bytesRead;
    }
  }
}

// FreeRTOS Task: Connects to Android Streamer & pumps incoming audio into Ring Buffer
void streamTask(void*) {
  for (;;) {
    if (WiFi.status() != WL_CONNECTED) {
      StreamClient::instance().stop();
      AudioRingBuffer::instance().clear();
      g_receiverState = RX_WIFI_OFFLINE;
      vTaskDelay(pdMS_TO_TICKS(500));
      continue;
    }

    if (!g_settings.streamEnabled || g_stopRequested) {
      StreamClient::instance().stop();
      AudioRingBuffer::instance().clear();
      if (g_receiverState != RX_STOPPED) g_receiverState = RX_STOPPED;
      vTaskDelay(pdMS_TO_TICKS(150));
      continue;
    }

    if (!StreamClient::instance().isConnected()) {
      if (millis() - g_lastStreamAttemptMs < STREAM_RETRY_INTERVAL_MS) {
        vTaskDelay(pdMS_TO_TICKS(20));
        continue;
      }
      g_lastStreamAttemptMs = millis();
      g_receiverState = RX_CONNECTING;

      bool connected = false;
      if (g_settings.preferredMode == STREAM_MODE_TCP) {
        connected = StreamClient::instance().connectTcp(g_settings.phoneHost, g_settings.tcpPort);
        if (!connected && g_settings.autoFallback) {
          connected = StreamClient::instance().connectHttp(g_settings.phoneHost, g_settings.httpPort);
        }
      } else {
        connected = StreamClient::instance().connectHttp(g_settings.phoneHost, g_settings.httpPort);
        if (!connected && g_settings.autoFallback) {
          connected = StreamClient::instance().connectTcp(g_settings.phoneHost, g_settings.tcpPort);
        }
      }

      if (connected) {
        g_stats.reconnects++;
        g_stats.sessionStartedMs = millis();
        AudioRingBuffer::instance().clear();
        g_bufferStarted = false;
        g_receiverState = RX_BUFFERING;
      } else {
        g_stats.streamErrors++;
        g_receiverState = RX_ERROR;
        vTaskDelay(pdMS_TO_TICKS(1000));
        continue;
      }
    }

    StreamClient::instance().processStream();
  }
}

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\n\n========================================================");
  Serial.printf(" %s v%s\n", DEVICE_NAME, FIRMWARE_VERSION);
  Serial.println("========================================================");

  loadPreferences();

  // 1. OLED Display
  DisplayOLED::instance().setEnabled(g_settings.oledEnabled);
  DisplayOLED::instance().begin();

  // 2. Hardware I2S + 440Hz Test Beep to confirm DAC
  AudioI2S::instance().begin(DEFAULT_SAMPLE_RATE, DEFAULT_CHANNELS);
  AudioI2S::instance().playTestTone(400);

  // 3. Wi-Fi (Disable sleep for minimum audio latency)
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.setAutoReconnect(true);
  WiFi.begin(DEFAULT_WIFI_SSID, DEFAULT_WIFI_PASS);
  Serial.printf("[WIFI] Connecting to %s...\n", DEFAULT_WIFI_SSID);

  // 4. Start Web Server
  WebServerManager::instance().begin();

  // 5. Create FreeRTOS Real-Time Tasks
  xTaskCreate(playbackTask, "i2s_playback", 4096, nullptr, 3, &g_playbackTaskHandle);
  xTaskCreate(streamTask,   "net_stream",   6144, nullptr, 2, &g_streamTaskHandle);

  Serial.println("[SYSTEM] Setup complete. Ready.");
}

void loop() {
  WebServerManager::instance().handleClient();

  if (WiFi.status() == WL_CONNECTED) {
    WebServerManager::instance().beginMdnsIfNeeded();
  } else {
    if (millis() - g_lastWifiAttemptMs > WIFI_RETRY_INTERVAL_MS) {
      g_lastWifiAttemptMs = millis();
      WiFi.reconnect();
    }
  }

  // Update 0.42" OLED screen
  DisplayOLED::instance().update(
    g_receiverState,
    StreamClient::instance().currentFormat(),
    AudioRingBuffer::instance().percentFull(),
    g_stats.lastError
  );

  delay(2);
}
