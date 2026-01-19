
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface YouTubeEmbedProps {
  videoId: string | null;
}

export interface YouTubePlayerHandle {
  getCurrentTime: () => number;
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
}

const YouTubeEmbed = forwardRef<YouTubePlayerHandle, YouTubeEmbedProps>(({ videoId }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // Load IFrame API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (window.YT && window.YT.Player && containerRef.current && videoId) {
        // Clear previous player if exists
        if (playerRef.current) {
          playerRef.current.destroy();
        }

        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: videoId,
          playerVars: {
            enablejsapi: 1,
            origin: window.location.origin,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onError: (e: any) => console.error("YT Player Error:", e.data),
          }
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  useImperativeHandle(ref, () => ({
    getCurrentTime: () => {
      return playerRef.current?.getCurrentTime() || 0;
    },
    seekTo: (seconds: number) => {
      playerRef.current?.seekTo(seconds, true);
      playerRef.current?.playVideo();
    },
    play: () => playerRef.current?.playVideo(),
    pause: () => playerRef.current?.pauseVideo(),
  }));

  if (!videoId) {
    return (
      <div className="w-full aspect-video bg-zinc-900 rounded-xl flex items-center justify-center border-2 border-dashed border-zinc-800">
        <div className="text-zinc-500 text-center">
          <div className="mb-2 flex justify-center">
            <svg className="w-12 h-12 opacity-20" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
          </div>
          <p className="text-sm font-medium">Enter a URL to preview video</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-zinc-800 bg-black">
      <div id="player-container" ref={containerRef} className="w-full h-full" />
    </div>
  );
});

export default YouTubeEmbed;

// Global type declaration for YT
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}
