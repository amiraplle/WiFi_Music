import React, { useState } from 'react';
import { MODULAR_FILES } from '../data/modularProjectFiles';
import { FolderTree, FileCode, Download, Copy, Check, GitBranch, Terminal, ExternalLink, Sparkles, FolderArchive, ArrowRight, Code } from 'lucide-react';

interface ProjectFile {
  name: string;
  path: string;
  category: 'workflow' | 'config' | 'include' | 'src';
  description: string;
}

const PROJECT_FILES: ProjectFile[] = [
  { name: 'main.cpp', path: 'src/main.cpp', category: 'src', description: 'Clean top-level coordinator: FreeRTOS tasks & system init' },
  { name: 'config.h', path: 'include/config.h', category: 'include', description: 'Hardware pins (I2S 3/1/10, OLED 5/6), Wi-Fi defaults, enums' },
  { name: 'audio_i2s.h', path: 'include/audio_i2s.h', category: 'include', description: 'Hardware I2S engine declaration (fixed MCLK = 0 & DMA)' },
  { name: 'audio_i2s.cpp', path: 'src/audio_i2s.cpp', category: 'src', description: 'UDA1334A I2S driver implementation & startup test tone' },
  { name: 'stream_client.h', path: 'include/stream_client.h', category: 'include', description: 'Dual TCP 50005 + HTTP 8080 streaming engine declaration' },
  { name: 'stream_client.cpp', path: 'src/stream_client.cpp', category: 'src', description: 'Socket streaming loop with Wi-Fi subnet auto-discovery' },
  { name: 'audio_ringbuf.h', path: 'include/audio_ringbuf.h', category: 'include', description: 'Thread-safe FreeRTOS ring buffer declaration' },
  { name: 'audio_ringbuf.cpp', path: 'src/audio_ringbuf.cpp', category: 'src', description: 'FreeRTOS critical-section ring buffer implementation' },
  { name: 'display_oled.h', path: 'include/display_oled.h', category: 'include', description: '0.42" OLED SSD1306 U8g2 controller declaration' },
  { name: 'display_oled.cpp', path: 'src/display_oled.cpp', category: 'src', description: 'OLED multi-view rendering & smooth VU meter' },
  { name: 'web_assets.h', path: 'include/web_assets.h', category: 'include', description: 'Material Design 3 AMOLED 4-tab web app HTML/CSS/JS' },
  { name: 'web_server.h', path: 'include/web_server.h', category: 'include', description: 'REST API, OTA upload handler, mDNS responder' },
  { name: 'web_server.cpp', path: 'src/web_server.cpp', category: 'src', description: 'Web server routes and OTA flash handling' },
  { name: 'platformio.ini', path: 'platformio.ini', category: 'config', description: 'PlatformIO configuration for ESP32-C3 SuperMini' },
  { name: 'build.yml', path: '.github/workflows/build.yml', category: 'workflow', description: 'GitHub Actions workflow: automated PlatformIO build on push' },
];

export const ModularProjectExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(PROJECT_FILES[0]);
  const [copied, setCopied] = useState<boolean>(false);

  const fileCode = MODULAR_FILES[selectedFile.path] || '// File content loading...';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(fileCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([fileCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = () => {
    const link = document.createElement('a');
    link.href = '/C3_Music_Modular_Project.zip';
    link.download = 'C3_Music_Modular_Project.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-purple-950/30 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs font-semibold text-purple-300">
            <Sparkles className="w-3.5 h-3.5" />
            Clean Modular Repository
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            C3 Music Receiver (Modular PlatformIO Architecture)
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Cleanly split into 15 modular header and source files with automated GitHub Actions workflow (<code className="text-purple-300">build.yml</code>). Zero legacy code.
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/20 active:scale-95 transition-all self-start md:self-auto"
        >
          <FolderArchive className="w-4 h-4" />
          <span>Download Complete Project (ZIP)</span>
        </button>
      </div>

      {/* Two Column Layout: File Tree + Real Code Viewer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* File Tree List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-purple-400" />
              Project Files ({PROJECT_FILES.length})
            </span>
          </div>

          <div className="space-y-1">
            {PROJECT_FILES.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-purple-500/15 text-purple-200 border border-purple-500/30 font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="flex items-center gap-2 font-mono truncate">
                    <FileCode className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-purple-400' : 'text-slate-500'}`} />
                    {file.path}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 flex-shrink-0 ml-2">
                    {file.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected File Details & Real Code Editor */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between overflow-hidden shadow-lg">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  {selectedFile.category}
                </span>
                <h3 className="text-base font-bold text-white font-mono mt-1">
                  {selectedFile.path}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedFile.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleDownloadFile}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {selectedFile.name}</span>
                </button>
              </div>
            </div>

            {/* Live Code Content */}
            <div className="relative">
              <pre className="w-full max-h-[500px] overflow-auto rounded-xl bg-black border border-white/5 p-4 text-xs font-mono text-slate-300 leading-relaxed scrollbar-thin">
                <code>{fileCode}</code>
              </pre>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400 mt-3">
            <span>Lines: {fileCode.split('\n').length}</span>
            <span className="text-purple-300 font-mono">PlatformIO · ESP32-C3</span>
          </div>
        </div>
      </div>
    </div>
  );
};

