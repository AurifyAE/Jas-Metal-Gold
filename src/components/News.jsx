import React from "react";
import { Box, Typography } from "@mui/material";

const NewsTicker = ({ newsItems = [] }) => {
  // Ensure enough items for smooth scrolling
  const tickerItems =
    newsItems.length <= 1
      ? Array(5).fill(newsItems[0])
      : newsItems;

  return (
    <Box
      sx={{
        width: "100%",
        height: "3vw",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        background:
          " rgba(0,0,0,.4)",
        borderTop: "1px solid rgba(255,255,255,.1)",
        borderBottom: "1px solid rgba(255,255,255,.1)",
      }}
    >
      {/* LEFT BRAND */}
      <Typography
        sx={{
          color: "#ffffff",
          background:
            "linear-gradient(180deg, rgba(0,0,0), rgba(20,20,20))",
          fontSize: "1.2vw",
          whiteSpace: "nowrap",
          padding: "0 1.5vw",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        JAS METAL GOLD TRADING
      </Typography>

      {/* SCROLL AREA */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <Box
          sx={{
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            animation: "ticker 70s linear infinite",
          }}
        >
          {tickerItems.map((item, index) => (
            <Typography
              key={index}
              component="span"
              sx={{
                color: "#e6e6e6",
                fontSize: "1.3vw",
                fontWeight: 500,
                whiteSpace: "nowrap",
                marginRight: "4vw",
              }}
            >
              {item?.description || ""}
            </Typography>
          ))}
        </Box>
      </Box>

      {/* KEYFRAMES */}
      <style>
        {`
          @keyframes ticker {
            0% {
              transform: translateX(30%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
        `}
      </style>
    </Box>
  );
};

export default NewsTicker;
