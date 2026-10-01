#pragma once

#include "config.h"
#include <U8g2lib.h>

class DisplayOLED {
public:
  static DisplayOLED& instance();

  void begin();
  void update(ReceiverState state, const StreamFormat& format, uint8_t bufferPercent, const String& error = "");
  void setEnabled(bool enabled);
  bool isEnabled() const { return _enabled; }
  void setVuLevel(uint8_t level) { _vuLevel = level; }
  void showVolume(uint8_t vol, bool muted);

private:
  DisplayOLED();
  void drawCentered(const char* text, uint8_t y, const uint8_t* font);

  U8G2_SSD1306_72X40_ER_F_HW_I2C _u8g2;
  bool _available;
  bool _enabled;
  uint8_t _vuLevel;
  uint32_t _lastRenderMs;
  uint32_t _volumeOverlayUntilMs;
  uint8_t _displayVolume;
  bool _displayMuted;
};
