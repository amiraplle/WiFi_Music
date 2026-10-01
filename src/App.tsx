import React, { useState } from 'react';
import { HardwareConfig } from './types';
import { Navbar } from './components/Navbar';
import { MaterialAmoledPreview } from './components/MaterialAmoledPreview';
import { ModularProjectExplorer } from './components/ModularProjectExplorer';
import { PinoutVisualizer } from './components/PinoutVisualizer';
import { AudioStreamTester } from './components/AudioStreamTester';
import { ShieldCheck, Cpu, Radio, Volume2, Sparkles, CheckCircle, ArrowRight, Moon, FolderTree } from 'lucide-react';

const DEFAULT_CONFIG: HardwareConfig = {
  bclkPin: 3,
  wselPin: 1,
  doutPin: 10,
  sdaPin: 5,
  sclPin: 6,
  sampleRate: 44100,
  bitsPerSample: 16,
  channels: 'stereo',
  protocol: 'dual',
  tcpPort: 50005,
  httpPort: 8080,
  dmaBufCount: 8,
  dmaBufLen: 512,
  wifiSsid: 'GFiber_2.4_Coverage_AECD9',
  wifiPass: '006BF4FD',
  hostIp: '192.168.254.119',
  oledWidth: 72,
  oledHeight: 40,
  oledAddress: '0x3C',
};

export default function App() {
  const [config, setConfig] = useState<HardwareConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<string>('material-ui');

  const updateConfig = (newVals: Partial<HardwareConfig>) => {
    setConfig((prev) => ({ ...prev, ...newVals }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500/20 selection:text-purple-200">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Project Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-purple-950/30 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs font-semibold text-purple-300">
                <Sparkles className="w-3.5 h-3.5" />
                C3 Music Receiver v2.0
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                ESP32-C3 SuperMini + UDA1334A DAC + 0.42" OLED
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                Featuring a <strong className="text-purple-200">Material Design 3 AMOLED 4-tab app</strong>, Wi-Fi stream auto-discovery, smooth pill toggle switches, and a 15-file clean modular architecture for PlatformIO.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
              <button
                onClick={() => setActiveTab('modular-project')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
              >
                <FolderTree className="w-4 h-4" />
                <span>View Modular Code (15 Files)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setActiveTab('wiring')}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Verified Pins</span>
              </button>
            </div>
          </div>

          {/* Quick Key Takeaway Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>I2S Pins:</strong> BCLK: GPIO 3, WS: GPIO 1, DIN: GPIO 10</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>0.42" OLED:</strong> SDA: GPIO 5, SCL: GPIO 6</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>DAC Wiring:</strong> MCLK disconnected, MUTE to GND</span>
            </div>
          </div>
        </div>

        {/* Tab Content Sections */}
        {activeTab === 'material-ui' && <MaterialAmoledPreview />}
        {activeTab === 'modular-project' && <ModularProjectExplorer />}
        {activeTab === 'wiring' && <PinoutVisualizer config={config} onUpdateConfig={updateConfig} />}
        {activeTab === 'tester' && <AudioStreamTester hostIp={config.hostIp} httpPort={config.httpPort} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>ESP32-C3 SuperMini Audio Streamer Studio • Compatible with pkarthikmohan/wifi-audio-streamer</p>
          <p className="font-mono text-slate-400">Sample Rate: 44.1 kHz • 16-bit PCM Stereo</p>
        </div>
      </footer>
    </div>
  );
}
