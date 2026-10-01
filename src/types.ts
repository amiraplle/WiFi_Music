export interface HardwareConfig {
  bclkPin: number;
  wselPin: number;
  doutPin: number;
  sdaPin: number;
  sclPin: number;
  sampleRate: number;
  bitsPerSample: number;
  channels: 'stereo' | 'mono';
  protocol: 'raw_tcp' | 'http_wav' | 'dual';
  tcpPort: number;
  httpPort: number;
  dmaBufCount: number;
  dmaBufLen: number;
  wifiSsid: string;
  wifiPass: string;
  hostIp: string;
  oledWidth: number;
  oledHeight: number;
  oledAddress: string;
}

export interface PinDefinition {
  pin: number;
  name: string;
  defaultRole: string;
  type: 'general' | 'strapping' | 'usb' | 'uart' | 'oled';
  notes: string;
  isSafeForI2S: boolean;
}

export interface IssueItem {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  cause: string;
  symptom: string;
  fix: string;
  codeSnippetBefore?: string;
  codeSnippetAfter?: string;
}
