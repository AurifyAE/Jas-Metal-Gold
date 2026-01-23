"use client";

import React, { useEffect, useRef, useState } from "react";

const VIDEO_ID = "jJYKmLZOOBo";

const YoutubeVideo = () => {
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  const [isMuted, setIsMuted] = useState(true);
  const [showHint, setShowHint] = useState(true);

  // Load YouTube IFrame API once
  useEffect(() => {
    if (window.YT?.Player) return;

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Init player
  useEffect(() => {
    const initPlayer = () => {
      if (!containerRef.current || playerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (e) => {
            e.target.mute();
            e.target.playVideo();
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  // ENTER / OK key toggle (TV remote)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== "Enter" && e.keyCode !== 13) return;
      if (!playerRef.current) return;

      if (isMuted) {
        playerRef.current.unMute();
        playerRef.current.setVolume(100);
        setIsMuted(false);
        setShowHint(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
        setShowHint(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMuted]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Player */}
      <div
        ref={containerRef}
        className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full"
      />

      {/* Hint */}
      {showHint && (
        <div className="
          absolute bottom-12 left-1/2 -translate-x-1/2
          bg-black/70 text-white
          px-4 py-2 rounded-md
          text-sm tracking-wide uppercase
          pointer-events-none
          md:text-xs
        ">
          Press OK to enable sound
        </div>
      )}
    </div>
  );
};

export default YoutubeVideo;
