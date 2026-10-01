#pragma once

#include "config.h"
#include <driver/i2s.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>

class AudioI2S {
public:
  static AudioI2S& instance();

  bool begin(uint32_t sampleRate, uint16_t channels, uint16_t bitsPerSample = 16);
  void end();
  bool isReady() const { return _ready; }

  // Plays a crisp 440Hz test beep to confirm hardware DAC wiring
  void playTestTone(uint32_t durationMs = 400);

  // Writes PCM samples directly to I2S DMA FIFO
  size_t writeSamples(const uint8_t* data, size_t length, uint32_t timeoutTicks = 40);

  // Expands mono 16-bit to stereo 16-bit and writes
  size_t writeMonoAsStereo(const uint8_t* monoData, size_t length, uint32_t timeoutTicks = 40);

  void clearDmaBuffer();

private:
  AudioI2S();
  ~AudioI2S();

  bool _ready;
  SemaphoreHandle_t _mutex;
  uint8_t _stereoExpandBuffer[I2S_DMA_CHUNK * 2];
};
