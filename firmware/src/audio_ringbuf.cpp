#include "audio_ringbuf.h"
#include <string.h>

AudioRingBuffer& AudioRingBuffer::instance() {
  static AudioRingBuffer inst;
  return inst;
}

AudioRingBuffer::AudioRingBuffer()
  : _readIndex(0), _writeIndex(0), _count(0) {
  _mux = portMUX_INITIALIZER_UNLOCKED;
  _dataSemaphore = xSemaphoreCreateBinary();
}

AudioRingBuffer::~AudioRingBuffer() {
  if (_dataSemaphore) {
    vSemaphoreDelete(_dataSemaphore);
  }
}

bool AudioRingBuffer::write(const uint8_t* data, size_t length) {
  if (!data || length == 0) return true;

  bool ok = true;
  portENTER_CRITICAL(&_mux);
  size_t freeBytes = AUDIO_RING_BYTES - _count;
  if (length > freeBytes) {
    length = freeBytes;
    ok = false;
  }

  size_t first = min(length, AUDIO_RING_BYTES - _writeIndex);
  memcpy(_buffer + _writeIndex, data, first);
  size_t second = length - first;
  if (second > 0) {
    memcpy(_buffer, data + first, second);
  }

  _writeIndex = (_writeIndex + length) % AUDIO_RING_BYTES;
  _count += length;
  portEXIT_CRITICAL(&_mux);

  if (length > 0 && _dataSemaphore) {
    xSemaphoreGive(_dataSemaphore);
  }
  return ok;
}

size_t AudioRingBuffer::read(uint8_t* destination, size_t maxLen) {
  if (!destination || maxLen == 0) return 0;

  portENTER_CRITICAL(&_mux);
  size_t len = min(maxLen, _count);
  if (len > 0) {
    size_t first = min(len, AUDIO_RING_BYTES - _readIndex);
    memcpy(destination, _buffer + _readIndex, first);
    size_t second = len - first;
    if (second > 0) {
      memcpy(destination + first, _buffer, second);
    }
    _readIndex = (_readIndex + len) % AUDIO_RING_BYTES;
    _count -= len;
  }
  portEXIT_CRITICAL(&_mux);
  return len;
}

void AudioRingBuffer::clear() {
  portENTER_CRITICAL(&_mux);
  _readIndex = 0;
  _writeIndex = 0;
  _count = 0;
  portEXIT_CRITICAL(&_mux);
}

size_t AudioRingBuffer::available() const {
  portENTER_CRITICAL((portMUX_TYPE*)&_mux);
  size_t val = _count;
  portEXIT_CRITICAL((portMUX_TYPE*)&_mux);
  return val;
}

size_t AudioRingBuffer::freeSpace() const {
  return AUDIO_RING_BYTES - available();
}

uint8_t AudioRingBuffer::percentFull() const {
  return (uint8_t)((available() * 100UL) / AUDIO_RING_BYTES);
}
