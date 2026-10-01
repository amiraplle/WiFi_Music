import React, { useState, useEffect } from 'react';
import { Music, Wifi, Radio, Settings, Play, Square, RotateCw, Volume2, VolumeX, HardDrive, Smartphone, Check, Sparkles, Moon, Search, Radar, Minus, Plus } from 'lucide-react';

interface PillSwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
  sublabel?: string;
}

const PillSwitch: React.FC<PillSwitchProps> = ({ checked, onChange, label, sublabel }) => (
  <div className="flex items-center justify-between py-2">
    {label && (
      <div>
        <div className="text-xs font-medium text-slate-100">{label}</div>
        {sublabel && <div className="text-[11px] text-slate-400">{sublabel}</div>}
      </div>
    )}
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-[#d0bcff]' : 'bg-[#292d36]'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5 !bg-[#1d0160]' : 'translate-x-0 !bg-[#8e9099]'
        }`}
      />
    </button>
  </div>
);

export const MaterialAmoledPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'now' | 'wifi' | 'stream' | 'settings'>('now');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [oledEnabled, setOledEnabled] = useState<boolean>(true);
  const [bufferMs, setBufferMs] = useState<number>(180);
  const [preferredMode, setPreferredMode] = useState<'tcp' | 'http'>('tcp');
  const [autoFallback, setAutoFallback] = useState<boolean>(true);
  const [autoReconnect, setAutoReconnect] = useState<boolean>(true);
  const [autoDiscoverOnBoot, setAutoDiscoverOnBoot] = useState<boolean>(true);
  const [phoneHost, setPhoneHost] = useState<string>('192.168.254.119');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<Array<{ ip: string; port: number; type: string }>>([
    { ip: '192.168.254.119', port: 50005, type: 'Android TCP Streamer' },
  ]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(50);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Simulated live audio levels
  const [vuHeights, setVuHeights] = useState<number[]>([12, 18, 24, 16, 22, 14, 20]);

  useEffect(() => {
    if (!isPlaying) {
      setVuHeights([4, 4, 4, 4, 4, 4, 4]);
      return;
    }
    const interval = setInterval(() => {
      setVuHeights([
        Math.floor(Math.random() * 20) + 8,
        Math.floor(Math.random() * 24) + 10,
        Math.floor(Math.random() * 28) + 12,
        Math.floor(Math.random() * 22) + 10,
        Math.floor(Math.random() * 26) + 12,
        Math.floor(Math.random() * 18) + 8,
        Math.floor(Math.random() * 24) + 10,
      ]);
    }, 180);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Moon className="w-5 h-5 text-purple-300" />
              Material Design 3 AMOLED Web Interface
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
              AMOLED Pitch Black #000000
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            4-Tab app experience: <strong>Now Playing</strong>, <strong>Wi-Fi</strong>, <strong>Streaming</strong>, and <strong>Settings</strong>. Subdued soft lavender & sage tones tailored for low-luminance AMOLED screens.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Live Interactive Mockup</span>
        </div>
      </div>

      {/* AMOLED Phone Frame Mockup */}
      <div className="flex justify-center">
        <div className="w-full max-w-[420px] bg-black border-4 border-slate-800 rounded-[44px] shadow-2xl overflow-hidden relative flex flex-col min-h-[680px]">
          
          {/* Top Speaker & Notch */}
          <div className="h-6 bg-black flex justify-center items-center pt-2">
            <div className="w-20 h-4 bg-slate-900/90 rounded-full"></div>
          </div>

          {/* App Header */}
          <div className="bg-black/95 backdrop-blur px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-sm font-bold tracking-tight text-slate-100">C3 Music</span>
            <div className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${
              isPlaying
                ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-900 text-slate-400 border border-white/10'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
              <span>{isPlaying ? 'Streaming' : 'Stopped'}</span>
            </div>
          </div>

          {/* Tab Views */}
          <div className="flex-1 p-4 pb-24 overflow-y-auto scrollbar-none bg-black text-slate-200">
            {/* TAB 1: NOW PLAYING */}
            {activeTab === 'now' && (
              <div className="space-y-4 animate-fade-in">
                {/* Hero Disc Player */}
                <div className="bg-[#111215] border border-white/5 rounded-3xl p-5 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#1a1c22] to-[#0c0d10] border border-white/10 flex items-center justify-center shadow-lg my-2">
                    <div className="w-8 h-8 rounded-full bg-[#381e72] border-2 border-white/15 flex items-center justify-center">
                      <Music className="w-4 h-4 text-purple-200" />
                    </div>
                  </div>

                  <div className="text-xl font-bold text-white mt-1">
                    {isPlaying ? 'Live Streaming' : 'Ready'}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    44,100 Hz · 16-bit Stereo · {preferredMode === 'tcp' ? 'Raw TCP' : 'HTTP WAV'}
                  </div>

                  {/* Soft Level Bars */}
                  <div className="flex items-center justify-center gap-1 h-7 my-3">
                    {vuHeights.map((h, i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full bg-[#d0bcff] transition-all duration-150"
                        style={{ height: `${h}px`, opacity: isPlaying ? 0.85 : 0.2 }}
                      />
                    ))}
                  </div>

                  {/* Buffer Progress */}
                  <div className="w-full mt-2">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Buffer Occupancy</span>
                      <span className="font-mono text-purple-200">{isPlaying ? '38%' : '0%'}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#21242b] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#d0bcff] rounded-full transition-all duration-300"
                        style={{ width: isPlaying ? '38%' : '0%' }}
                      />
                    </div>
                  </div>

                  {/* Minimal Action Controls */}
                  <div className="grid grid-cols-3 gap-2 w-full mt-5">
                    <button
                      onClick={() => {
                        setIsPlaying(true);
                        triggerToast('Stream started');
                      }}
                      className="py-2.5 px-3 rounded-full bg-[#d0bcff] text-[#1d0160] text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Start
                    </button>
                    <button
                      onClick={() => {
                        setIsPlaying(false);
                        triggerToast('Stream stopped');
                      }}
                      className="py-2.5 px-3 rounded-full bg-[#181a1f] text-slate-200 text-xs font-medium border border-white/5 flex items-center justify-center gap-1 active:scale-95 transition-transform"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      Stop
                    </button>
                    <button
                      onClick={() => triggerToast('Reconnecting socket...')}
                      className="py-2.5 px-3 rounded-full bg-[#181a1f] text-slate-200 text-xs font-medium border border-white/5 flex items-center justify-center gap-1 active:scale-95 transition-transform"
                    >
                      <RotateCw className="w-3 h-3" />
                      Retry
                    </button>
                  </div>
                </div>

                {/* Digital Volume Control Card */}
                <div className="bg-[#111215] border border-white/5 rounded-3xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-purple-300" />
                      Output Volume
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const nextMuted = !isMuted;
                          setIsMuted(nextMuted);
                          triggerToast(nextMuted ? 'Audio Muted' : 'Audio Unmuted');
                        }}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 border transition-all active:scale-95 ${
                          isMuted
                            ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                            : 'bg-[#181a1f] border-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        <span>{isMuted ? 'Muted' : 'Unmuted'}</span>
                      </button>
                      <span className="font-mono text-sm font-bold text-purple-200 w-10 text-right">
                        {isMuted ? '0%' : `${volume}%`}
                      </span>
                    </div>
                  </div>

                  {/* Volume Slider + / - */}
                  <div className="flex items-center gap-3 py-1">
                    <button
                      onClick={() => {
                        const next = Math.max(0, volume - 5);
                        setVolume(next);
                        if (isMuted) setIsMuted(false);
                        triggerToast(`Volume ${next}%`);
                      }}
                      className="w-7 h-7 rounded-full bg-[#181a1f] hover:bg-[#21242b] text-slate-200 flex items-center justify-center border border-white/5 active:scale-90 transition-transform"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={volume}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setVolume(val);
                        if (isMuted && val > 0) setIsMuted(false);
                      }}
                      className="flex-1 accent-[#d0bcff] cursor-pointer h-2 bg-[#21242b] rounded-full"
                    />
                    <button
                      onClick={() => {
                        const next = Math.min(100, volume + 5);
                        setVolume(next);
                        if (isMuted) setIsMuted(false);
                        triggerToast(`Volume ${next}%`);
                      }}
                      className="w-7 h-7 rounded-full bg-[#181a1f] hover:bg-[#21242b] text-slate-200 flex items-center justify-center border border-white/5 active:scale-90 transition-transform"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[
                      { val: 20, label: '20% Soft' },
                      { val: 50, label: '50% Mid' },
                      { val: 75, label: '75% Loud' },
                      { val: 100, label: '100% Max' },
                    ].map((p) => (
                      <button
                        key={p.val}
                        onClick={() => {
                          setVolume(p.val);
                          if (isMuted) setIsMuted(false);
                          triggerToast(`Volume ${p.val}%`);
                        }}
                        className={`py-1.5 rounded-xl text-[10px] font-semibold border transition-all ${
                          volume === p.val && !isMuted
                            ? 'bg-[#381e72] border-purple-400/40 text-purple-200'
                            : 'bg-[#181a1f] border-white/5 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stream Telemetry Card */}
                <div className="bg-[#111215] border border-white/5 rounded-3xl p-4 space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    Stream Telemetry
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-white/5">
                    <span className="text-slate-400">Host IP</span>
                    <span className="font-mono text-slate-200">{phoneHost} ({preferredMode === 'tcp' ? '50005' : '8080'})</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-white/5">
                    <span className="text-slate-400">Session Duration</span>
                    <span className="font-mono text-slate-200">{isPlaying ? '02:45' : '00:00'}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-400">Buffer Underruns</span>
                    <span className="font-mono text-emerald-400">0</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: WI-FI */}
            {activeTab === 'wifi' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-[#111215] border border-white/5 rounded-3xl p-5 space-y-3">
                  <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    Network Status
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-white/5">
                    <span className="text-slate-400">Network SSID</span>
                    <span className="font-semibold text-slate-100">GFiber_2.4_Coverage</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-white/5">
                    <span className="text-slate-400">ESP32 IP</span>
                    <span className="font-mono text-purple-200">192.168.254.88</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-white/5">
                    <span className="text-slate-400">Signal (RSSI)</span>
                    <span className="font-mono text-emerald-400">-52 dBm (Excellent)</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5">
                    <span className="text-slate-400">Local URL</span>
                    <span className="font-mono text-slate-300">http://c3music.local</span>
                  </div>

                  <button
                    onClick={() => triggerToast('Reconnecting Wi-Fi...')}
                    className="w-full mt-2 py-2.5 rounded-full bg-[#181a1f] border border-white/10 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5"
                  >
                    <Wifi className="w-3.5 h-3.5 text-purple-300" />
                    Reconnect Wi-Fi
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: STREAMING SETUP */}
            {activeTab === 'stream' && (
              <div className="space-y-4 animate-fade-in">
                {/* Auto-Discovery Card */}
                <div className="bg-[#111215] border border-purple-500/20 rounded-3xl p-5 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-purple-300 tracking-wider uppercase flex items-center gap-1.5">
                        <Radar className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                        Wi-Fi Stream Auto-Discovery
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Scan home Wi-Fi subnet for active audio transmitters
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={isScanning}
                    onClick={() => {
                      setIsScanning(true);
                      triggerToast('Scanning subnet on ports 50005 & 8080...');
                      setTimeout(() => {
                        setIsScanning(false);
                        setDiscoveredDevices([
                          { ip: '192.168.254.119', port: 50005, type: 'Android TCP Streamer (Active)' },
                          { ip: '192.168.254.105', port: 8080, type: 'HTTP WAV Server (Available)' }
                        ]);
                        triggerToast('Found 2 stream sources on home Wi-Fi!');
                      }, 1200);
                    }}
                    className="w-full py-2.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-purple-500/25 active:scale-95 transition-all"
                  >
                    <Search className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>{isScanning ? 'Scanning Local Wi-Fi Subnet...' : 'Scan for Available Streams'}</span>
                  </button>

                  {/* Discovered Device Pills */}
                  {discoveredDevices.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        Found on Wi-Fi:
                      </div>
                      {discoveredDevices.map((dev, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-[#181a1f] border border-white/5 text-xs"
                        >
                          <div>
                            <div className="font-mono text-purple-200 font-semibold">{dev.ip}:{dev.port}</div>
                            <div className="text-[10px] text-slate-400">{dev.type}</div>
                          </div>
                          <button
                            onClick={() => {
                              setPhoneHost(dev.ip);
                              setPreferredMode(dev.port === 50005 ? 'tcp' : 'http');
                              triggerToast(`Selected ${dev.ip}`);
                            }}
                            className="px-3 py-1 rounded-full bg-[#d0bcff] text-[#1d0160] text-[11px] font-bold active:scale-95 transition-transform"
                          >
                            Use
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <PillSwitch
                    checked={autoDiscoverOnBoot}
                    onChange={(val) => {
                      setAutoDiscoverOnBoot(val);
                      triggerToast(val ? 'Auto-discover on boot enabled' : 'Auto-discover disabled');
                    }}
                    label="Auto-Connect on Boot"
                    sublabel="Auto-probe subnet when powered on"
                  />
                </div>

                {/* Manual Stream Parameters */}
                <div className="bg-[#111215] border border-white/5 rounded-3xl p-5 space-y-3.5">
                  <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    Manual Host Settings
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Stream Host IP (or auto)</label>
                    <input
                      type="text"
                      value={phoneHost}
                      onChange={(e) => setPhoneHost(e.target.value)}
                      placeholder="e.g. 192.168.254.119 or auto"
                      className="w-full bg-[#08080a] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-purple-200 focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Streaming Protocol</label>
                    <select
                      value={preferredMode}
                      onChange={(e) => setPreferredMode(e.target.value as any)}
                      className="w-full bg-[#08080a] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-400"
                    >
                      <option value="tcp">Raw TCP (Port 50005 - Zero Latency)</option>
                      <option value="http">HTTP WAV (Port 8080 - Auto Detect)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Target Buffer Latency</span>
                      <span className="font-mono text-purple-300">{bufferMs} ms</span>
                    </div>
                    <input
                      type="range"
                      min={80}
                      max={500}
                      step={10}
                      value={bufferMs}
                      onChange={(e) => setBufferMs(Number(e.target.value))}
                      className="w-full accent-purple-400"
                    />
                  </div>

                  <div className="border-t border-white/5 pt-1 space-y-1">
                    <PillSwitch
                      checked={autoFallback}
                      onChange={(val) => setAutoFallback(val)}
                      label="Auto Protocol Failover"
                      sublabel="Switch TCP <-> HTTP if primary fails"
                    />
                    <PillSwitch
                      checked={autoReconnect}
                      onChange={(val) => setAutoReconnect(val)}
                      label="Auto Reconnect"
                      sublabel="Immediately retry when stream drops"
                    />
                  </div>

                  <button
                    onClick={() => triggerToast('Stream settings saved!')}
                    className="w-full py-2.5 rounded-full bg-[#d0bcff] text-[#1d0160] text-xs font-bold active:scale-95 transition-transform"
                  >
                    Save & Apply
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: SETTINGS & OTA */}
            {activeTab === 'settings' && (
              <div className="space-y-4 animate-fade-in">
                {/* OLED Display Pill-Shape Switch */}
                <div className="bg-[#111215] border border-white/5 rounded-3xl p-5 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    Hardware Display Controls
                  </div>
                  
                  <PillSwitch
                    checked={oledEnabled}
                    onChange={(val) => {
                      setOledEnabled(val);
                      triggerToast(val ? '0.42" OLED turned ON' : '0.42" OLED turned OFF (Power Save)');
                    }}
                    label='0.42" OLED Screen'
                    sublabel={oledEnabled ? 'Status: Active (Showing audio info & VU meter)' : 'Status: Off (Low power sleep)'}
                  />
                </div>

                {/* OTA Firmware */}
                <div className="bg-[#111215] border border-white/5 rounded-3xl p-5 space-y-3">
                  <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    Firmware OTA Update
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Flash compiled .bin binary from GitHub Actions over the air:
                  </p>
                  <div className="p-3 border border-dashed border-white/10 rounded-xl text-center">
                    <input type="file" accept=".bin" className="text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:bg-purple-900/50 file:text-purple-200" />
                  </div>
                  <button
                    onClick={() => triggerToast('Select .bin file first')}
                    className="w-full py-2.5 rounded-full bg-[#181a1f] border border-white/10 text-xs font-semibold text-slate-200"
                  >
                    Install Firmware
                  </button>
                </div>

                {/* System Actions */}
                <div className="bg-[#111215] border border-white/5 rounded-3xl p-5 space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    Device Actions
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => triggerToast('Rebooting ESP32...')}
                      className="py-2.5 rounded-full bg-[#181a1f] border border-white/10 text-xs text-slate-200 font-medium"
                    >
                      Restart ESP32
                    </button>
                    <button
                      onClick={() => triggerToast('Factory reset')}
                      className="py-2.5 rounded-full bg-rose-950/20 border border-rose-500/20 text-xs text-rose-300 font-medium"
                    >
                      Reset Settings
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Toast Notification */}
          {toastMsg && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#21242b] border border-white/15 px-4 py-2 rounded-full text-xs text-slate-100 shadow-xl z-50 animate-fade-in font-medium pointer-events-none">
              {toastMsg}
            </div>
          )}

          {/* 4 Bottom Navigation Tabs */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-black/95 backdrop-blur border-t border-white/10 flex items-center justify-around z-40">
            <button
              onClick={() => setActiveTab('now')}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 ${
                activeTab === 'now' ? 'text-[#d0bcff] font-bold' : 'text-slate-500'
              }`}
            >
              <Music className="w-4 h-4" />
              <span className="text-[10px]">Now Playing</span>
            </button>

            <button
              onClick={() => setActiveTab('wifi')}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 ${
                activeTab === 'wifi' ? 'text-[#d0bcff] font-bold' : 'text-slate-500'
              }`}
            >
              <Wifi className="w-4 h-4" />
              <span className="text-[10px]">Wi-Fi</span>
            </button>

            <button
              onClick={() => setActiveTab('stream')}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 ${
                activeTab === 'stream' ? 'text-[#d0bcff] font-bold' : 'text-slate-500'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span className="text-[10px]">Streaming</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 ${
                activeTab === 'settings' ? 'text-[#d0bcff] font-bold' : 'text-slate-500'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="text-[10px]">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
