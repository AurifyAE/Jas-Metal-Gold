import React, { useCallback, useEffect, useState } from "react";
import { Grid, Paper, Typography, Box, useMediaQuery } from "@mui/material";
import SpotRate from "../components/SpotRate";
import CommodityTable from "../components/CommodityTable";
import NewsTicker from "../components/News";
import JasMetalLogo from "/images/logo.svg";
import AurifyLogo from "/images/logo.svg";

import {
  fetchSpotRates,
  fetchServerURL,
  fetchNews,
  fetchTVScreenData,
} from "../api/api";
import io from "socket.io-client";
import { useSpotRate } from "../context/SpotRateContext";
import WorldClock from "../components/WorldClock";
import TradingViewMarketTable from "../components/TradingViewMarket";
import YoutubeVideo from "../components/YoutubeVideo";

function TvScreen() {
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [dateTime, setDateTime] = useState(new Date());
  const [serverURL, setServerURL] = useState("");
  const [news, setNews] = useState([]);
  const [marketData, setMarketData] = useState({});
  const [commodities, setCommodities] = useState([]);
  const [goldBidSpread, setGoldBidSpread] = useState("");
  const [goldAskSpread, setGoldAskSpread] = useState("");
  const [silverBidSpread, setSilverBidSpread] = useState("");
  const [silverAskSpread, setSilverAskSpread] = useState("");
  const [symbols, setSymbols] = useState(["GOLD", "SILVER"]);
  const [error, setError] = useState(null);

  const { updateMarketData } = useSpotRate();

  const adminId = import.meta.env.VITE_APP_ADMIN_ID;

  updateMarketData(
    marketData,
    goldBidSpread,
    goldAskSpread,
    silverBidSpread,
    silverAskSpread
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [spotRatesRes, serverURLRes, newsRes] = await Promise.all([
          fetchSpotRates(adminId),
          fetchServerURL(),
          fetchNews(adminId),
        ]);

        // Handle Spot Rates
        const {
          commodities,
          goldBidSpread,
          goldAskSpread,
          silverBidSpread,
          silverAskSpread,
        } = spotRatesRes.data.info;
        setCommodities(commodities);
        setGoldBidSpread(goldBidSpread);
        setGoldAskSpread(goldAskSpread);
        setSilverBidSpread(silverBidSpread);
        setSilverAskSpread(silverAskSpread);

        // Handle Server URL
        const { serverURL } = serverURLRes.data.info;
        setServerURL(serverURL);

        // Handle News
        setNews(newsRes.data.news.news);

        console.log(newsRes.data);

      } catch (error) {
        console.log("Error fetching data:", error);
        setError("An error occurred while fetching data");
      }
    };

    fetchData();

    // Fetch TV screen data (you can leave this as a separate call)
    fetchTVScreenData(adminId)
      .then((response) => {
        console.log(response);
        if (response.status === 200) {
          // Allow TV screen view
          setShowLimitModal(false);
        }
      })
      .catch((error) => {
        if (error.response && error.response.status === 403) {
          setShowLimitModal(true); // Show the modal on 403 status
        } else {
          console.error("Error:", error.message);
          alert("An unexpected error occurred.");
        }
      });
  }, [adminId]);

  // Function to Fetch Market Data Using Socket
  useEffect(() => {
    if (serverURL) {
      const socket = io(serverURL, {
        query: { secret: import.meta.env.VITE_APP_SOCKET_SECRET_KEY },
        transports: ["websocket"],
        withCredentials: true,
      });

      socket.on("connect", () => {
        console.log("Connected to WebSocket server");
        socket.emit("request-data", symbols);
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from WebSocket server");
      });

      socket.on("market-data", (data) => {
        if (data && data.symbol) {
          setMarketData((prevData) => ({
            ...prevData,
            [data.symbol]: {
              ...prevData[data.symbol],
              ...data,
            },
          }));
        } else {
          console.warn("Received malformed market data:", data);
        }
      });

      socket.on("error", (error) => {
        console.error("WebSocket error:", error);
        setError("An error occurred while receiving data");
      });

      // Cleanup function to disconnect the socket
      return () => {
        socket.disconnect();
      };
    }
  }, [serverURL, symbols]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);



  return (
    <Box sx={{ minHeight: "100vh", color: "white", padding: "0 2vw ", display: 'flex', alignItems: 'center', backgroundImage: 'linear-gradient(220deg, #1f1f1f, #000)' }}>
      <div className='background_lines'>
        <img src="/images/pattern.svg" alt="Background Lines" />
      </div>
      {/* Grid */}
      <Grid
        container
        spacing={4}
        direction="row"
        minHeight="100%"
        // alignItems="flex-start"
        justifyContent="space-between"
        padding='1vw'
        border='1px solid #34291a'
        flexWrap='wrap'
      >
        {/* Side: SpotRate & Date Time */}
        <Grid item md={6.5}>


          <SpotRate />
          <CommodityTable commodities={commodities} />


        </Grid>

        {/* Side: Commodity Table */}
        <Grid item md={5.5}
          display='flex' flexDirection='column'
          justifyContent='space-between'
        >

          <Box className="flex flex-row items-center justify-around ">
            <Box
              sx={{
                height: "auto",
                width: "20vw",
                marginBottom: '1vw'
              }}
            >
              <img src={JasMetalLogo} alt="" />
            </Box>

            <WorldClock />

          </Box>
          <Box sx={{
            height: '18vw'
          }}>
            <TradingViewMarketTable />
          </Box>
          <Box sx={{
            height: '15vw',
            marginTop: '0.2vw'
          }}>
            <YoutubeVideo />
          </Box>

        </Grid>
        <Grid xs={12} sx={{
          position: 'fixed',
          bottom: '0',
          left: '0',
          width: '100%'
        }}>
          <NewsTicker newsItems={news} />
        </Grid>

      </Grid>

    </Box>
  );
}

export default TvScreen;
