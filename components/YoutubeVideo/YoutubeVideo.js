'use client';

import React, { useEffect, useRef, useState } from "react";
import styles from "./YoutubeVideo.module.scss";

const YoutubeVideo = () => {
    const playerRef = useRef(null);
    const ytPlayerRef = useRef(null);

    const [showHint, setShowHint] = useState(true);
    const [isMuted, setIsMuted] = useState(true);

    // Load YouTube IFrame API
    useEffect(() => {
        if (window.YT && window.YT.Player) return;

        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
    }, []);

    // Initialize player
    useEffect(() => {
        window.onYouTubeIframeAPIReady = () => {
            ytPlayerRef.current = new window.YT.Player(playerRef.current, {
                videoId: "jJYKmLZOOBo",
                playerVars: {
                    autoplay: 1,
                    mute: 1,
                    controls: 1,
                    rel: 0,
                    modestbranding: 1,
                    playsinline: 1,
                },
                events: {
                    onReady: (event) => {
                        event.target.mute();
                        event.target.playVideo();
                    },
                },
            });
        };
    }, []);

    // OK / ENTER key handler (TV remote safe)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key !== "Enter" && e.keyCode !== 13) return;
            if (!ytPlayerRef.current) return;

            if (isMuted) {
                ytPlayerRef.current.unMute();
                ytPlayerRef.current.setVolume(100);
                setShowHint(false);
                setIsMuted(false);
            } else {
                ytPlayerRef.current.mute();
                setShowHint(true);
                setIsMuted(true);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isMuted]);

    return (
        <div className={styles.videoWrapper}>
            <div ref={playerRef} className={styles.player} />

            {showHint && (
                <div className={styles.hint}>
                    PRESS OK TO ENABLE SOUND
                </div>
            )}
        </div>
    );
};

export default YoutubeVideo;
