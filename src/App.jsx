import { useState, useEffect } from "react";
import { useConnectionState } from "use-connection-state";
import { SpotRateProvider } from "./context/SpotRateContext";
import "./App.css";
import TvScreen from "./pages/tvscreenView";
import ErrorPage from "./components/ErrorPage";

function App() {
  const [isTvScreen, setIsTvScreen] = useState(window.innerWidth >= 200);

  useEffect(() => {
    // Function to check the window size and update state
    const handleResize = () => {
      const isLargeScreen = window.innerWidth >= 200;
      setIsTvScreen(isLargeScreen);
    };

    // Initial check
    handleResize();

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <SpotRateProvider>
      {!isTvScreen ? <ErrorPage /> : <TvScreen />}
    </SpotRateProvider>
  );
}

export default App;
