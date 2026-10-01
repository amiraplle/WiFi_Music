#include "display_oled.h"
#include <Wire.h>
#include <WiFi.h>

DisplayOLED& DisplayOLED::instance() {
  static DisplayOLED inst;
  return inst;
}

DisplayOLED::DisplayOLED()
  : _u8g2(U8G2_R0, U8X8_PIN_NONE), _available(false), _enabled(true), _vuLevel(0), _lastRenderMs(0) {
}

void DisplayOLED::begin() {
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  _available = _u8g2.begin();
  if (_available) {
    _u8g2.setPowerSave(_enabled ? 0 : 1);
    _u8g2.clearBuffer();
    _u8g2.setFont(u8g2_font_5x7_tf);
    _u8g2.drawStr(0, 8, "C3 MUSIC");
    _u8g2.drawStr(0, 20, "Material v2");
    _u8g2.sendBuffer();
  }
}

void DisplayOLED::setEnabled(bool enabled) {
  _enabled = enabled;
  if (_available) {
    _u8g2.setPowerSave(_enabled ? 0 : 1);
  }
}

void DisplayOLED::drawCentered(const char* text, uint8_t y, const uint8_t* font) {
  _u8g2.setFont(font);
  int w = _u8g2.getStrWidth(text);
  int x = (OLED_WIDTH - w) / 2;
  if (x < 0) x = 0;
  _u8g2.drawStr(x, y, text);
}

void DisplayOLED::update(ReceiverState state, const StreamFormat& format, uint8_t bufferPercent, const String& error) {
  if (!_available || !_enabled) return;

  // Frame limiter: ~15-20 FPS max (every 60ms) to conserve CPU
  if (millis() - _lastRenderMs < 60) return;
  _lastRenderMs = millis();

  _u8g2.clearBuffer();
  _u8g2.setFont(u8g2_font_5x7_tf);
  _u8g2.drawStr(0, 7, "C3 MUSIC");

  // State badge in top right
  const char* st = "BOOT";
  switch(state) {
    case RX_WIFI_CONNECTING: st = "WIFI"; break;
    case RX_WIFI_OFFLINE:    st = "OFFLINE"; break;
    case RX_IDLE:            st = "READY"; break;
    case RX_CONNECTING:      st = "LINK"; break;
    case RX_BUFFERING:       st = "BUF"; break;
    case RX_STREAMING:       st = "PLAY"; break;
    case RX_STOPPED:         st = "STOP"; break;
    case RX_ERROR:           st = "ERR"; break;
    case RX_UPDATING:        st = "OTA"; break;
    default: break;
  }
  int sw = _u8g2.getStrWidth(st);
  _u8g2.drawStr(OLED_WIDTH - sw, 7, st);

  if (state == RX_STREAMING || state == RX_BUFFERING) {
    // Format: e.g. "44k ST" or "48k MO"
    char fmtBuf[20];
    snprintf(fmtBuf, sizeof(fmtBuf), "%uk %s", (unsigned int)(format.sampleRate / 1000), format.channels == 2 ? "ST" : "MO");
    drawCentered(fmtBuf, 18, u8g2_font_6x10_tf);

    // Dynamic mini VU meter & Buffer Bar
    _u8g2.drawFrame(0, 24, OLED_WIDTH, 6);
    uint8_t barW = (uint8_t)(((OLED_WIDTH - 2) * bufferPercent) / 100);
    if (barW > 0) {
      _u8g2.drawBox(1, 25, barW, 4);
    }

    // Mini 7-bar VU visualizer on bottom
    for (int i = 0; i < 7; i++) {
      int barH = (_vuLevel > (i * 4)) ? (i + 1) : 1;
      _u8g2.drawBox(i * 10 + 2, 40 - barH, 6, barH);
    }
  } else {
    // Info display when not playing
    if (WiFi.status() == WL_CONNECTED) {
      String ip = WiFi.localIP().toString();
      drawCentered(ip.c_str(), 21, u8g2_font_5x7_tf);
    } else if (state == RX_WIFI_CONNECTING) {
      drawCentered("Connecting...", 21, u8g2_font_5x7_tf);
    } else {
      drawCentered("Check WiFi", 21, u8g2_font_5x7_tf);
    }

    if (state == RX_ERROR && error.length() > 0) {
      String e = error;
      if (e.length() > 14) e = e.substring(0, 14);
      drawCentered(e.c_str(), 36, u8g2_font_4x6_tf);
    } else {
      drawCentered("c3music.local", 36, u8g2_font_4x6_tf);
    }
  }

  _u8g2.sendBuffer();
}
