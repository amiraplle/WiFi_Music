import React from 'react';
import { HardwareConfig } from '../types';
import { ESP32_C3_PINS } from '../data/pinDefinitions';
import { AlertTriangle, CheckCircle2, Info, Zap, Sparkles } from 'lucide-react';

interface PinoutVisualizerProps {
  config: HardwareConfig;
  onUpdateConfig: (newConfig: Partial<HardwareConfig>) => void;
}

export const PinoutVisualizer: React.FC<PinoutVisualizerProps> = ({ config, onUpdateConfig }) => {
  // Check for pin conflicts
  const conflicts: string[] = [];

  if (config.bclkPin === config.wselPin || config.bclkPin === config.doutPin || config.wselPin === config.doutPin) {
    conflicts.push('I2S pins (BCLK, WSEL, DOUT) cannot share the same GPIO.');
  }

  if ([config.bclkPin, config.wselPin, config.doutPin].includes(config.sdaPin)) {
    conflicts.push(`GPIO ${config.sdaPin} is used by 0.42" OLED SDA and cannot be used for I2S.`);
  }

  if ([config.bclkPin, config.wselPin, config.doutPin].includes(config.sclPin)) {
    conflicts.push(`GPIO ${config.sclPin} is used by 0.42" OLED SCL and cannot be used for I2S.`);
  }

  if ([config.bclkPin, config.wselPin, config.doutPin].includes(18) || [config.bclkPin, config.wselPin, config.doutPin].includes(19)) {
    conflicts.push('GPIO 18 & 19 are dedicated to Native USB-C CDC. Assigning them to I2S will disable USB programming and Serial Monitor.');
  }

  if ([config.bclkPin, config.wselPin, config.doutPin].includes(9)) {
    conflicts.push('GPIO 9 is the BOOT button strapping pin. It should be avoided for high-speed I2S clock lines.');
  }

  const safePins = ESP32_C3_PINS.filter((p) => p.isSafeForI2S);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Hardware Wiring & I2S Pinout Matrix
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              ESP32-C3 SuperMini + Embedded 0.42" OLED (SSD1306) + Adafruit / Generic UDA1334A I2S DAC
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-mono">
              3.3V Logic Level
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-mono">
              I2S_NUM_0 Only
            </span>
          </div>
        </div>

        {/* Conflicts Alert */}
        {conflicts.length > 0 ? (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
            <div className="flex items-center gap-2 font-semibold text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Pin Assignment Conflict Detected:
            </div>
            {conflicts.map((c, i) => (
              <p key={i} className="pl-6">• {c}</p>
            ))}
          </div>
        ) : (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Clean Configuration:</strong> No GPIO collisions between I2S audio, 0.42" OLED I2C, and USB CDC.
            </span>
          </div>
        )}
      </div>

      {/* Visual Hardware Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ESP32-C3 SuperMini Board Visual */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                ESP32-C3 SuperMini
              </h3>
              <span className="text-[11px] font-mono text-slate-400">RISC-V 160MHz</span>
            </div>

            {/* Microcontroller representation */}
            <div className="bg-slate-950 border-2 border-slate-700/80 rounded-xl p-4 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-3 bg-slate-700/60 rounded-b-md flex items-center justify-center">
                <span className="text-[9px] text-slate-400 font-mono">USB-C</span>
              </div>

              <div className="my-3 text-center">
                <div className="inline-block px-3 py-1 bg-slate-800/80 rounded border border-slate-700 text-[11px] font-mono text-cyan-300">
                  ESP32-C3FH4
                </div>
              </div>

              {/* Pin selectors */}
              <div className="space-y-3 pt-2">
                {/* BCLK selector */}
                <div className="flex items-center justify-between bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                    <span className="text-xs font-semibold text-slate-200">I2S BCLK</span>
                  </div>
                  <select
                    value={config.bclkPin}
                    onChange={(e) => onUpdateConfig({ bclkPin: Number(e.target.value) })}
                    className="bg-slate-800 text-amber-300 font-mono text-xs px-2.5 py-1 rounded border border-slate-700 focus:outline-none focus:border-amber-400"
                  >
                    {safePins.map((p) => (
                      <option key={p.pin} value={p.pin}>
                        GPIO {p.pin} ({p.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* WSEL selector */}
                <div className="flex items-center justify-between bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                    <span className="text-xs font-semibold text-slate-200">I2S WSEL (LRCK)</span>
                  </div>
                  <select
                    value={config.wselPin}
                    onChange={(e) => onUpdateConfig({ wselPin: Number(e.target.value) })}
                    className="bg-slate-800 text-emerald-300 font-mono text-xs px-2.5 py-1 rounded border border-slate-700 focus:outline-none focus:border-emerald-400"
                  >
                    {safePins.map((p) => (
                      <option key={p.pin} value={p.pin}>
                        GPIO {p.pin} ({p.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* DOUT selector */}
                <div className="flex items-center justify-between bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-400"></span>
                    <span className="text-xs font-semibold text-slate-200">I2S DOUT (Data)</span>
                  </div>
                  <select
                    value={config.doutPin}
                    onChange={(e) => onUpdateConfig({ doutPin: Number(e.target.value) })}
                    className="bg-slate-800 text-blue-300 font-mono text-xs px-2.5 py-1 rounded border border-slate-700 focus:outline-none focus:border-blue-400"
                  >
                    {safePins.map((p) => (
                      <option key={p.pin} value={p.pin}>
                        GPIO {p.pin} ({p.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Power supply:</span>
            <span className="font-mono text-cyan-400 font-semibold">3.3V / 500mA+</span>
          </div>
        </div>

        {/* 0.42" OLED Display Module */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                Embedded 0.42" OLED
              </h3>
              <span className="text-[11px] font-mono text-slate-400">SSD1306 (72x40)</span>
            </div>

            {/* OLED Mockup */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center shadow-inner">
              <div className="w-44 h-24 bg-black border-2 border-slate-700 rounded-lg p-2.5 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400">
                  <span>WIFI STREAM</span>
                  <span className="text-[8px] bg-cyan-900/60 px-1 rounded text-cyan-300">44.1k</span>
                </div>
                <div className="text-center font-mono text-xs font-bold text-white tracking-wider">
                  {config.hostIp}
                </div>
                <div className="w-full bg-slate-900 h-2 rounded overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full w-3/4 animate-pulse"></div>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 mt-2 font-mono">Address: 0x3C</span>
            </div>

            {/* I2C Pin Assignments */}
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between text-xs bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400">OLED SDA</span>
                <span className="font-mono font-bold text-purple-400">GPIO {config.sdaPin}</span>
              </div>
              <div className="flex items-center justify-between text-xs bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400">OLED SCL</span>
                <span className="font-mono font-bold text-purple-400">GPIO {config.sclPin}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span className="text-amber-400 font-medium">Notice:</span> Keep display updates non-blocking (every 400ms) so I2C doesn't starve I2S DMA.
          </div>
        </div>

        {/* UDA1334A I2S DAC Module */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                UDA1334A I2S DAC
              </h3>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">Stereo 3.5mm Out</span>
            </div>

            {/* DAC Board visual */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-inner">
              <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                <span>DAC Terminal Pins</span>
                <span className="text-[10px] text-slate-500 font-mono">16/24-bit PLL</span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400">VIN</span>
                  <span className="text-rose-400 font-bold">3.3V (from ESP32)</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400">GND</span>
                  <span className="text-slate-400 font-bold">GND (Common)</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-amber-500/10 border border-amber-500/30">
                  <span className="text-amber-300 font-bold">BCLK</span>
                  <span className="text-amber-400 font-bold">GPIO {config.bclkPin}</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-emerald-300 font-bold">WSEL (LRCK)</span>
                  <span className="text-emerald-400 font-bold">GPIO {config.wselPin}</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-blue-500/10 border border-blue-500/30">
                  <span className="text-blue-300 font-bold">DIN</span>
                  <span className="text-blue-400 font-bold">GPIO {config.doutPin}</span>
                </div>

                {/* THE FATAL ERROR PINS */}
                <div className="flex items-center justify-between p-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  <span>MCLK</span>
                  <span className="text-emerald-400 font-bold">DISCONNECTED (Working)</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800 text-slate-400">
                  <span>MUTE</span>
                  <span className="text-slate-400 font-bold">Unconnected (Internal pulldown)</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800 text-slate-400">
                  <span>SF0 & SF1</span>
                  <span className="text-slate-400 font-bold">Unconnected (Default I2S)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Connect headphones or speakers with 3.5mm jack.</span>
          </div>
        </div>
      </div>

      {/* Wire Connection Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Quick Physical Wiring Cheat-Sheet
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">UDA1334A DAC Pin</th>
                <th className="py-2.5 px-3">ESP32-C3 SuperMini Pin</th>
                <th className="py-2.5 px-3">Wire Color Suggestion</th>
                <th className="py-2.5 px-3">Crucial Hardware Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              <tr>
                <td className="py-2.5 px-3 font-bold text-white">VIN</td>
                <td className="py-2.5 px-3 text-rose-400">3.3V</td>
                <td className="py-2.5 px-3"><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5"></span>Red</td>
                <td className="py-2.5 px-3 text-slate-300">Power supply for analog DAC stage</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-white">GND</td>
                <td className="py-2.5 px-3 text-slate-400">GND</td>
                <td className="py-2.5 px-3"><span className="inline-block w-2.5 h-2.5 rounded-full bg-black border border-slate-600 mr-1.5"></span>Black</td>
                <td className="py-2.5 px-3 text-slate-300">Common ground with ESP32-C3</td>
              </tr>
              <tr className="bg-amber-500/5">
                <td className="py-2.5 px-3 font-bold text-amber-300">BCLK</td>
                <td className="py-2.5 px-3 text-amber-400 font-bold">GPIO {config.bclkPin}</td>
                <td className="py-2.5 px-3"><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 mr-1.5"></span>Yellow</td>
                <td className="py-2.5 px-3 text-slate-300">Continuous bit clock (feeds internal PLL)</td>
              </tr>
              <tr className="bg-emerald-500/5">
                <td className="py-2.5 px-3 font-bold text-emerald-300">WSEL</td>
                <td className="py-2.5 px-3 text-emerald-400 font-bold">GPIO {config.wselPin}</td>
                <td className="py-2.5 px-3"><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 mr-1.5"></span>Green</td>
                <td className="py-2.5 px-3 text-slate-300">Word Select / Left-Right Clock (44.1 kHz)</td>
              </tr>
              <tr className="bg-blue-500/5">
                <td className="py-2.5 px-3 font-bold text-blue-300">DIN</td>
                <td className="py-2.5 px-3 text-blue-400 font-bold">GPIO {config.doutPin}</td>
                <td className="py-2.5 px-3"><span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-400 mr-1.5"></span>Blue</td>
                <td className="py-2.5 px-3 text-slate-300">16-bit PCM Serial Audio Data In</td>
              </tr>
              <tr className="bg-rose-500/10">
                <td className="py-2.5 px-3 font-bold text-rose-300">MCLK</td>
                <td className="py-2.5 px-3 text-rose-400 font-bold">NOT CONNECTED (FLOAT)</td>
                <td className="py-2.5 px-3 text-slate-500">None</td>
                <td className="py-2.5 px-3 text-rose-300 font-bold">DO NOT CONNECT! UDA1334A generates MCLK internally via PLL.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-indigo-300">MUTE</td>
                <td className="py-2.5 px-3 text-indigo-400">GND</td>
                <td className="py-2.5 px-3"><span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500 mr-1.5"></span>Brown</td>
                <td className="py-2.5 px-3 text-slate-300">Active High: Tie to GND so DAC never enters mute</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-300">SF0 / SF1</td>
                <td className="py-2.5 px-3 text-slate-400">GND</td>
                <td className="py-2.5 px-3 text-slate-500">Jumpers</td>
                <td className="py-2.5 px-3 text-slate-300">Both LOW = Standard I2S Philips data format</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
