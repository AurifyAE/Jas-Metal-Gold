import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";

const WorldClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatDate = () =>
        time
            .toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            })
            .toUpperCase();

    const formatDay = () =>
        time.toLocaleDateString("en-US", {
            weekday: "long",
        });

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            {/* DATE */}
            <Typography
                sx={{
                    fontSize: "1.5vw",
                    color: "#d9a441",
                    lineHeight: 1.2,
                    fontWeight:'700',
                    background: "linear-gradient(#d68e15, #b46a11)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    color: "transparent",
                }}
            >
                {formatDate()}
            </Typography>

            {/* DAY — GOLD GRADIENT */}
            <Typography
                sx={{
                    fontSize: "1.4vw",
                    background: "linear-gradient(#d68e15, #b46a11)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontWeight:'700',
                    backgroundClip: "text",
                    color: "transparent",
                }}
            >
                {formatDay()}
            </Typography>
        </Box>
    );
};

export default WorldClock;
