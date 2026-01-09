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
        const loadInitialData = async () => {
            try {
                const [spotRes, serverRes] = await Promise.all([
                    fetchSpotRates(adminId),
                    fetchServerURL(),
                ]);

                const info = spotRes.data.info;

                setCommodities(info.commodities || []);
                setGoldBidSpread(info.goldBidSpread || 0);
                setGoldAskSpread(info.goldAskSpread || 0);
                setSilverBidSpread(info.silverBidSpread || 0);
                setSilverAskSpread(info.silverAskSpread || 0);
                setServerURL(serverRes.data.info.serverURL);
            } catch (err) {
                console.error('Failed to load initial data', err);
            }
        };

        loadInitialData();
    }, [adminId]);

    // ============================================================================
    // SOCKET CONNECTION
    // ============================================================================
    useEffect(() => {
        if (!serverURL) return;

        const socket = io(serverURL, {
            query: { secret: process.env.NEXT_PUBLIC_SOCKET_SECRET_KEY },
            // 👇 CRITICAL FIX FOR TV
            transports: ['polling', 'websocket'],

            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: Infinity,


            // withCredentials: true,
            // transports: ['websocket'],
        });

        socket.on('connect', () => {
            socket.emit('request-data', ['GOLD', 'SILVER']);
        });

        socket.on('market-data', (data) => {
            setMarketData((prev) => ({ ...prev, [data.symbol]: data }));
        });

        return () => socket.disconnect();
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
