"use client";

import { useEffect, useRef } from "react";
import styles from "./TradingViewChart.module.scss";

export default function TradingViewMarketTable() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || containerRef.current.children.length > 0) return;

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js";
    script.async = true;

    script.innerHTML = JSON.stringify({
      width: "100%",
      height: "100%",
      symbolsGroups: [

        {
          symbols: [
            { name: "FX:USDINR", displayName: "USD / INR" },
            { name: "FX:EURUSD", displayName: "EUR / USD" },
            { name: "FX:GBPUSD", displayName: "GBP / USD" },
            { name: "OANDA:USDSGD", displayName: "USD / SGD" },
            { name: "OANDA:MYRUSD", displayName: "MYR / USD" },
          ],


        },
      ],
      showSymbolLogo: true,
      colorTheme: "dark",
      isTransparent: true,
      locale: "en",
    });

    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.table} />
    </div>
  );
}
