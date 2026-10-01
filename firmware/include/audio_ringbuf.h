#pragma once

#include "config.h"
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>

class AudioRingBuffer {
public:
  static AudioRingBuffer& instance();

  bool write(const uint8_t* data, size_t length);
  size_t read(uint8_t* destination, size_t maxLen);
  void clear();

  size_t available() const;
  size_t freeSpace() const;
  uint8_t percentFull() const;

  SemaphoreHandle_t dataSemaphore() const { return _dataSemaphore; }

private:
  AudioRingBuffer();
  ~AudioRingBuffer();

  uint8_t _buffer[AUDIO_RING_BYTES];
  volatile size_t _readIndex;
  volatile size_t _writeIndex;
  volatile size_t _count;
  portMUX_TYPE _mux;
  SemaphoreHandle_t _dataSemaphore;
};
