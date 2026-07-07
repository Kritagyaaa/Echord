import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { PlaylistProvider } from "./context/playlistcontext";
import App from "./App";

import "./styles/global.css";

import { PlayerProvider } from "./context/PlayerContext";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "219737061264-18h6l27em1ef1orsbd8hpdh2snano3ne.apps.googleusercontent.com";

const isCapacitor = !!(window.Capacitor || (window.location.hostname === 'localhost' && !window.location.port));
const Router = isCapacitor ? HashRouter : BrowserRouter;

console.log("Echord App Router Init:", {
  isCapacitor,
  hostname: window.location.hostname,
  port: window.location.port,
  protocol: window.location.protocol,
  hasCapacitorObject: !!window.Capacitor,
  selectedRouter: isCapacitor ? "HashRouter" : "BrowserRouter"
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <Router basename={isCapacitor ? undefined : import.meta.env.BASE_URL}>
       <PlaylistProvider>
         <PlayerProvider>
            <App />
         </PlayerProvider>
       </PlaylistProvider>
      </Router>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
