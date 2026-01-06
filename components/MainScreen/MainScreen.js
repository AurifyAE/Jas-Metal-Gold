'use client'

import React, { useState, useEffect } from "react";
import styles from "./MainScreen.module.scss";
import Image from "next/image";
import TradingViewMarketTable from "../TradingViewChart/TradingViewChart";
import io from "socket.io-client";
import { fetchSpotRates, fetchServerURL, fetchNews } from "@/pages/api/api";
import { useSpotRate } from "@/context/SpotRateContext";

const MainScreen = () => {

  const getFormattedDate = () => {
    const today = new Date();

    const date = today
      .toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
      .toUpperCase();

    const day = today.toLocaleDateString("en-US", {
      weekday: "long",
    });

    return { date, day };
  };
  const { date, day } = getFormattedDate();

  const [currentTime, setCurrentTime] = useState(new Date());

  const [serverURL, setServerURL] = useState("");
  const [marketData, setMarketData] = useState({});
  const [commodities, setCommodities] = useState([]);
  const [news, setNews] = useState([]);

  const [goldBidSpread, setGoldBidSpread] = useState(0);
  const [goldAskSpread, setGoldAskSpread] = useState(0);
  const [silverBidSpread, setSilverBidSpread] = useState(0);
  const [silverAskSpread, setSilverAskSpread] = useState(0);


  const marqueeText = news ? news : 'CRUDE OIL : $65.70 (9.9%)';

  const adminId = process.env.NEXT_PUBLIC_ADMIN_ID;
  useEffect(() => {
    const fetchInitialData = async () => {
      const res = await fetchSpotRates(adminId);
      const info = res.data.info;

      setCommodities(info.commodities || []);

      setGoldBidSpread(info.goldBidSpread || 0);
      setGoldAskSpread(info.goldAskSpread || 0);
      setSilverBidSpread(info.silverBidSpread || 0);
      setSilverAskSpread(info.silverAskSpread || 0);
    };

    fetchInitialData();
  }, [adminId]);

  const { updateMarketData } = useSpotRate();

  useEffect(() => {
    if (!marketData || Object.keys(marketData).length === 0) return;

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
  ]);



  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [spotRatesRes, serverURLRes, newsRes] = await Promise.all([
          fetchSpotRates(adminId),
          fetchServerURL(),
          fetchNews(adminId),
        ]);

        setCommodities(spotRatesRes.data.info.commodities);
        setServerURL(serverURLRes.data.info.serverURL);
        // setNews(newsRes?.data?.news?.news);


      } catch (error) {
        console.error("Failed to load initial data", error);
      }
    };

    fetchInitialData();
  }, [adminId]);

  useEffect(() => {
    if (!serverURL) return;

    const socket = io(serverURL, {
      query: {
        secret: process.env.NEXT_PUBLIC_SOCKET_SECRET_KEY,
      },
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("request-data", ["GOLD", "SILVER"]);
    });

    socket.on("market-data", (data) => {
      setMarketData((prev) => ({
        ...prev,
        [data.symbol]: data,
      }));
    });

    socket.on("disconnect", () => {
      // console.log("Socket disconnected");

    });

    return () => socket.disconnect();
  }, [serverURL]);



  /* ---------------- API ---------------- */

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await fetchSpotRates(adminId);
        setCommodities(res.data.info.commodities || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchInitialData();
  }, [adminId]);


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



  const GoldbiddingPrice = marketData?.Gold?.bid + goldBidSpread
  const GoldaskingPrice = GoldbiddingPrice + 0.5 + goldAskSpread
  const SilverbiddingPrice = Number(marketData?.Silver?.bid + silverBidSpread);
  const SilverAskingPrice = Number((SilverbiddingPrice + 0.05 + silverAskSpread).toFixed(3));

  useEffect(() => {
    fetch("/api/market-news")
      .then(res => res.json())
      .then(data => {
        console.log('News received:', data.headlines);
        setNews(data.headlines);
      })
      .catch(err => {
        console.error('Failed to fetch market news:', err);
        setNews(["Failed to load news"]);
      });
  }, []);
  console.log('asdsadsad', news);

  const duration = Math.max(news.length * 6, 30); // seconds


  return (
    <div className={styles.mainscreen_Section}>


      <div className="container">
        <div className={`${styles.mainscreen_container}`}>
          <div className={`${styles.left_screen}`}>
            <ul className={`${styles.table_sec}`}>
              <li>
                <div className={`${styles.title_sec}`}>
                  <h3>Commodity</h3>
                  <h3>BID (Dollar)</h3>
                  <h3>ASK (Dollar)</h3>
                </div>
              </li>
              {commodities.map((item, index) => {
                const metalName = getMetalName(item.metal.toLowerCase());
                const bid = GoldbiddingPrice;
                const ask = GoldaskingPrice;
                const unitMultiplier = {
                  GM: 1,
                  KGBAR: 1000,
                  TTBAR: 116.64,
                }[metalName];

                const purity = Number(item.purity);


                const purityPower = purity / Math.pow(10, purity.toString().length);

                const bidPrice =
                  ((bid / 31.103) * 3.674) *
                  unitMultiplier * purityPower;

                const askPrice =
                  ((ask / 31.103) * 3.674) *
                  unitMultiplier * purityPower;

                return (

                  <li
                    key={index}
                    className={styles.detail_content_sec}
                  >
                    <div className={styles.detail_sec}>
                      <span>{item.purity} {metalName}</span>
                      <span>{bidPrice ? bidPrice.toFixed(2) : 0}</span>
                      <span>{askPrice ? askPrice.toFixed(2) : 0}</span>
                    </div>
                  </li>
                );
              })}

            </ul>

            <div className={`${styles.price_section}`}>
              <ul className={`${styles.price_left}`}>
                <li>
                  <div className={`${styles.label_icon}`}>
                    <Image
                      src={"/icons/gold-icon.svg"}
                      height={300}
                      width={300}
                      alt=""
                    />
                  </div>

                  <div className={`${styles.price_text}`}>
                    <span className={styles.label}>High </span>
                    <span className={styles.value}>
                      {marketData?.Gold?.high ? marketData.Gold.high : 0}


                    </span>
                    <span className={styles.separator}>/</span>
                    <span className={styles.label}>Low </span>
                    <span className={styles.value}>
                      {marketData?.Gold?.low ? marketData.Gold.low : 0}

                    </span>
                  </div>
                  <div className={`${styles.bar_icon}`}>
                    <Image
                      src={"/icons/gold-biscut.png"}
                      height={300}
                      width={300}
                      alt=""
                    />
                  </div>

                  <div className={styles.bidAsk_wrap}>
                    <div className={styles.bid}>
                      <span className={styles.label}>BID</span>
                      <span className={styles.bidValue}>
                        {/* {marketData?.Gold?.bid ? marketData.Gold.bid : 0} */}
                        {GoldbiddingPrice}


                      </span>
                    </div>
                  </div>

                  <div className={styles.bidAsk_wrap}>
                    <div className={styles.ask}>
                      <span className={styles.label}>ASK</span>
                      <span className={styles.askValue}>
                        {/* {marketData?.Gold?.offer ? marketData.Gold.offer : 0} */}
                        {GoldaskingPrice}

                      </span>
                    </div>
                  </div>
                </li>

                <li>
                  <div className={`${styles.label_icon}`}>
                    <Image
                      src={"/icons/silver-icon.svg"}
                      height={300}
                      width={300}
                      alt=""
                    />
                  </div>
                  <div className={`${styles.price_text}`}>

                    <span className={styles.label}>High </span>
                    <span className={styles.value}>{marketData?.Silver?.high ? marketData.Silver.high : 0}</span>
                    <span className={styles.separator}>/</span>
                    <span className={styles.label}>Low </span>
                    <span className={styles.value}>{marketData?.Silver?.low ? marketData.Silver.low : 0}</span>
                  </div>
                  <div className={`${styles.bar_icon}`}>
                    <Image
                      src={"/icons/silver-biscut.png"}
                      height={300}
                      width={300}
                      alt=""
                    />
                  </div>

                  <div className={styles.bidAsk_wrap}>
                    <div className={styles.bid}>
                      <span className={styles.label}>BID</span>
                      <span className={styles.bidValue}>
                        {/* {marketData?.Silver?.bid ? marketData.Silver.bid : 0} */}
                        {SilverbiddingPrice}
                      </span>
                    </div>
                  </div>

                  <div className={styles.bidAsk_wrap}>
                    <div className={styles.ask}>
                      <span className={styles.label}>ASK</span>
                      <span className={styles.askValue}>
                        {/* {marketData?.Silver?.offer ? marketData.Silver.offer : 0} */}
                        {SilverAskingPrice}
                      </span>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div className={`${styles.right_screen}`}>
            <div className={`${styles.video_screen}`}>
              <iframe
                width="560"
                height="315"
                src="https://www.youtube.com/embed/jJYKmLZOOBo?autoplay=1&mute=1&playsinline=1"
                title="YouTube video player"
                frameBorder="0"
                allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>

            </div>
            <div className={`${styles.chart_section}`}>
              <TradingViewMarketTable />
            </div>
            <div className={`${styles.logo_date_sec}`}>
              <div className={`${styles.main_logo}`}>
                <Image
                  src={"/images/logo.svg"}
                  height={300}
                  width={300}
                  alt=""
                />
              </div>
              <div className={`${styles.date_sec}`}>
                <div className={styles.dateBox}>
                  <div className={styles.date}>{date}</div>
                  <div className={styles.day}>{day}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.marquee_Sec}>
        <div className={styles.marquee_label}>
          JAS METAL GOLD TRADING
        </div>

        <div className={styles.marquee_wrap}>
          <div
            key={news.length}   // 👈 forces clean restart only when data changes
            className={styles.marquee_track}
            style={{ "--duration": `${Math.max(news.length * 6, 20)}s` }}

          >
            {news.map((item, i) => (
              <span key={`a-${i}`} className={styles.marquee_item}>
                {item}
              </span>
            ))}
            {news.map((item, i) => (
              <span key={`b-${i}`} className={styles.marquee_item}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.background_lines}>
        <Image src={'/images/lines.svg'} height={1000} width={1000} alt="" />
      </div>
    </div>
  );
};

export default MainScreen;
