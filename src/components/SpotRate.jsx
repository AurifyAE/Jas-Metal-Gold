import React, { useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useSpotRate } from "../context/SpotRateContext";

import goldImg from "/icons/gold-biscut.png";
import goldLabel from "/icons/gold-icon.svg";
import silverImg from "/icons/silver-biscut.png";
import silverLabel from "/icons/silver-icon.svg";

const SpotRate = () => {
  const { goldData, silverData } = useSpotRate();
  const [goldBidDir, setGoldBidDir] = useState("normal");
  const [goldAskDir, setGoldAskDir] = useState("normal");
  const [silverBidDir, setSilverBidDir] = useState("normal");
  const [silverAskDir, setSilverAskDir] = useState("normal");

  const prev = useRef({
    goldBid: null,
    goldAsk: null,
    silverBid: null,
    silverAsk: null,
  });
  const detectChange = (prevVal, currVal, setDir) => {
    if (prevVal === null) return currVal;

    if (currVal > prevVal) {
      setDir("up");
      setTimeout(() => setDir("normal"), 500);
    } else if (currVal < prevVal) {
      setDir("down");
      setTimeout(() => setDir("normal"), 500);
    }

    return currVal;
  };
  useEffect(() => {
    prev.current.goldBid = detectChange(
      prev.current.goldBid,
      goldData.bid,
      setGoldBidDir
    );
  }, [goldData.bid]);

  useEffect(() => {
    prev.current.goldAsk = detectChange(
      prev.current.goldAsk,
      goldData.ask,
      setGoldAskDir
    );
  }, [goldData.ask]);

  useEffect(() => {
    prev.current.silverBid = detectChange(
      prev.current.silverBid,
      silverData.bid,
      setSilverBidDir
    );
  }, [silverData.bid]);

  useEffect(() => {
    prev.current.silverAsk = detectChange(
      prev.current.silverAsk,
      silverData.ask,
      setSilverAskDir
    );
  }, [silverData.ask]);

  const getRateStyles = (dir) => {
    switch (dir) {
      case "up":
        return { background: "#1bbf4a", borderColor: "#1bbf4a" };
      case "down":
        return { background: "#c20000", borderColor: "#c20000" };
      default:
        return { background: "transparent", borderColor: "#ffffff" };
    }
  };

  const PriceBox = ({ label, value, dir }) => (
    <Box textAlign="center" display='flex' alignItems='center' gap='1vw'>
      <Typography sx={{ fontSize: "1.1vw", mb: "0.3vw" }}>
        {label}
      </Typography>
      <Box
        sx={{
          minWidth: "9vw",
          padding: "0.2vw 1vw",
          borderRadius: "10px",
          fontSize: "2vw",
          fontWeight: 700,
          border: "1px solid",
          color: "#fff",
          ...getRateStyles(dir),
        }}
      >
        {value}
      </Box>
    </Box>
  );

  const MetalCard = ({ labelIcon, img, data, bidDir, askDir }) => (
    <Box
      sx={{
        position: "relative",
        background: "linear-gradient(180deg,#1a1a1a,#0d0d0d)",
        borderRadius: "18px",
        padding: "1vw",
        mb: "1.7vw",
      }}
    >
      {/* FLOAT LABEL */}
      <Box
        sx={{
          position: "absolute",
          top: "-0.7vw",
          left: "-1vw",
          width: "13vw",
        }}
      >
        <img src={labelIcon} alt="" style={{ width: "100%" }} />
      </Box>

      {/* GRID */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr auto",
          gridTemplateRows: "auto auto",
          columnGap: "1vw",
          rowGap: "2vw",
          alignItems: "center",
        }}
      >
        <Box />

        {/* ROW 1 - HIGH / LOW */}
        <Typography sx={{ fontSize: "1.2vw", opacity: 0.85 }}>
          High <b>{data.high}</b> &nbsp; / &nbsp;
          Low <b>{data.low}</b>
        </Typography>

        {/* BAR ICON (SPANS BOTH ROWS) */}
        <Box
          sx={{
            gridRow: ' 1 / 3',
            gridColumn: '3 / 4',
            width: "6.5vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img src={img} alt="" style={{ width: "100%" }} />
        </Box>

        <PriceBox label="BID" value={data.bid} dir={bidDir} />



        <PriceBox label="ASK" value={data.ask} dir={askDir} />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ padding: "0vw 1vw", color: "#fff" }}>
      <MetalCard
        labelIcon={goldLabel}
        img={goldImg}
        data={goldData}
        bidDir={goldBidDir}
        askDir={goldAskDir}
      />

      <MetalCard
        labelIcon={silverLabel}
        img={silverImg}
        data={silverData}
        bidDir={silverBidDir}
        askDir={silverAskDir}
      />

    </Box>
  );
};

export default SpotRate;
