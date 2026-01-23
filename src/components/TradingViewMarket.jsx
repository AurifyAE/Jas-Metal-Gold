"use client";

import { useEffect, useRef } from "react";

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
            isTransparent: true,
            showSymbolLogo: true,
            width: "100%",
            height: "100%",
            backgroundColor: "#000000",
            symbolsGroups: [
                {
                    name: "Forex",
                    symbols: [
                        { name: "FX_IDC:AEDUSD", displayName: "AED / USD" },
                        { name: "FX_IDC:AEDEUR", displayName: "AED / EUR" },
                        { name: "FX_IDC:AEDINR", displayName: "AED / INR" },
                        { name: "FX_IDC:AEDSGD", displayName: "AED / SGD" },
                        { name: "TICKMILL:EURUSD", displayName: "EUR / USD" },
                        { name: "FX_IDC:AEDGBP", displayName: "AED / GBP" },
                        { name: "FX_IDC:AEDMYX", displayName: "AED / MYR" }
                    ]
                }
            ]
        });

        containerRef.current.appendChild(script);
    }, []);

    return (
        <div className="w-full h-full  rounded-xl bg-[radial-gradient(circle_at_top,#141015,#070507)] p-2 overflow-hidden">
            <div
                ref={containerRef}
                className="w-full h-full tradingview-widget-container border-none outline-none shadow-none"
            >
                <div className="tradingview-widget-container__widget w-full h-full" />
            </div>


        </div>
    );
}
