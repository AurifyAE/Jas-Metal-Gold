"use client";

import React, { useState, useEffect } from "react";
import styles from "./MainScreen.module.scss";
import Image from "next/image";
import TradingViewMarketTable from "../TradingViewChart/TradingViewChart";
import io from "socket.io-client";
import { fetchSpotRates, fetchServerURL, fetchNews } from "@/pages/api/api";
import { useSpotRate } from "@/context/SpotRateContext";
import YoutubeVideo from "../YoutubeVideo/YoutubeVideo";

const MainScreen = () => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [currentTime, setCurrentTime] = useState(new Date());
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
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Formats current date into display format
   * @returns {Object} Object containing formatted date and day
   */
  const getFormattedDate = () => {
    const today = new Date();
    const date = today
      .toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
      .toUpperCase();
    const day = today.toLocaleDateString("en-US", { weekday: "long" });
    return { date, day };
  };

  /**
   * Converts metal names to display format
   * @param {string} metal - Metal name
   * @returns {string} Formatted metal name
   */
  const getMetalName = (metal) => {
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
  };

  /**
   * Currency formatter for price display
   */
  const currencyFormatter = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  const { date, day } = getFormattedDate();

  const GoldbiddingPrice = (marketData?.Gold?.bid || 0) + goldBidSpread;
  const GoldaskingPrice = GoldbiddingPrice + 0.5 + goldAskSpread;
  const SilverbiddingPrice = (marketData?.Silver?.bid || 0) + silverBidSpread;
  const SilverAskingPrice = Number((SilverbiddingPrice + 0.05 + silverAskSpread).toFixed(3));

  // ============================================================================
  // DATA FETCHING EFFECTS
  // ============================================================================

  /**
   * Fetch initial spot rates and spreads on component mount
   */
  useEffect(() => {
    const fetchInitialSpotRates = async () => {
      try {
        const res = await fetchSpotRates(adminId);
        const info = res.data.info;
        setCommodities(info.commodities || []);
        setGoldBidSpread(info.goldBidSpread || 0);
        setGoldAskSpread(info.goldAskSpread || 0);
        setSilverBidSpread(info.silverBidSpread || 0);
        setSilverAskSpread(info.silverAskSpread || 0);
      } catch (error) {
        console.error("Failed to fetch spot rates:", error);
      }
    };

    fetchInitialSpotRates();
  }, [adminId]);

  /**
   * Fetch all initial data (spot rates, server URL, news)
   */
  useEffect(() => {
    const fetchAllInitialData = async () => {
      try {
        const [spotRatesRes, serverURLRes] = await Promise.all([
          fetchSpotRates(adminId),
          fetchServerURL(),
        ]);
        setCommodities(spotRatesRes.data.info.commodities || []);
        setServerURL(serverURLRes.data.info.serverURL);
      } catch (error) {
        console.error("Failed to load initial data:", error);
      }
    };

    fetchAllInitialData();
  }, [adminId]);

  /**
   * Fetch market news from API
   */
  useEffect(() => {
    const fetchMarketNews = async () => {
      try {
        const res = await fetch("/api/market-news");
        const data = await res.json();
        setNews(data.headlines || []);
      } catch (error) {
        console.error("Failed to fetch market news:", error);
        setNews(["Failed to load news"]);
      }
    };

    fetchMarketNews();
  }, []);

  // ============================================================================
  // WEBSOCKET CONNECTION
  // ============================================================================

  /**
   * Establish WebSocket connection for real-time market data
   */
  useEffect(() => {
    if (!serverURL) return;

    const socket = io(serverURL, {
      query: { secret: process.env.NEXT_PUBLIC_SOCKET_SECRET_KEY },
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("request-data", ["GOLD", "SILVER"]);
    });

    socket.on("market-data", (data) => {
      setMarketData((prev) => ({ ...prev, [data.symbol]: data }));
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => socket.disconnect();
  }, [serverURL]);

  // ============================================================================
  // TIMER AND CONTEXT UPDATES
  // ============================================================================

  /**
   * Update current time every second
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  /**
   * Update market data context when data or spreads change
   */
  useEffect(() => {
    if (!marketData || Object.keys(marketData).length === 0) return;

    updateMarketData(
      marketData,
      goldBidSpread,
      goldAskSpread,
      silverBidSpread,
      silverAskSpread
    );
  }, [marketData, goldBidSpread, goldAskSpread, silverBidSpread, silverAskSpread, updateMarketData]);

  // ============================================================================
  // PRICE CALCULATION HELPER
  // ============================================================================

  /**
   * Calculate bid and ask prices for commodities
   * @param {Object} item - Commodity item
   * @param {string} metalName - Formatted metal name
   * @returns {Object} Object containing bidPrice and askPrice
   */
  const calculatePrices = (item, metalName) => {
    const unitMultiplier = { GM: 1, KGBAR: 1000, TTBAR: 116.64 }[metalName];
    const purity = Number(item.purity);
    const purityPower = purity / Math.pow(10, purity.toString().length);

    const bidPrice = (GoldbiddingPrice / 31.103) * unitMultiplier * purityPower;
    const askPrice = (GoldaskingPrice / 31.103) * unitMultiplier * purityPower;

    return { bidPrice, askPrice };
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className={styles.mainscreen_Section}>
      <div className="container">
        <div className={styles.mainscreen_container}>
          {/* LEFT SCREEN - Commodities Table & Price Display */}
          <div className={styles.left_screen}>
            <ul className={styles.table_sec}>
              <li>
                <div className={styles.title_sec}>
                  <h3>Commodity</h3>
                  <h3>BID (Dollar)</h3>
                  <h3>ASK (Dollar)</h3>
                </div>
              </li>
              {commodities.map((item, index) => {
                const metalName = getMetalName(item.metal.toLowerCase());
                const { bidPrice, askPrice } = calculatePrices(item, metalName);

                return (
                  <li key={index} className={styles.detail_content_sec}>
                    <div className={styles.detail_sec}>
                      <span>{item.purity} {metalName}</span>
                      <span>{bidPrice ? currencyFormatter.format(bidPrice) : 0}</span>
                      <span>{askPrice ? currencyFormatter.format(askPrice) : 0}</span>
                    </div>
                  </li>
                );
              })}
            </ul>

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
                    <div className={styles.bid}>
                      <span className={styles.label}>BID</span>
                      <span className={styles.bidValue}>{GoldbiddingPrice}</span>
                    </div>
                  </div>
                  <div className={styles.bidAsk_wrap}>
                    <div className={styles.ask}>
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
                    <div className={styles.bid}>
                      <span className={styles.label}>BID</span>
                      <span className={styles.bidValue}>{SilverbiddingPrice}</span>
                    </div>
                  </div>
                  <div className={styles.bidAsk_wrap}>
                    <div className={styles.ask}>
                      <span className={styles.label}>ASK</span>
                      <span className={styles.askValue}>{SilverAskingPrice}</span>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* RIGHT SCREEN - Video, Chart & Logo */}
          <div className={styles.right_screen}>
            <div className={styles.video_screen}>
              <YoutubeVideo />
            </div>
            <div className={styles.chart_section}>
              <TradingViewMarketTable />
            </div>
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
        <Image src="/images/lines.svg" height={1000} width={1000} alt="Background Lines" />
      </div>
    </div>
  );
};

export default MainScreen;