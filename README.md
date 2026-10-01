# WiFi Music Receiver (ESP32-C3 SuperMini + UDA1334A DAC + 0.42" OLED)

A modular, ultra-low latency Wi-Fi audio receiver designed for the **ESP32-C3 SuperMini**, **UDA1334A I2S DAC**, and **SSD1306 0.42" OLED (72x40)**. Compatible with Android transmitters (like `pkarthikmohan/wifi-audio-streamer`).

Features a **Material Design 3 Minimal AMOLED Web UI** (`#000000`), Wi-Fi subnet stream auto-discovery, smooth pill toggle switches, and dual-protocol reception (Port 50005 Raw TCP / Port 8080 HTTP WAV).

---

## 🔌 Hardware Wiring & Pinout

### UDA1334A I2S DAC (3-Wire Interface)
| UDA1334A Pin | ESP32-C3 SuperMini Pin | Description |
|---|---|---|
| **VIN / 3V3** | **3.3V** | Power (use clean 3.3V rail) |
| **GND** | **GND** | System Ground |
| **BCLK (BCK)** | **GPIO 3** | Bit Clock |
| **WSEL (LRCK)**| **GPIO 1** | Word Select (Left/Right Clock) |
| **DIN (DATA)** | **GPIO 10** | I2S Serial Audio Data |
| **MCLK** | **DISCONNECTED** | **Leave disconnected!** UDA1334A PLL locks to BCLK |
| **MUTE** | **GND** | **Tie to GND** to unmute |
| **DEEMPH** | **GND** | De-emphasis off |

### 0.42" OLED Display (SSD1306 72x40 I2C)
| OLED Pin | ESP32-C3 Pin | Notes |
|---|---|---|
| **VCC** | **3.3V** | Power |
| **GND** | **GND** | Ground |
| **SDA** | **GPIO 5** | I2C Data |
| **SCL** | **GPIO 6** | I2C Clock |

---

## 📁 Modular PlatformIO Architecture (`/firmware`)

```text
firmware/
├── platformio.ini              # ESP32-C3 SuperMini config (160MHz, USB CDC)
├── include/
│   ├── config.h                # Hardware pins, Wi-Fi defaults, enums
│   ├── audio_i2s.h             # Hardware I2S engine (fixed MCLK = 0, APLL off)
│   ├── audio_ringbuf.h         # Thread-safe FreeRTOS ring buffer
│   ├── display_oled.h          # 0.42" SSD1306 U8g2 controller & VU meter
│   ├── web_assets.h            # Material AMOLED 4-tab web app HTML/CSS/JS
│   ├── web_server.h            # REST API & OTA firmware updater
│   └── stream_client.h         # Dual TCP 50005 + HTTP 8080 streaming engine
└── src/
    ├── audio_i2s.cpp
    ├── audio_ringbuf.cpp
    ├── display_oled.cpp
    ├── stream_client.cpp
    ├── web_server.cpp
    └── main.cpp                # Clean top-level coordinator (~150 lines)
```

---

## 🚀 Building & Flashing

### Option 1: GitHub Actions (Automated)
Every push to `main` or `master` automatically triggers `.github/workflows/build.yml` to compile the firmware with PlatformIO and upload `C3-Music-Firmware-bin` as a build artifact!

### Option 2: Local PlatformIO
```bash
cd firmware
pio run --target upload
```

---

## 📱 Material AMOLED Web App (4 Tabs)
Once connected to Wi-Fi, open `http://c3music.local` or the device's IP:
1. **Now Playing:** Disc status hero, stream bitrate, live subtle VU level bars, buffer occupancy gauge, Start/Stop/Retry buttons.
2. **Wi-Fi:** Network SSID, IP address, RSSI dBm signal meter, Reconnect button.
3. **Streaming Setup:** Subnet auto-discovery scanner (`🔍 Scan Home Wi-Fi for Streamers`), protocol switch (TCP 50005 / HTTP 8080), latency slider, auto-failover, auto-reconnect.
4. **Settings:** Pill-shaped 0.42" OLED screen toggle (on/off power save), OTA firmware file uploader, reboot, and factory reset.
