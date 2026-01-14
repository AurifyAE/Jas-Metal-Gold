"use client";

import { useEffect, useRef } from "react";
import styles from "./TradingViewChart.module.scss";

export default function TradingViewMarketTable() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Prevent duplicate widget load
    if (containerRef.current.querySelector("script")) return;

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js";
    script.async = true;

    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      locale: "en",
      largeChartUrl: "",
      isTransparent: false,
      
      showSymbolLogo: true,
      backgroundColor: "#000000",
      width: "100%",
      height: "100%",
      symbolsGroups: [
        {
          name: "Indices",
          symbols: [
            { name: "FX_IDC:AEDUSD", displayName: "AED / USD" },
            { name: "FX_IDC:AEDEUR", displayName: "AED / EUR" },
            { name: "FX_IDC:AEDINR", displayName: "AED / INR" },
            { name: "FX_IDC:AEDSGD", displayName: "AED / SGD" },
            { name: "TICKMILL:EURUSD", displayName: "EUR / USD" },
            { name: "FX_IDC:AEDGBP", displayName: "AED / GBP" },
            { name: "FX_IDC:AEDMYX", displayName: "AED / MYX" }
          ]
        }
      ]
    });

    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className={styles.wrapper}>
      <div
        ref={containerRef}
        className={`tradingview-widget-container ${styles.table}`}
      >
        <div className="tradingview-widget-container__widget" />
         
      </div>
    </div>
  );
}
