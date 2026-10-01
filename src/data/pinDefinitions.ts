export interface PinInfo {
  pin: number;
  gpio: number;
  name: string;
  label: string;
  defaultRole: string;
  isSafeForI2S: boolean;
  notes: string;
}

export const ESP32_C3_PINS: PinInfo[] = [
  { pin: 0, gpio: 0, name: 'GPIO 0', label: 'GPIO 0', defaultRole: 'ADC1_CH0', isSafeForI2S: true, notes: 'Available GPIO' },
  { pin: 1, gpio: 1, name: 'GPIO 1', label: 'GPIO 1', defaultRole: 'I2S WS / LRCK', isSafeForI2S: true, notes: 'Connected to UDA1334A WSEL' },
  { pin: 2, gpio: 2, name: 'GPIO 2', label: 'GPIO 2', defaultRole: 'ADC1_CH2', isSafeForI2S: true, notes: 'Strapping pin (pulled high)' },
  { pin: 3, gpio: 3, name: 'GPIO 3', label: 'GPIO 3', defaultRole: 'I2S BCLK', isSafeForI2S: true, notes: 'Connected to UDA1334A BCLK' },
  { pin: 4, gpio: 4, name: 'GPIO 4', label: 'GPIO 4', defaultRole: 'ADC1_CH4', isSafeForI2S: true, notes: 'Available GPIO' },
  { pin: 5, gpio: 5, name: 'GPIO 5', label: 'GPIO 5', defaultRole: 'OLED SDA', isSafeForI2S: false, notes: 'Dedicated to 0.42" OLED I2C SDA' },
  { pin: 6, gpio: 6, name: 'GPIO 6', label: 'GPIO 6', defaultRole: 'OLED SCL', isSafeForI2S: false, notes: 'Dedicated to 0.42" OLED I2C SCL' },
  { pin: 7, gpio: 7, name: 'GPIO 7', label: 'GPIO 7', defaultRole: 'SPI / GPIO', isSafeForI2S: true, notes: 'Available general-purpose GPIO' },
  { pin: 8, gpio: 8, name: 'GPIO 8', label: 'GPIO 8', defaultRole: 'Onboard LED', isSafeForI2S: true, notes: 'Active-low onboard blue LED' },
  { pin: 9, gpio: 9, name: 'GPIO 9', label: 'GPIO 9', defaultRole: 'BOOT Button', isSafeForI2S: false, notes: 'Strapping pin for flashing bootloader' },
  { pin: 10, gpio: 10, name: 'GPIO 10', label: 'GPIO 10', defaultRole: 'I2S DOUT', isSafeForI2S: true, notes: 'Connected to UDA1334A DIN' },
  { pin: 18, gpio: 18, name: 'GPIO 18', label: 'GPIO 18', defaultRole: 'USB D-', isSafeForI2S: false, notes: 'Native USB CDC data minus' },
  { pin: 19, gpio: 19, name: 'GPIO 19', label: 'GPIO 19', defaultRole: 'USB D+', isSafeForI2S: false, notes: 'Native USB CDC data plus' },
];
