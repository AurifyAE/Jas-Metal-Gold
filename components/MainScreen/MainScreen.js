"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./MainScreen.module.scss";
import Image from "next/image";
import io from "socket.io-client";

import TradingViewMarketTable from "../TradingViewChart/TradingViewChart";
import GoldRates from "../GoldRates/GoldRates";
import CommodityTable from "../CommodityTable/CommodityTable";

import { fetchSpotRates, fetchServerURL } from "@/pages/api/api";
import { useSpotRate } from "@/context/SpotRateContext";
import YoutubeVideo from "../YoutubeVideo/YoutubeVideo";

const MainScreen = () => {
  // ============================================================================
  // STATE
  // ============================================================================
  const [serverURL, setServerURL] = useState("");
  const [marketData, setMarketData] = useState({});
  const [commodities, setCommodities] = useState([]);
  const [news, setNews] = useState([]);

  const [goldBidSpread, setGoldBidSpread] = useState(0);
  const [goldAskSpread, setGoldAskSpread] = useState(0);
  const [silverBidSpread, setSilverBidSpread] = useState(0);
  const [silverAskSpread, setSilverAskSpread] = useState(0);

  const adminId = process.env.NEXT_PUBLIC_ADMIN_ID;
  const { updateMarketData } = useSpotRate();

  // ============================================================================
  // DATE
  // ============================================================================
  const { date, day } = useMemo(() => {
    const today = new Date();
    return {
      date: today
        .toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })
        .toUpperCase(),
      day: today.toLocaleDateString("en-US", { weekday: "long" }),
    };
  }, []);

  // ============================================================================
  // FORMATTERS
  // ============================================================================
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  // ============================================================================
  // PRICE COMPUTATION
  // ============================================================================
  const GoldbiddingPrice = (marketData?.Gold?.bid || 0) + goldBidSpread;
  const GoldaskingPrice = GoldbiddingPrice + 0.5 + goldAskSpread;
  const SilverbiddingPrice = (marketData?.Silver?.bid || 0) + silverBidSpread;
  const SilverAskingPrice = Number(
    (SilverbiddingPrice + 0.05 + silverAskSpread).toFixed(3)
  );

  // ============================================================================
  // HELPERS
  // ============================================================================
  const getMetalName = useCallback((metal) => {
    switch (metal.toLowerCase()) {
      case "gold":
        return "GM";
      case "gold kilobar":
        return "KGBAR";
      case "gold ten tola":
        return "TTBAR";
      default:
        return metal.charAt(0).toUpperCase() + metal.slice(1);
    }
  }, []);

  const calculatePrices = useCallback(
    (item, metalName) => {
      const unitMultiplier = { GM: 1, KGBAR: 1000, TTBAR: 116.64 }[metalName];
      const purity = Number(item.purity);
      const purityPower = purity / Math.pow(10, purity.toString().length);

      return {
        bidPrice:
          (GoldbiddingPrice / 31.103) * 3.674 * unitMultiplier * purityPower,
        askPrice:
          (GoldaskingPrice / 31.103) * 3.674 * unitMultiplier * purityPower,
      };
    },
    [GoldbiddingPrice, GoldaskingPrice]
  );

  // ============================================================================
  // INITIAL LOAD
  // ============================================================================
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [spotRes, serverRes] = await Promise.all([
          fetchSpotRates(adminId),
          fetchServerURL(),
        ]);

        // Add null checks to prevent errors
        if (!spotRes || !spotRes.data || !spotRes.data.info) {
          console.error("Invalid spot rates response");
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
          console.error("Invalid server URL response");
        }
      } catch (err) {
        console.error("Initial load failed", err);
        // Log more details for debugging
        if (err.response) {
          console.error("API Error:", err.response.status, err.response.data);
        } else if (err.request) {
          console.error("Network Error:", err.request);
        } else {
          console.error("Error:", err.message);
        }
      }
    };

    loadInitialData();
  }, [adminId]);

  // ============================================================================
  // SOCKET
  // ============================================================================
  useEffect(() => {
    if (!serverURL) return;

    const socket = io(serverURL, {
      transports: ["websocket", "polling"], // Add polling as fallback for TVs
      withCredentials: true,
      query: { secret: process.env.NEXT_PUBLIC_SOCKET_SECRET_KEY },
      timeout: 20000, // 20 second timeout
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("Socket connected successfully");
      socket.emit("request-data", ["GOLD", "SILVER"]);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socket.on("market-data", (data) => {
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


  /**
 * Fetch market news from API
 */
  useEffect(() => {
    const fetchMarketNews = async () => {
      try {
        // Add timeout for TV browsers
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const res = await fetch("/api/market-news", {
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setNews(data.headlines || []);
      } catch (error) {
        console.error("Failed to fetch market news:", error);
        if (error.name === 'AbortError') {
          console.error("Market news request timed out");
        }
        setNews(["GOLD MARKET UPDATES LOADING..."]);
      }
    };

    fetchMarketNews();
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <>
      <div className={styles.mainscreen_Section}>
        <div className="container">
          <div className={styles.mainscreen_container}>
            <div className={styles.left_screen}>
              <GoldRates />

              <CommodityTable
                commodities={commodities}
                getMetalName={getMetalName}
                calculatePrices={calculatePrices}
                currencyFormatter={currencyFormatter}
              />
            </div>

            <div className={styles.right_screen}>
              <div className={styles.logo_date_sec}>
                <div className={styles.main_logo}>
                  <Image src="/images/logo.svg" height={300} width={300} alt="Logo" />
                </div>
                <div className={styles.date_sec}>
                  <div className={styles.dateBox}>
                    <div className={styles.date}>{date}</div>
                    <div className={styles.day}>{day}</div>
                  </div>
                </div>
              </div>

              <div className={styles.chart_section}>
                <TradingViewMarketTable />
              </div>

              <YoutubeVideo />
            </div>
          </div>
        </div>
        {/* MARQUEE NEWS SECTION */}
        <div className={styles.marquee_Sec}>
          <div className={styles.marquee_label}>JAS METAL GOLD TRADING</div>
          <div className={styles.marquee_wrap}>
            <div
              key={news.length}
              className={styles.marquee_track}
              style={{ "--duration": `${Math.max(news.length * 6, 20)}s` }}
            >
              {news.map((item, i) => (
                <span key={`a-${i}`} className={styles.marquee_item}>{item}</span>
              ))}
              {news.map((item, i) => (
                <span key={`b-${i}`} className={styles.marquee_item}>{item}</span>
              ))}
            </div>
          </div>
        </div>

        {/* BACKGROUND DECORATION */}
        <div className={styles.background_lines}>
          <Image src="/images/pattern.svg" height={1000} width={1000} alt="Background Lines" />
        </div>
      </div>
      <div className={styles.no_data_Section}>

        This content is only available on Desktop or TV devices.      </div>
    </>

  );
};

export default MainScreen;
