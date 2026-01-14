'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import io from 'socket.io-client';

import styles from './GoldRates.module.scss';
import { fetchSpotRates, fetchServerURL } from '@/pages/api/api';
import { useSpotRate } from '@/context/SpotRateContext';

const GoldRates = () => {
    // ============================================================================
    // STATE
    // ============================================================================
    const [serverURL, setServerURL] = useState('');
    const [marketData, setMarketData] = useState({});
    const [commodities, setCommodities] = useState([]);

    const [goldBidSpread, setGoldBidSpread] = useState(0);
    const [goldAskSpread, setGoldAskSpread] = useState(0);
    const [silverBidSpread, setSilverBidSpread] = useState(0);
    const [silverAskSpread, setSilverAskSpread] = useState(0);

    const [prevGoldBid, setPrevGoldBid] = useState(null);
    const [goldBidDirection, setGoldBidDirection] = useState('');
    const [prevSilverBid, setPrevSilverBid] = useState(null);
    const [silverBidDirection, setSilverBidDirection] = useState('');


    const adminId = process.env.NEXT_PUBLIC_ADMIN_ID;
    const { updateMarketData } = useSpotRate();

    // ============================================================================
    // COMPUTED PRICES
    // ============================================================================

    const GoldbiddingPrice = (marketData?.Gold?.bid || 0) + goldBidSpread;
    const GoldaskingPrice = GoldbiddingPrice + 0.5 + goldAskSpread;
    const SilverbiddingPrice = (marketData?.Silver?.bid || 0) + silverBidSpread;
    const SilverAskingPrice = Number((SilverbiddingPrice + 0.05 + silverAskSpread).toFixed(3));

    // ============================================================================
    // INITIAL DATA (SPREADS + SERVER)
    // ============================================================================
    useEffect(() => {
        const loadInitialData = async (retryCount = 0) => {
            const maxRetries = 3;
            const retryDelay = 2000; // 2 seconds

            try {
                const [spotRes, serverRes] = await Promise.all([
                    fetchSpotRates(adminId),
                    fetchServerURL(),
                ]);

                // Add null checks to prevent errors
                if (!spotRes || !spotRes.data || !spotRes.data.info) {
                    console.error('Invalid spot rates response');
                    if (retryCount < maxRetries) {
                        console.log(`Retrying... (${retryCount + 1}/${maxRetries})`);
                        setTimeout(() => loadInitialData(retryCount + 1), retryDelay);
                    }
                    return;
                }

                const info = spotRes.data.info;

                setCommodities(info.commodities || []);
                setGoldBidSpread(info.goldBidSpread || 0);
                setGoldAskSpread(info.goldAskSpread || 0);
                setSilverBidSpread(info.silverBidSpread || 0);
                setSilverAskSpread(info.silverAskSpread || 0);

                // Add null check for server URL
                if (serverRes && serverRes.data && serverRes.data.info && serverRes.data.info.serverURL) {
                    setServerURL(serverRes.data.info.serverURL);
                } else {
                    console.error('Invalid server URL response');
                    if (retryCount < maxRetries) {
                        console.log(`Retrying server URL... (${retryCount + 1}/${maxRetries})`);
                        setTimeout(() => loadInitialData(retryCount + 1), retryDelay);
                    }
                }
            } catch (err) {
                console.error('Failed to load initial data', err);
                // Log more details for debugging
                if (err.response) {
                    console.error('API Error:', err.response.status, err.response.data);
                } else if (err.request) {
                    console.error('Network Error:', err.request);
                } else {
                    console.error('Error:', err.message);
                }
                
                // Retry logic for TV browsers
                if (retryCount < maxRetries) {
                    console.log(`Retrying after error... (${retryCount + 1}/${maxRetries})`);
                    setTimeout(() => loadInitialData(retryCount + 1), retryDelay * (retryCount + 1));
                } else {
                    console.error('Max retries reached. Please check your network connection.');
                }
            }
        };

        loadInitialData();
    }, [adminId]);

    // ============================================================================
    // SOCKET CONNECTION
    // ============================================================================
    useEffect(() => {
        if (!serverURL) return;

        // Force polling transport for TV browsers (more reliable)
        const isTVBrowser = () => {
            if (typeof window === 'undefined') return false;
            const ua = window.navigator.userAgent.toLowerCase();
            return ua.includes('smart-tv') || 
                   ua.includes('smarttv') || 
                   ua.includes('tizen') || 
                   ua.includes('webos') ||
                   ua.includes('tv');
        };

        const socket = io(serverURL, {
            query: { secret: process.env.NEXT_PUBLIC_SOCKET_SECRET_KEY },
            // Use polling first for TV browsers, websocket for others
            transports: isTVBrowser() ? ['polling', 'websocket'] : ['websocket', 'polling'],
            withCredentials: true,
            timeout: 30000, // 30 second timeout for TV browsers
            reconnection: true,
            reconnectionDelay: 2000, // Start with 2 seconds
            reconnectionDelayMax: 10000, // Max 10 seconds
            reconnectionAttempts: 10, // More attempts for TV browsers
            forceNew: false,
            upgrade: !isTVBrowser(), // Don't upgrade to websocket on TV browsers
        });

        socket.on('connect', () => {
            console.log('Socket connected successfully');
            socket.emit('request-data', ['GOLD', 'SILVER']);
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            // Try to reconnect with different transport
            if (error.type === 'TransportError') {
                console.log('Trying alternative transport...');
            }
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            if (reason === 'io server disconnect') {
                // Server disconnected, reconnect manually
                socket.connect();
            }
        });

        socket.on('reconnect', (attemptNumber) => {
            console.log('Socket reconnected after', attemptNumber, 'attempts');
            socket.emit('request-data', ['GOLD', 'SILVER']);
        });

        socket.on('reconnect_error', (error) => {
            console.error('Socket reconnection error:', error);
        });

        socket.on('reconnect_failed', () => {
            console.error('Socket reconnection failed. Please refresh the page.');
        });

        socket.on('market-data', (data) => {
            setMarketData((prev) => ({ ...prev, [data.symbol]: data }));
        });

        return () => {
            socket.disconnect();
        };
    }, [serverURL]);

    // ============================================================================
    // CONTEXT UPDATE
    // ============================================================================
    useEffect(() => {
        if (!Object.keys(marketData).length) return;

        updateMarketData(
            marketData,
            goldBidSpread,
            goldAskSpread,
            silverBidSpread,
            silverAskSpread
        );
    }, [
        marketData,
        goldBidSpread,
        goldAskSpread,
        silverBidSpread,
        silverAskSpread,
        updateMarketData,
    ]);

    // ============================================================================
    // PRICE DIRECTION (GOLD BID)
    // ============================================================================
    useEffect(() => {
        if (GoldbiddingPrice == null) return;

        let timeout;

        if (prevGoldBid !== null) {
            if (GoldbiddingPrice > prevGoldBid) {
                setGoldBidDirection("up");
            } else if (GoldbiddingPrice < prevGoldBid) {
                setGoldBidDirection("down");
            } else {
                setGoldBidDirection("normal");
            }

            // ⏱ Reset to normal after 00.5 second
            timeout = setTimeout(() => {
                setGoldBidDirection("normal");
            }, 500);
        }

        setPrevGoldBid(GoldbiddingPrice);

        return () => clearTimeout(timeout);
    }, [GoldbiddingPrice]);

    useEffect(() => {
        if (SilverbiddingPrice == null) return;

        let timeout;

        if (prevSilverBid !== null) {
            if (SilverbiddingPrice > prevSilverBid) {
                setSilverBidDirection("up");
            } else if (SilverbiddingPrice < prevSilverBid) {
                setSilverBidDirection("down");
            } else {
                setSilverBidDirection("normal");
            }

            // ⏱ Reset to normal after 0.5 second
            timeout = setTimeout(() => {
                setSilverBidDirection("normal");
            }, 500);
        }

        setPrevSilverBid(SilverbiddingPrice);

        return () => clearTimeout(timeout);
    }, [SilverbiddingPrice]);




    // ============================================================================
    // RENDER
    // ============================================================================
    return (
        <div className={styles.price_section}>
            <ul className={styles.price_left}>
                {/* GOLD */}
                <li>
                    <div className={styles.label_icon}>
                        <Image src="/icons/gold-icon.svg" height={300} width={300} alt="Gold" />
                    </div>
                    <div className={styles.price_text}>
                        <span className={styles.label}>High </span>
                        <span className={styles.value}>{marketData?.Gold?.high || 0}</span>
                        <span className={styles.separator}>/</span>
                        <span className={styles.label}>Low </span>
                        <span className={styles.value}>{marketData?.Gold?.low || 0}</span>
                    </div>
                    <div className={styles.bar_icon}>
                        <Image src="/icons/gold-biscut.png" height={300} width={300} alt="Gold Bar" />
                    </div>
                    <div className={styles.bidAsk_wrap}>
                        <div className={`${styles.bid} ${goldBidDirection === "up"
                            ? styles.priceUp
                            : goldBidDirection === "down"
                                ? styles.priceDown
                                : ""
                            }`}>
                            <span className={styles.label}>BID</span>
                            <span className={styles.bidValue}>{GoldbiddingPrice}</span>
                        </div>
                    </div>
                    <div className={styles.bidAsk_wrap}>
                        <div className={`${styles.ask} ${goldBidDirection === "up"
                            ? styles.priceUp
                            : goldBidDirection === "down"
                                ? styles.priceDown
                                : ""
                            }`}>
                            <span className={styles.label}>ASK</span>
                            <span className={styles.askValue}>{GoldaskingPrice}</span>
                        </div>
                    </div>
                </li>

                {/* SILVER */}
                <li>
                    <div className={styles.label_icon}>
                        <Image src="/icons/silver-icon.svg" height={300} width={300} alt="Silver" />
                    </div>
                    <div className={styles.price_text}>
                        <span className={styles.label}>High </span>
                        <span className={styles.value}>{marketData?.Silver?.high || 0}</span>
                        <span className={styles.separator}>/</span>
                        <span className={styles.label}>Low </span>
                        <span className={styles.value}>{marketData?.Silver?.low || 0}</span>
                    </div>
                    <div className={styles.bar_icon}>
                        <Image src="/icons/silver-biscut.png" height={300} width={300} alt="Silver Bar" />
                    </div>
                    <div className={styles.bidAsk_wrap}>
                        <div className={`${styles.bid} ${silverBidDirection === "up"
                            ? styles.priceUp
                            : silverBidDirection === "down"
                                ? styles.priceDown
                                : ""
                            }`}>
                            <span className={styles.label}>BID</span>
                            <span className={styles.bidValue}>{SilverbiddingPrice}</span>
                        </div>
                    </div>

                    <div className={styles.bidAsk_wrap}>
                        <div className={`${styles.ask} ${silverBidDirection === "up"
                            ? styles.priceUp
                            : silverBidDirection === "down"
                                ? styles.priceDown
                                : ""
                            }`}>
                            <span className={styles.label}>ASK</span>
                            <span className={styles.askValue}>{SilverAskingPrice}</span>
                        </div>
                    </div>

                </li>
            </ul>
        </div>
    );
};

export default GoldRates;
