import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Radio, Activity, CheckCircle, AlertTriangle, Disc } from 'lucide-react';

interface AudioStreamTesterProps {
  hostIp: string;
  httpPort: number;
}

export const AudioStreamTester: React.FC<AudioStreamTesterProps> = ({ hostIp, httpPort }) => {
  const [isPlayingHost, setIsPlayingHost] = useState(false);
  const [hostStatus, setHostStatus] = useState<'idle' | 'connecting' | 'playing' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Local synthesizer test state
  const [localTonePlaying, setLocalTonePlaying] = useState(false);
  const [toneType, setToneType] = useState<'sine440' | 'sine1000' | 'sweep' | 'stereoLR'>('sine440');
  const [volume, setVolume] = useState(0.5);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const streamUrl = `http://${hostIp}:${httpPort}`;

  // Start/Stop listening to remote host
  const toggleHostStream = () => {
    if (isPlayingHost) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setIsPlayingHost(false);
      setHostStatus('idle');
    } else {
      // Stop local tone if playing
      stopLocalTone();

      setHostStatus('connecting');
      setErrorMessage('');

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audio = audioRef.current;
      audio.crossOrigin = 'anonymous';
      audio.src = streamUrl;

      audio.oncanplay = () => {
        audio.play().then(() => {
          setIsPlayingHost(true);
          setHostStatus('playing');
          initAudioVisualizer(audio);
        }).catch((err) => {
          console.error(err);
          setHostStatus('error');
          setErrorMessage('Autoplay was prevented or the host is unreachable. Ensure the Android app is streaming in Host Mode.');
        });
      };

      audio.onerror = () => {
        setHostStatus('error');
        setErrorMessage(`Cannot connect to ${streamUrl}. Make sure your PC/phone is on the SAME Wi-Fi network as the Android host.`);
        setIsPlayingHost(false);
      };

      audio.load();
    }
  };

  // Local Tone Generator
  const startLocalTone = () => {
    if (isPlayingHost) {
      toggleHostStream();
    }

    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx({ sampleRate: 44100 });
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    stopLocalTone();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const analyser = ctx.createAnalyser();

    analyser.fftSize = 256;
    gain.gain.setValueAtTime(volume, ctx.currentTime);

    if (toneType === 'sine440') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
    } else if (toneType === 'sine1000') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
    } else if (toneType === 'sweep') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 3);
    } else {
      // stereo L/R alternation
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    }

    osc.connect(gain);
    gain.connect(analyser);
    analyser.connect(ctx.destination);

    osc.start();

    oscillatorRef.current = osc;
    gainNodeRef.current = gain;
    analyserRef.current = analyser;
    setLocalTonePlaying(true);

    startVisualizerLoop(analyser);
  };

  const stopLocalTone = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (e) {}
      oscillatorRef.current = null;
    }
    setLocalTonePlaying(false);
  };

  // Visualizer loop
  const initAudioVisualizer = (audioElement: HTMLAudioElement) => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    try {
      const source = ctx.createMediaElementSource(audioElement);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
      startVisualizerLoop(analyser);
    } catch (e) {
      // Element might already be connected
    }
  };

  const startVisualizerLoop = (analyser: AnalyserNode) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.fillStyle = '#020617';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.2;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        const r = Math.min(255, 30 + i * 2);
        const g = Math.min(255, 200 - i * 1);
        const b = 255;

        canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  };

  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      stopLocalTone();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Overview & Live Tester */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <Radio className="w-5 h-5 text-cyan-400" />
          Wi-Fi Audio Stream Verifier & Live Listener
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Test whether your Android device is actively broadcasting the audio stream over your local network, and test reference 44.1kHz calibration tones.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Remote Host Listener (Browser Mode) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Disc className="w-4 h-4 text-cyan-400" />
                  1. Listen to Android Host Directly
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                  HTTP Port {httpPort}
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Connects directly to <code className="text-cyan-300 font-mono">{streamUrl}</code>. If you hear audio in your browser, your Android streamer is 100% operational!
              </p>

              {hostStatus === 'error' && (
                <div className="p-3 mb-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {hostStatus === 'playing' && (
                <div className="p-3 mb-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Streaming Live Audio from {hostIp}! Stream is active and verified.</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center gap-3">
              <button
                onClick={toggleHostStream}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  isPlayingHost
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20 shadow-md'
                }`}
              >
                {isPlayingHost ? (
                  <>
                    <Pause className="w-4 h-4" /> Stop Android Stream
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Connect & Listen to Host
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 2: 44.1kHz Hardware Audio Reference Generator */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  2. 44.1kHz Calibration Tone Generator
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-300">
                  Standard 16-bit PCM
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => setToneType('sine440')}
                  className={`p-2 rounded-lg text-xs font-medium border text-left ${
                    toneType === 'sine440'
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold block">440Hz Sine</span>
                  <span className="text-[10px] text-slate-500">Concert A (Match DAC Test)</span>
                </button>
                <button
                  onClick={() => setToneType('sine1000')}
                  className={`p-2 rounded-lg text-xs font-medium border text-left ${
                    toneType === 'sine1000'
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold block">1000Hz Sine</span>
                  <span className="text-[10px] text-slate-500">Standard Calibration</span>
                </button>
                <button
                  onClick={() => setToneType('sweep')}
                  className={`p-2 rounded-lg text-xs font-medium border text-left ${
                    toneType === 'sweep'
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold block">Freq Sweep</span>
                  <span className="text-[10px] text-slate-500">100Hz - 3000Hz</span>
                </button>
                <button
                  onClick={() => setToneType('stereoLR')}
                  className={`p-2 rounded-lg text-xs font-medium border text-left ${
                    toneType === 'stereoLR'
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold block">523Hz Tone</span>
                  <span className="text-[10px] text-slate-500">High C Note</span>
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <span className="text-xs font-mono text-slate-400 w-8">{Math.round(volume * 100)}%</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 mt-3">
              <button
                onClick={localTonePlaying ? stopLocalTone : startLocalTone}
                className={`w-full py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  localTonePlaying
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 shadow-md'
                }`}
              >
                {localTonePlaying ? (
                  <>
                    <VolumeX className="w-4 h-4" /> Stop Tone
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" /> Play Reference Tone
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Spectrum Visualizer Canvas */}
        <div className="mt-6 bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Real-time FFT Frequency Spectrum
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {isPlayingHost ? 'Android Stream Source' : localTonePlaying ? 'Synthesizer Source' : 'Idle'}
            </span>
          </div>

          <canvas
            ref={canvasRef}
            width={700}
            height={100}
            className="w-full h-24 bg-slate-950 rounded-lg border border-slate-900"
          ></canvas>
        </div>
      </div>
    </div>
  );
};
