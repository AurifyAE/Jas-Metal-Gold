import React from "react";
import { Box, Typography } from "@mui/material";
import mobileError from "/images/logo.svg";

const ErrorPage = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#16325B",
        color: "white",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <img src={mobileError} alt="" />
      <Typography variant="h3" sx={{ fontWeight: "bold", fontSize: "6vw" }}>
        This content is only available on Desktop or TV devices.
      </Typography>
    </Box>
  );
};

export default ErrorPage;
