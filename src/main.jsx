import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { PlaylistProvider } from "./context/playlistcontext";
import App from "./App";

import "./styles/global.css";

import { PlayerProvider } from "./context/PlayerContext";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "219737061264-18h6l27em1ef1orsbd8hpdh2snano3ne.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
       <PlaylistProvider>
         <PlayerProvider>
           <App />
         </PlayerProvider>
       </PlaylistProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

