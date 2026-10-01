#include "audio_i2s.h"
#include <math.h>

AudioI2S& AudioI2S::instance() {
  static AudioI2S inst;
  return inst;
}

AudioI2S::AudioI2S() : _ready(false) {
  _mutex = xSemaphoreCreateMutex();
}

AudioI2S::~AudioI2S() {
  end();
  if (_mutex) {
    vSemaphoreDelete(_mutex);
  }
}

void AudioI2S::end() {
  if (_mutex) xSemaphoreTake(_mutex, portMAX_DELAY);
  if (_ready) {
    i2s_driver_uninstall(I2S_NUM_0);
    _ready = false;
  }
  if (_mutex) xSemaphoreGive(_mutex);
}

bool AudioI2S::begin(uint32_t sampleRate, uint16_t channels, uint16_t bitsPerSample) {
  if (bitsPerSample != 16 || (channels != 1 && channels != 2)) {
    return false;
  }

  end();

  if (_mutex) xSemaphoreTake(_mutex, portMAX_DELAY);

  // ESP32-C3 Hardware I2S Configuration for UDA1334A
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = sampleRate,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT, // Always stream stereo to UDA1334A
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 512,
    .use_apll = false,          // ESP32-C3 does NOT support APLL!
    .tx_desc_auto_clear = true,  // Automatically mute on underrun
    .fixed_mclk = 0             // Must be 0 for internal clock divisor calculation!
  };

  esp_err_t err = i2s_driver_install(I2S_NUM_0, &i2s_config, 0, nullptr);
  if (err != ESP_OK) {
    Serial.printf("[I2S] Driver install failed: 0x%x\n", err);
    if (_mutex) xSemaphoreGive(_mutex);
    return false;
  }

  i2s_pin_config_t pin_config = {
    .bck_io_num = PIN_I2S_BCLK,
    .ws_io_num = PIN_I2S_LRCLK,
    .data_out_num = PIN_I2S_DOUT,
    .data_in_num = I2S_PIN_NO_CHANGE
  };

  err = i2s_set_pin(I2S_NUM_0, &pin_config);
  if (err != ESP_OK) {
    Serial.printf("[I2S] Pin configuration failed: 0x%x\n", err);
    i2s_driver_uninstall(I2S_NUM_0);
    if (_mutex) xSemaphoreGive(_mutex);
    return false;
  }

  i2s_zero_dma_buffer(I2S_NUM_0);
  _ready = true;
  if (_mutex) xSemaphoreGive(_mutex);

  Serial.printf("[I2S] Initialized: %u Hz, 16-bit, %s (BCLK=%d, WS=%d, DOUT=%d)\n",
                sampleRate, channels == 2 ? "Stereo" : "Mono",
                PIN_I2S_BCLK, PIN_I2S_LRCLK, PIN_I2S_DOUT);
  return true;
}

void AudioI2S::clearDmaBuffer() {
  if (_mutex) xSemaphoreTake(_mutex, portMAX_DELAY);
  if (_ready) {
    i2s_zero_dma_buffer(I2S_NUM_0);
  }
  if (_mutex) xSemaphoreGive(_mutex);
}

void AudioI2S::playTestTone(uint32_t durationMs) {
  if (!_ready) {
    begin(DEFAULT_SAMPLE_RATE, DEFAULT_CHANNELS);
  }
  const int totalSamples = (DEFAULT_SAMPLE_RATE * durationMs) / 1000;
  int16_t sampleBuf[128 * 2];
  size_t bytesWritten = 0;

  for (int i = 0; i < totalSamples; i += 128) {
    for (int s = 0; s < 128; s++) {
      float t = (float)(i + s) / (float)DEFAULT_SAMPLE_RATE;
      int16_t val = (int16_t)(sin(2.0 * M_PI * 440.0 * t) * 12000.0);
      sampleBuf[s * 2]     = val; // L
      sampleBuf[s * 2 + 1] = val; // R
    }
    writeSamples((uint8_t*)sampleBuf, sizeof(sampleBuf), 100);
  }
  clearDmaBuffer();
}

size_t AudioI2S::writeSamples(const uint8_t* data, size_t length, uint32_t timeoutTicks) {
  if (!data || length == 0 || !_ready) return 0;

  size_t bytesWritten = 0;
  if (_mutex) xSemaphoreTake(_mutex, portMAX_DELAY);
  if (_ready) {
    i2s_write(I2S_NUM_0, data, length, &bytesWritten, pdMS_TO_TICKS(timeoutTicks));
  }
  if (_mutex) xSemaphoreGive(_mutex);
  return bytesWritten;
}

size_t AudioI2S::writeMonoAsStereo(const uint8_t* monoData, size_t length, uint32_t timeoutTicks) {
  if (!monoData || length == 0 || !_ready) return 0;

  size_t numSamples = length / 2;
  size_t maxSamplesPerChunk = sizeof(_stereoExpandBuffer) / 4;
  size_t totalWritten = 0;

  const int16_t* inSamples = reinterpret_cast<const int16_t*>(monoData);
  int16_t* outSamples = reinterpret_cast<int16_t*>(_stereoExpandBuffer);

  for (size_t offset = 0; offset < numSamples; offset += maxSamplesPerChunk) {
    size_t chunkSamples = min(numSamples - offset, maxSamplesPerChunk);
    for (size_t i = 0; i < chunkSamples; i++) {
      int16_t sample = inSamples[offset + i];
      outSamples[i * 2]     = sample;
      outSamples[i * 2 + 1] = sample;
    }
    size_t bytesToWrite = chunkSamples * 4;
    size_t written = writeSamples(_stereoExpandBuffer, bytesToWrite, timeoutTicks);
    totalWritten += (written / 2);
  }

  return totalWritten;
}
