import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { PlaylistProvider } from "./context/playlistcontext";
import App from "./App";

import "./styles/global.css";

import { PlayerProvider } from "./context/PlayerContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
     <PlayerProvider>
    <PlaylistProvider>
        <App />
    </PlaylistProvider>
</PlayerProvider>
    </BrowserRouter>
  </React.StrictMode>
);
