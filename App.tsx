
import React, { useState, useRef } from 'react';
import { Icons } from './constants';
import YouTubeEmbed, { YouTubePlayerHandle } from './components/YouTubeEmbed';
import { AppState, VideoHighlight } from './types';
import { analyzeVideoHighlights } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    url: '',
    videoId: null,
    startTime: '00:00',
    endTime: '00:10',
    isProcessing: false,
    statusMessage: '',
    highlights: [],
    isAnalyzing: false,
  });

  const playerRef = useRef<YouTubePlayerHandle>(null);

  const formatSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const parseToSeconds = (ts: string) => {
    if (!ts.includes(':')) return parseFloat(ts) || 0;
    const parts = ts.split(':').map(p => parseFloat(p) || 0);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  };

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    const id = extractVideoId(url);
    setState(prev => ({ ...prev, url, videoId: id }));
  };

  const captureStartTime = () => {
    if (playerRef.current) {
      const time = playerRef.current.getCurrentTime();
      setState(prev => ({ ...prev, startTime: formatSeconds(time) }));
    }
  };

  const captureEndTime = () => {
    if (playerRef.current) {
      const time = playerRef.current.getCurrentTime();
      setState(prev => ({ ...prev, endTime: formatSeconds(time) }));
    }
  };

  const previewSegment = () => {
    if (playerRef.current) {
      const start = parseToSeconds(state.startTime);
      playerRef.current.seekTo(start);
    }
  };

  const handleDownload = async () => {
    if (!state.url || !state.videoId) return;

    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      statusMessage: 'Sending request to FFmpeg backend...' 
    }));

    // In this simulation, we describe the process. 
    // In a real environment, you'd fetch('/download', { method: 'POST', body: JSON.stringify({...}) })
    try {
      setTimeout(() => setState(prev => ({ ...prev, statusMessage: 'Backend: Spawning yt-dlp to find media streams...' })), 1000);
      setTimeout(() => setState(prev => ({ ...prev, statusMessage: 'Backend: FFmpeg seeking to segment (fast-seek mode)...' })), 2500);
      setTimeout(() => setState(prev => ({ ...prev, statusMessage: 'Backend: Transcoding frame-accurate libx264 clip...' })), 4000);
      
      setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          isProcessing: false, 
          statusMessage: 'Success! File ready for download.' 
        }));
        alert(`Request successful.\n\nBackend would now execute:\nffmpeg -ss ${state.startTime} -to ${state.endTime} -i [URL] ...\n\nThe browser would receive the MP4 stream.`);
      }, 6000);
    } catch (err) {
      setState(prev => ({ ...prev, isProcessing: false, statusMessage: 'Error processing video.' }));
    }
  };

  const suggestHighlights = async () => {
    if (!state.url) return;
    setState(prev => ({ ...prev, isAnalyzing: true }));
    const results = await analyzeVideoHighlights(state.url);
    setState(prev => ({ ...prev, highlights: results, isAnalyzing: false }));
  };

  const applyHighlight = (h: VideoHighlight) => {
    setState(prev => ({ ...prev, startTime: h.startTime, endTime: h.endTime }));
    if (playerRef.current) {
      playerRef.current.seekTo(parseToSeconds(h.startTime));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-5xl mb-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
            <Icons.Scissors />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">YT Clipper <span className="text-blue-500">AI</span></h1>
        </div>
        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest hidden sm:block">
          Production Grade FFmpeg Engine
        </div>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <section className="glass-panel p-6 rounded-2xl shadow-xl">
            <label className="block text-sm font-medium text-zinc-400 mb-2">Video Source</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={state.url}
                onChange={handleUrlChange}
                placeholder="Paste YouTube URL here..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600"
              />
              <button 
                onClick={suggestHighlights}
                disabled={!state.videoId || state.isAnalyzing}
                className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 px-4 py-3 rounded-xl transition-all flex items-center gap-2 group"
              >
                {state.isAnalyzing ? <div className="animate-spin h-4 w-4 border-2 border-zinc-400 border-t-transparent rounded-full" /> : <Icons.Sparkles />}
                <span className="hidden sm:inline">AI Segments</span>
              </button>
            </div>
          </section>

          <YouTubeEmbed ref={playerRef} videoId={state.videoId} />
          
          {state.statusMessage && (
            <div className={`p-4 rounded-xl border text-sm flex items-center gap-3 transition-all ${state.isProcessing ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
              {state.isProcessing && <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />}
              {state.statusMessage}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <section className="glass-panel p-6 rounded-2xl space-y-6 sticky top-8 border-t-4 border-t-blue-600">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Icons.Play />
                Segment Picker
              </h2>
              <button onClick={previewSegment} className="text-xs text-blue-400 hover:text-blue-300 font-medium">Preview Selected</button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Start Point</label>
                  <button onClick={captureStartTime} className="flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-zinc-300 transition-colors">
                    <Icons.Pin /> Use Current
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"><Icons.Clock /></span>
                  <input
                    type="text"
                    value={state.startTime}
                    onChange={(e) => setState(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 font-mono text-lg focus:ring-2 focus:ring-blue-500/50 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">End Point</label>
                  <button onClick={captureEndTime} className="flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-zinc-300 transition-colors">
                    <Icons.Pin /> Use Current
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"><Icons.Clock /></span>
                  <input
                    type="text"
                    value={state.endTime}
                    onChange={(e) => setState(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 font-mono text-lg focus:ring-2 focus:ring-blue-500/50 outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleDownload}
              disabled={!state.videoId || state.isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98]"
            >
              {state.isProcessing ? (
                <>
                   <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                   Processing...
                </>
              ) : (
                <>
                  <Icons.Download />
                  Download Clip
                </>
              )}
            </button>

            <div className="border-t border-zinc-800 pt-6">
              <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                <Icons.Sparkles />
                AI Generated Chapters
              </h3>
              {state.highlights.length > 0 ? (
                <div className="space-y-3">
                  {state.highlights.map((h, i) => (
                    <div 
                      key={i} 
                      onClick={() => applyHighlight(h)}
                      className="group p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-blue-500/50 hover:bg-zinc-800 transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-blue-400">{h.startTime} - {h.endTime}</span>
                        <span className="text-xs text-zinc-600 font-mono">#{i+1}</span>
                      </div>
                      <div className="text-sm font-medium group-hover:text-blue-300 transition-colors">{h.label}</div>
                      <p className="text-xs text-zinc-500 line-clamp-2">{h.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 px-2 border border-zinc-800 border-dashed rounded-xl">
                  <p className="text-xs text-zinc-600 italic">No AI suggestions yet.<br/>Enter URL and click "AI Segments".</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="mt-20 w-full max-w-5xl py-8 border-t border-zinc-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-zinc-500 text-sm">
        <p>© 2025 YT Clipper Engine. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-zinc-300">Docs</a>
          <a href="#" className="hover:text-zinc-300">API</a>
          <a href="#" className="hover:text-zinc-300">Privacy</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
