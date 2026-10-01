import React from 'react';
import { Cpu, Radio, Activity, Volume2, ShieldCheck, Github, ExternalLink, Moon, FolderTree } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  statusText?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'material-ui', label: 'Material AMOLED UI', icon: Moon },
    { id: 'modular-project', label: 'Modular Project Code', icon: FolderTree },
    { id: 'wiring', label: 'Wiring & Pinouts', icon: Cpu },
    { id: 'tester', label: 'Stream Tester', icon: Volume2 },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Hardware Badges */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-cyan-500/20 shadow-md">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-tight text-lg">
                  ESP32-C3 Audio Studio
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  UDA1334A Fixed
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                For ESP32-C3 SuperMini • 0.42" OLED (SSD1306) • pkarthikmohan/wifi-audio-streamer
              </p>
            </div>
          </div>

          {/* External links */}
          <div className="flex items-center space-x-2">
            <a
              href="https://github.com/pkarthikmohan/wifi-audio-streamer"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Host Repo</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 border-t border-slate-800/80 pt-2 pb-2 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
